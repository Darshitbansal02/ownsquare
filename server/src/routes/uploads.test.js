import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMultipartParser } from "./uploads.routes.js";
import { validate } from "../middlewares/validate.js";
import { uploadInput } from "../validators/uploads.schema.js";
import { createErrorHandler } from "../middlewares/error.js";
import { MAX_UPLOAD_BYTES } from "../services/upload.service.js";

function parserApp() {
  const app = express();
  app.post("/parser-only", createMultipartParser(), validate(uploadInput), (req, res) => {
    res.json({ purpose: req.validated.body.purpose, size: req.file.buffer.length });
  });
  app.use(createErrorHandler());
  return app;
}

describe("multipart parser only (not authenticated HTTP proof)", () => {
  it("accepts one file plus purpose and rejects excess size", async () => {
    const app = parserApp();
    const valid = await request(app).post("/parser-only").field("purpose", "property")
      .attach("file", Buffer.from("dummy"), "dummy.png");
    expect(valid.status).toBe(200);
    expect(valid.body).toEqual({ purpose: "property", size: 5 });
    const oversized = await request(app).post("/parser-only").field("purpose", "kyc")
      .attach("file", Buffer.alloc(MAX_UPLOAD_BYTES + 1), "dummy.png");
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe("UPLOAD_TOO_LARGE");
  });
});
