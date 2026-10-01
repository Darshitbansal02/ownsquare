import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { createUploadService } from "./upload.service.js";
import { createPropertyLifecycleService } from "./propertyLifecycle.service.js";

let db;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=", "base64");
const file = { buffer: png, mimetype: "image/png", originalname: "dummy.png" };

// External-provider double only; actors, models, sessions and lifecycle are real.
function providerFixture() {
  const assets = new Map();
  return {
    async upload(_buffer, input) {
      const asset = { public_id: input.public_id, resource_type: input.resource_type,
        type: input.type, version: 1, context: { custom: input.context } };
      assets.set(asset.public_id, asset);
      return asset;
    },
    async resource(publicId) {
      const asset = assets.get(publicId);
      if (!asset) throw Object.assign(new Error("missing"), { http_code: 404 });
      return asset;
    },
    url(asset) { return `https://media.example.test/${asset.resource_type}/${asset.type}/v${asset.version}/${asset.public_id}`; }
  };
}
beforeAll(async () => { db = await openTestDatabase(); });
afterAll(async () => { if (db) await db.close(); });

describe("upload ownership/lifecycle with external-provider fixture", () => {
  it("restricts uploader roles/approval and verifies owner, purpose and URL", async () => {
    const adapter = providerFixture();
    const uploads = createUploadService({ ...db, mediaAdapter: adapter });
    const broker = await db.user("BROKER");
    const otherBroker = await db.user("BROKER");
    const investor = await db.user();
    const otherInvestor = await db.user();
    const admin = await db.user("ADMIN");
    const unapproved = await db.user("BROKER", { brokerApproved: false });
    await expect(uploads.upload(investor._id, "property", file)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(uploads.upload(unapproved._id, "property", file)).rejects.toMatchObject({ code: "BROKER_NOT_APPROVED" });
    const property = await uploads.upload(broker._id, "property", file);
    await expect(uploads.verifyAttachments(broker._id, [property], "property")).resolves.toBeUndefined();
    await expect(uploads.verifyAttachments(otherBroker._id, [property], "property")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(uploads.verifyAttachments(broker._id, [{ ...property, url: "https://external.example.test/injected" }], "property")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const adminAsset = await uploads.upload(admin._id, "property", file);
    await expect(uploads.verifyAttachments(broker._id, [adminAsset], "property")).resolves.toBeUndefined();
    const kyc = await uploads.upload(investor._id, "kyc", file);
    expect(kyc.url).toContain("/authenticated/");
    await expect(uploads.verifyAttachments(investor._id, [kyc], "kyc")).resolves.toBeUndefined();
    await expect(uploads.verifyAttachments(otherInvestor._id, [kyc], "kyc")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(uploads.verifyAttachments(investor._id, [property], "kyc")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("completes draft/reject/resubmit/approve using verified uploaded metadata", async () => {
    const uploads = createUploadService({ ...db, mediaAdapter: providerFixture() });
    const lifecycle = createPropertyLifecycleService({ ...db, uploads });
    const broker = await db.user("BROKER");
    const admin = await db.user("ADMIN");
    const images = [];
    for (let index = 0; index < 3; index += 1) images.push(await uploads.upload(broker._id, "property", file));
    const draft = await db.models.Property.create({
      createdBy: broker._id, brokerId: broker._id, title: "Dummy Apartment",
      description: "Dummy property disclosure for integration fixture.", type: "APARTMENT",
      address: "Dummy Street", city: "Noida", state: "UP", pincode: "201301", areaSqft: 1000,
      valuation: 10000, totalUnits: 100, unitPrice: 100, minUnits: 1,
      expectedAppreciationPct: 12, rentalYieldPct: 3, holdingPeriodMonths: 24, images
    });
    expect((await lifecycle.submit(broker._id, draft._id)).status).toBe("PENDING_APPROVAL");
    await lifecycle.reject(admin._id, draft._id, "Dummy correction");
    const submitted = await lifecycle.submit(broker._id, draft._id);
    expect(submitted.rejectionReason).toBeNull();
    expect((await lifecycle.approve(admin._id, draft._id)).status).toBe("LIVE");
    await expect(lifecycle.approve(admin._id, draft._id)).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
    expect(await db.models.Notification.countDocuments({ userId: broker._id, type: "PROPERTY_APPROVED" })).toBe(1);
  });
  it("surfaces provider failures without substituting successful uploads", async () => {
    const adapter = providerFixture();
    adapter.upload = async () => { throw new Error("provider-secret-detail"); };
    const uploads = createUploadService({ ...db, mediaAdapter: adapter });
    const admin = await db.user("ADMIN");
    await expect(uploads.upload(admin._id, "property", file)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", message: "Media upload failed" });
  });
  it("classifies malformed provider URLs as dependency errors, not client validation failures", async () => {
    const adapter = providerFixture();
    adapter.url = () => "invalid-provider-url";
    const uploads = createUploadService({ ...db, mediaAdapter: adapter });
    const admin = await db.user("ADMIN");
    await expect(uploads.upload(admin._id, "property", file)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE", status: 503, message: "Media provider URL generation failed"
    });
  });
});
