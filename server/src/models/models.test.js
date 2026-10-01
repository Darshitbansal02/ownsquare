import mongoose from "mongoose";
import { afterAll, describe, expect, it } from "vitest";
import { getModels } from "./index.js";

const connection = mongoose.createConnection();
const models = getModels(connection);
afterAll(() => connection.close());

describe("canonical models", () => {
  it("registers exactly nine collections with required uniqueness and no reset TTL", () => {
    expect(Object.keys(models)).toHaveLength(9);
    const indexes = models.Transaction.schema.indexes();
    expect(indexes.filter(([, options]) => options.unique)).toHaveLength(4);
    expect(indexes.some(([fields, options]) => fields.gatewayOrderId && options.partialFilterExpression)).toBe(true);
    expect(models.User.schema.indexes().some(([, options]) => options.expireAfterSeconds !== undefined)).toBe(false);
    expect(models.Payout.schema.indexes().some(([fields, options]) => fields.propertyId && options.unique)).toBe(true);
  });
  it("supports empty drafts but rejects invalid supplied financials", async () => {
    const createdBy = new mongoose.Types.ObjectId();
    await expect(new models.Property({ createdBy }).validate()).resolves.toBeUndefined();
    await expect(new models.Property({ createdBy, valuation: 101, totalUnits: 1, unitPrice: 101 }).validate()).rejects.toThrow();
    await expect(new models.Property({ createdBy, valuation: 1000, totalUnits: 10, unitPrice: 100, minUnits: 11 }).validate()).rejects.toThrow();
  });
  it("rejects unsafe/negative wallet values and external notification links", async () => {
    const user = { name: "Test User", email: "test@example.com", phone: "9999999999", passwordHash: "test-hash", role: "INVESTOR" };
    await expect(new models.User({ ...user, walletBalance: -1 }).validate()).rejects.toThrow();
    await expect(new models.Notification({ userId: new mongoose.Types.ObjectId(), type: "PAYOUT_CREDITED", title: "Payout", body: "Done", link: "//external.example" }).validate()).rejects.toThrow();
  });
});
