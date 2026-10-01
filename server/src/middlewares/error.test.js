import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createErrorHandler } from "./error.js";
import { validate } from "./validate.js";
import { topupOrder } from "../validators/wallet.schema.js";

describe("error and strict request envelopes (no protected endpoints)", () => {
  it("rejects unknown authoritative fields without echoing their values", async () => {
    const app = express();
    app.use(express.json());
    app.post("/validation-only", validate(topupOrder), (_req, res) => res.json({ unexpected: true }));
    app.use(createErrorHandler({ error: vi.fn() }));
    const result = await request(app).post("/validation-only").send({ amount: 100, walletBalance: 500 });
    expect(result.status).toBe(400);
    expect(result.body.success).toBe(false);
    expect(result.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(result.body.error.details)).toBe(true);
  });
  it("sanitizes unexpected errors and logs only category/code", async () => {
    const logger = { error: vi.fn() };
    const app = express();
    app.get("/unexpected", () => { throw new Error("secret-provider-token"); });
    app.use(createErrorHandler(logger));
    const result = await request(app).get("/unexpected");
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server error", details: [] } });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("secret-provider-token");
  });
});
