import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openTestDatabase } from "../utils/testHarness.js";
import { createPropertyLifecycleService } from "./propertyLifecycle.service.js";

let db;
let lifecycle;
beforeAll(async () => {
  db = await openTestDatabase();
  lifecycle = createPropertyLifecycleService({ ...db, notifications: db.notifications });
});
afterAll(async () => { if (db) await db.close(); });

describe("lifecycle transaction/ownership guards", () => {
  it("rejects incomplete submission and hides foreign drafts", async () => {
    const broker = await db.user("BROKER");
    const stranger = await db.user("BROKER");
    const investor = await db.user();
    const draft = await db.models.Property.create({ createdBy: broker._id, brokerId: broker._id });
    await expect(lifecycle.submit(investor._id, draft._id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(lifecycle.submit(stranger._id, draft._id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(lifecycle.submit(broker._id, draft._id)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect((await db.models.Property.findById(draft._id)).status).toBe("DRAFT");
  });
  it("rejects pending once, persists reason and notification together", async () => {
    const broker = await db.user("BROKER");
    const admin = await db.user("ADMIN");
    const pending = await db.models.Property.create({ createdBy: broker._id, brokerId: broker._id, status: "PENDING_APPROVAL" });
    await expect(lifecycle.reject(admin._id, pending._id, " ")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const result = await lifecycle.reject(admin._id, pending._id, "Correct the location");
    expect(result.status).toBe("REJECTED");
    expect(result.rejectionReason).toBe("Correct the location");
    await expect(lifecycle.reject(admin._id, pending._id, "Again")).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
    expect(await db.models.Notification.countDocuments({ userId: broker._id, type: "PROPERTY_REJECTED" })).toBe(1);
  });
  it("permits only documented admin acquisition/cancellation states", async () => {
    const admin = await db.user("ADMIN");
    const live = await db.models.Property.create({ createdBy: admin._id, valuation: 1000, totalUnits: 10,
      unitPrice: 100, minUnits: 1, status: "LIVE", liveAt: new Date() });
    await expect(lifecycle.changeStatus(admin._id, live._id, "HOLDING")).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
    await expect(lifecycle.changeStatus(admin._id, live._id, "SOLD")).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
    const cancelled = await lifecycle.changeStatus(admin._id, live._id, "CANCELLED");
    expect(cancelled.property.status).toBe("CANCELLED");
    expect(cancelled.refundedAmount).toBe(0);
    await expect(lifecycle.changeStatus(admin._id, live._id, "CANCELLED")).rejects.toMatchObject({ code: "INVALID_PROPERTY_STATUS" });
  });
});
