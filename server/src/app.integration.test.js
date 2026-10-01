import { MongoMemoryReplSet } from "mongodb-memory-server";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config/env.js";
import { connectDatabase } from "./config/db.js";

// End-to-end startup smoke test: real replica set, real environment validation, real HTTP.
// Proves the documented boot path works without needing an external Atlas cluster.
const base = {
  NODE_ENV: "test", JWT_SECRET: "boot_smoke_test_secret_value_32chars",
  CLIENT_URL: "http://localhost:5173", PAYMENT_PROVIDER: "mock",
  MOCK_PAYMENT_SECRET: "boot_smoke_mock_secret_at_least_32chars",
  KYC_ENABLED: "true", WITHDRAWALS_ENABLED: "true", ENQUIRIES_ENABLED: "true",
  NOTIFICATIONS_ENABLED: "true", PASSWORD_RESET_ENABLED: "false", OWNERSHIP_CAP_ENABLED: "true",
  PORT: "5099"
};

describe("application bootstrap", () => {
  let replica; let db; let app;

  beforeAll(async () => {
    replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    db = await connectDatabase(replica.getUri(`boot_${randomUUID().replaceAll("-", "")}`));
    const env = loadEnvironment({ ...base, MONGO_URI: replica.getUri("ownsquare") });
    ({ app } = createApp({ env, db, mediaAdapter: null, logger: { error() {} } }));
  });
  afterAll(async () => { if (db) await db.connection.close(); if (replica) await replica.stop(); });

  it("loads environment configuration with validated providers and features", () => {
    const env = loadEnvironment({ ...base, MONGO_URI: "mongodb://localhost:27017/x?replicaSet=rs0" });
    expect(env.payment.provider).toBe("mock");
    expect(env.port).toBe(5099);
    expect(env.features.passwordReset).toBe(false);
    expect(env.features.kyc).toBe(true);
  });

  it("refuses to start with a weak JWT secret rather than falling back to a default", () => {
    expect(() => loadEnvironment({ ...base, MONGO_URI: "mongodb://x/db", JWT_SECRET: "short" }))
      .toThrow("JWT_SECRET");
  });

  it("refuses a non-test Razorpay key so live payments cannot be configured", () => {
    expect(() => loadEnvironment({ ...base, MONGO_URI: "mongodb://x/db",
      PAYMENT_PROVIDER: "razorpay", RAZORPAY_KEY_ID: "rzp_live_abc", RAZORPAY_KEY_SECRET: "s" }))
      .toThrow("test-mode");
  });

  it("refuses password reset without SMTP configuration", () => {
    expect(() => loadEnvironment({ ...base, MONGO_URI: "mongodb://x/db", PASSWORD_RESET_ENABLED: "true" }))
      .toThrow("SMTP");
  });

  it("refuses an unknown payment provider instead of defaulting", () => {
    expect(() => loadEnvironment({ ...base, MONGO_URI: "mongodb://x/db", PAYMENT_PROVIDER: "stripe" }))
      .toThrow("mock or razorpay");
  });

  it("answers the health endpoint and serves public platform stats", async () => {
    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body.data).toEqual({ status: "ok", database: "connected" });

    const stats = await request(app).get("/api/v1/platform/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.data.paymentProvider).toBe("mock");
    expect(stats.body.data.features.kyc).toBe(true);
  });

  it("rejects unauthenticated access to a protected route", async () => {
    const response = await request(app).get("/api/v1/investments/me");
    expect(response.status).toBe(401);
  });
});
