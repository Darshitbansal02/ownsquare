import { randomUUID } from "node:crypto";
import request from "supertest";
import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { openTestDatabase } from "../utils/testHarness.js";

const JWT_SECRET = "integration_test_secret_value_32chars";
const CLIENT_URL = "http://localhost:5173";
const features = { kyc: true, withdrawals: true, enquiries: true, notifications: true, passwordReset: false, ownershipCap: true };
const env = {
  nodeEnv: "test", clientUrl: CLIENT_URL, jwt: { secret: JWT_SECRET, expiresIn: "15m" },
  features, payment: { provider: "mock", secret: "mock_payment_secret_at_least_32_chars" }, cloudinary: {}
};

const tokenFor = (user) => jwt.sign({ sub: String(user._id), role: user.role, sessionVersion: user.sessionVersion }, JWT_SECRET);

// In-memory media provider double: models, sessions, lifecycle and finance services are real.
// Only the external CDN is simulated, so approved-upload ownership checks still run for real.
function mediaProvider() {
  const assets = new Map();
  const register = (ownerId, name) => {
    const publicId = `ownsquare/property/${ownerId}/${randomUUID()}`;
    const asset = { public_id: publicId, resource_type: "image", type: "upload", version: 1,
      context: { custom: { ownerId: String(ownerId), purpose: "property", originalName: name, mimeType: "image/png" } } };
    assets.set(publicId, asset);
    return { url: `https://media.example.test/image/upload/v1/${publicId}`, publicId, name };
  };
  return {
    register,
    async upload() { throw new Error("not used in this suite"); },
    async resource(publicId) {
      const asset = assets.get(publicId);
      if (!asset) throw Object.assign(new Error("missing"), { http_code: 404 });
      return asset;
    },
    url(asset) { return `https://media.example.test/${asset.resource_type}/${asset.type}/v${asset.version}/${asset.public_id}`; }
  };
}
const mediaStub = mediaProvider();

