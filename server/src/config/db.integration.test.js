import { MongoMemoryServer } from "mongodb-memory-server";
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "./db.js";
import { openTestDatabase } from "../utils/testHarness.js";

describe("explicit database/configuration readiness", () => {
  it("rejects standalone MongoDB instead of downgrading financial writes", async () => {
    const standalone = await MongoMemoryServer.create();
    try {
      await expect(connectDatabase(standalone.getUri("readiness_fixture"))).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE", message: "Transaction-capable MongoDB is required"
      });
    } finally {
      await standalone.stop();
    }
  });
  it("rejects missing Settings without substituting fee or ownership defaults", async () => {
    const db = await openTestDatabase();
    try {
      const investor = await db.user();
      const property = await db.liveProperty();
      await db.credit(investor._id, 1000);
      await expect(db.investments.invest(investor._id, {
        propertyId: String(property._id), units: 1
      }, randomUUID())).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
      expect((await db.models.Property.findById(property._id)).unitsSold).toBe(0);
      expect((await db.wallet.get(investor._id)).balance).toBe(1000);
    } finally {
      await db.close();
    }
  });
  it("fails closed after the real database connection has been closed", async () => {
    const db = await openTestDatabase();
    try {
      const investor = await db.user();
      await db.connection.close();
      await expect(db.wallet.get(investor._id)).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE", message: "Database is not connected"
      });
      await expect(db.wallet.order(investor._id, 100)).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE", message: "Database is not connected"
      });
    } finally {
      await db.close();
    }
  });
});
