import { rateLimit } from "express-rate-limit";

export const createRateLimit = (limit, windowMs = 60000) => rateLimit({
  windowMs, limit, standardHeaders: "draft-8", legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false, error: { code: "RATE_LIMITED", message: "Too many requests", details: [] }
  })
});