describe("admin HTTP orchestration (integrated with Dhruv's finance services)", () => {
  let db; let app; let shutdown;

  beforeEach(async () => {
    db = await openTestDatabase();
    ({ app } = createApp({ env, db, mediaAdapter: mediaStub, logger: { error() {} } }));
    shutdown = db.close;
  });
  afterEach(async () => shutdown());

  async function admin() {
    const user = await db.models.User.create({ name: "Root Admin", email: `${randomUUID()}@example.test`,
      phone: "9999999999", passwordHash: "fixture", role: "ADMIN" });
    return { user, token: tokenFor(user) };
  }

  // Investment rows are created directly here only to reach a funded/HOLDING state quickly.
  // responseSnapshot is required and immutable at insert, so ids and timestamps are minted here.
  async function holdingInvestment({ investorId, propertyId, units, amount }) {
    const property = await db.models.Property.findById(propertyId);
    const now = new Date().toISOString();
    const rowId = new db.models.Investment()._id;
    return db.models.Investment.create({
      _id: rowId, investorId, propertyId, units, amount, status: "ACTIVE", payoutAmount: 0,
      idempotencyKey: randomUUID(), requestFingerprint: { propertyId, units },
      responseSnapshot: {
        investment: { _id: String(rowId), investorId: String(investorId), propertyId: String(propertyId),
          units, amount, status: "ACTIVE", payoutAmount: 0, ownershipPct: units / property.totalUnits * 100,
          createdAt: now, updatedAt: now },
        property: { _id: String(propertyId), unitsSold: property.totalUnits, fundingPct: 100, status: "FUNDED" },
        walletBalance: 0
      }
    });
  }

  it("rejects an investor calling admin stats with 403", async () => {
    const investor = await db.user("INVESTOR");
    const response = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${tokenFor(investor)}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects a request with no token with 401", async () => {
    const response = await request(app).get("/api/v1/admin/stats");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("fails a deactivated admin with 401 even holding a previously valid token", async () => {
    const { user, token } = await admin();
    await db.models.User.updateOne({ _id: user._id }, { $set: { isActive: false } });
    const response = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it("rejects a token whose sessionVersion was incremented by logout", async () => {
    const { user, token } = await admin();
    await db.models.User.updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });
    const response = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it("returns platform stats for an authenticated admin", async () => {
    const { token } = await admin();
    await db.settings();
    const response = await request(app).get("/api/v1/admin/stats").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.usersByRole.ADMIN).toBeGreaterThan(0);
    expect(response.body.data.propertiesByStatus).toHaveLength(8);
  });

  it("refuses to deactivate the last active admin", async () => {
    const { user, token } = await admin();
    const response = await request(app).patch(`/api/v1/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`).send({ isActive: false });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("activates a user and invalidates that user's existing sessions", async () => {
    const { token } = await admin();
    const investor = await db.user("INVESTOR");
    const investorToken = tokenFor(investor);
    const updated = await request(app).patch(`/api/v1/admin/users/${investor._id}`)
      .set("Authorization", `Bearer ${token}`).send({ isActive: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data.isActive).toBe(false);
    const after = await request(app).get("/api/v1/wallet").set("Authorization", `Bearer ${investorToken}`);
    expect(after.status).toBe(401);
  });

  it("rejects broker approval for a non-broker account", async () => {
    const { token } = await admin();
    const investor = await db.user("INVESTOR");
    const response = await request(app).patch(`/api/v1/admin/users/${investor._id}`)
      .set("Authorization", `Bearer ${token}`).send({ brokerApproved: true });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("never returns password or reset-token hashes in the user list", async () => {
    const { token } = await admin();
    const response = await request(app).get("/api/v1/admin/users").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    const serialised = JSON.stringify(response.body);
    expect(serialised).not.toContain("passwordHash");
    expect(serialised).not.toContain("resetTokenHash");
  });

  it("validates settings precision instead of silently truncating", async () => {
    const { token } = await admin();
    await db.settings();
    const rejected = await request(app).patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${token}`).send({ platformFeePct: 2.345 });
    expect(rejected.status).toBe(400);
    const accepted = await request(app).patch("/api/v1/admin/settings")
      .set("Authorization", `Bearer ${token}`).send({ platformFeePct: 2.5 });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.platformFeePct).toBe(2.5);
  });

  it("runs the source payout example through preview then sell exactly once", async () => {
    const { user: adminUser, token } = await admin();
    await db.models.Settings.create({ feeAccountUserId: adminUser._id });
    const property = await db.models.Property.create({
      createdBy: adminUser._id, valuation: 1000000000, totalUnits: 1000, unitPrice: 1000000,
      minUnits: 1, status: "HOLDING", liveAt: new Date(), unitsSold: 1000, fundedAt: new Date()
    });
    // The source walkthrough: 20 + 50 + 400 + 300 + 230 = 1000 units across five investors.
    const expected = [[20, 27440000], [50, 68600000], [400, 548800000], [300, 411600000], [230, 315560000]];
    for (const [units] of expected) {
      const investor = await db.user("INVESTOR");
      await holdingInvestment({ investorId: investor._id, propertyId: property._id, units, amount: units * 1000000 });
    }

    const preview = await request(app).get(`/api/v1/admin/properties/${property._id}/payout-preview?salePrice=1400000000`)
      .set("Authorization", `Bearer ${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.platformFee).toBe(28000000);
    expect(preview.body.data.distributable).toBe(1372000000);
    // Every holder receives exactly the source document's rupee figures.
    for (const [units, payout] of expected) {
      expect(preview.body.data.items.find((row) => row.units === units).amount).toBe(payout);
    }
    // Conservation: shares plus fee must reconstruct the sale price to the paisa.
    expect(preview.body.data.items.reduce((total, row) => total + row.amount, 0)).toBe(1372000000);
    expect(preview.body.data.platformFee + preview.body.data.items.reduce((t, row) => t + row.amount, 0))
      .toBe(1400000000);

    const sold = await request(app).post(`/api/v1/admin/properties/${property._id}/sell`)
      .set("Authorization", `Bearer ${token}`).send({ salePrice: 1400000000, expectedPlatformFeePct: 2 });
    expect(sold.status).toBe(200);
    expect(sold.body.data.property.status).toBe("SOLD");

    // Idempotency: a second execution must not credit any wallet twice.
    const repeat = await request(app).post(`/api/v1/admin/properties/${property._id}/sell`)
      .set("Authorization", `Bearer ${token}`).send({ salePrice: 1400000000, expectedPlatformFeePct: 2 });
    expect(repeat.status).toBe(409);
    expect(repeat.body.error.code).toBe("ALREADY_SOLD");
    const credits = await db.models.Transaction.countDocuments({ type: "PAYOUT" });
    // Five investors, five credits: the repeat attempt added nothing.
    expect(credits).toBe(5);
  });

  it("refuses to sell when the platform fee changed since the preview", async () => {
    const { user: adminUser, token } = await admin();
    await db.models.Settings.create({ feeAccountUserId: adminUser._id });
    const property = await db.models.Property.create({
      createdBy: adminUser._id, valuation: 1000000000, totalUnits: 1000, unitPrice: 1000000,
      minUnits: 1, status: "HOLDING", liveAt: new Date(), unitsSold: 1000, fundedAt: new Date()
    });
    const investor = await db.user("INVESTOR");
    await holdingInvestment({ investorId: investor._id, propertyId: property._id, units: 1000, amount: 1000000000 });
    const response = await request(app).post(`/api/v1/admin/properties/${property._id}/sell`)
      .set("Authorization", `Bearer ${token}`).send({ salePrice: 1400000000, expectedPlatformFeePct: 1.5 });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("PREVIEW_STALE");
  });

  it("masks investor names for a broker and refuses a foreign broker", async () => {
    const owner = await db.user("BROKER");
    const stranger = await db.user("BROKER");
    const property = await db.models.Property.create({ createdBy: owner._id, brokerId: owner._id,
      valuation: 1000000, totalUnits: 100, unitPrice: 10000, minUnits: 1, status: "LIVE", liveAt: new Date() });
    const investor = await db.user("INVESTOR");
    await holdingInvestment({ investorId: investor._id, propertyId: property._id, units: 10, amount: 100000 });

    const own = await request(app).get(`/api/v1/properties/${property._id}/investors`)
      .set("Authorization", `Bearer ${tokenFor(owner)}`);
    expect(own.status).toBe(200);
    expect(own.body.data.items[0].displayName).toMatch(/\*\*\*/);

    const foreign = await request(app).get(`/api/v1/properties/${property._id}/investors`)
      .set("Authorization", `Bearer ${tokenFor(stranger)}`);
    expect(foreign.status).toBe(404);
  });

  it("approves a pending property into LIVE through the shared lifecycle service", async () => {
    const { token } = await admin();
    const owner = await db.user("ADMIN");
    const property = await db.models.Property.create({
      title: "2BHK, Sector 150, Noida", description: "A sufficiently long academic listing description.",
      type: "APARTMENT", address: "Demo Block A", city: "Noida", state: "Uttar Pradesh", pincode: "201310",
      areaSqft: 1200, images: [mediaStub.register(owner._id, "Exterior"),
        mediaStub.register(owner._id, "Living room"), mediaStub.register(owner._id, "Bedroom")],
      documents: [], valuation: 1000000000, totalUnits: 1000, unitPrice: 1000000, minUnits: 1,
      expectedAppreciationPct: 12, rentalYieldPct: 3, holdingPeriodMonths: 24,
      createdBy: owner._id, status: "PENDING_APPROVAL"
    });
    const response = await request(app).post(`/api/v1/admin/properties/${property._id}/approve`)
      .set("Authorization", `Bearer ${token}`).send({});
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("LIVE");
    expect(response.body.data.liveAt).not.toBeNull();
  });

  it("refuses to approve a property whose media was never an approved upload", async () => {
    const { token } = await admin();
    const owner = await db.user("ADMIN");
    const property = await db.models.Property.create({
      title: "Unverified media listing", description: "A sufficiently long academic listing description.",
      type: "APARTMENT", address: "Demo Block B", city: "Noida", state: "Uttar Pradesh", pincode: "201310",
      areaSqft: 900, images: [{ url: "https://example.test/a.jpg", publicId: "a", name: "a" },
        { url: "https://example.test/b.jpg", publicId: "b", name: "b" },
        { url: "https://example.test/c.jpg", publicId: "c", name: "c" }],
      documents: [], valuation: 1000000, totalUnits: 100, unitPrice: 10000, minUnits: 1,
      expectedAppreciationPct: 10, rentalYieldPct: 3, holdingPeriodMonths: 12,
      createdBy: owner._id, status: "PENDING_APPROVAL"
    });
    const response = await request(app).post(`/api/v1/admin/properties/${property._id}/approve`)
      .set("Authorization", `Bearer ${token}`).send({});
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires a reason when rejecting a property", async () => {
    const { token } = await admin();
    const owner = await db.user("ADMIN");
    const property = await db.models.Property.create({ createdBy: owner._id, valuation: 1000000, totalUnits: 100,
      unitPrice: 10000, minUnits: 1, status: "PENDING_APPROVAL" });
    const rejected = await request(app).post(`/api/v1/admin/properties/${property._id}/reject`)
      .set("Authorization", `Bearer ${token}`).send({ reason: "   " });
    expect(rejected.status).toBe(400);
    const accepted = await request(app).post(`/api/v1/admin/properties/${property._id}/reject`)
      .set("Authorization", `Bearer ${token}`).send({ reason: "Please attach the valuation certificate." });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.rejectionReason).toBe("Please attach the valuation certificate.");
  });

  it("approves a pending KYC and rejects resubmission afterwards", async () => {
    const { token } = await admin();
    const investor = await db.user("INVESTOR", { kyc: { status: "PENDING", docs: [
      { url: "https://res.cloudinary.com/demo/image/upload/id.jpg", publicId: "id", name: "id" }] } });
    const approved = await request(app).patch(`/api/v1/admin/kyc/${investor._id}`)
      .set("Authorization", `Bearer ${token}`).send({ status: "APPROVED" });
    expect(approved.status).toBe(200);
    expect(approved.body.data.kyc.status).toBe("APPROVED");
    const replay = await request(app).patch(`/api/v1/admin/kyc/${investor._id}`)
      .set("Authorization", `Bearer ${token}`).send({ status: "REJECTED", reason: "changed my mind" });
    expect(replay.status).toBe(409);
    expect(replay.body.error.code).toBe("INVALID_KYC_STATUS");
  });

  it("requires a reason when rejecting KYC", async () => {
    const { token } = await admin();
    const investor = await db.user("INVESTOR", { kyc: { status: "PENDING", docs: [
      { url: "https://res.cloudinary.com/demo/image/upload/id.jpg", publicId: "id", name: "id" }] } });
    const response = await request(app).patch(`/api/v1/admin/kyc/${investor._id}`)
      .set("Authorization", `Bearer ${token}`).send({ status: "REJECTED" });
    expect(response.status).toBe(400);
  });

  it("reports health as ok against a connected database", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: "ok", database: "connected" });
  });

  it("returns a sanitised 404 envelope for an unknown route", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, error: { code: "NOT_FOUND",
      message: "Resource not found", details: [] } });
  });
});
