import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { publicStatistics } from "../validators/publicStats.schema.js";
import { createPublicStatsController } from "../controllers/publicStats.controller.js";

export function createPublicStatsRouter({ services, authenticate }) {
  if (typeof authenticate !== "function") throw new TypeError("Real authenticate middleware is required for supplied tokens");
  const router = Router();
  router.use((req, res, next) => {
    if (req.headers.authorization !== undefined) return authenticate(req, res, next);
    next();
  });
  router.get("/stats", validate(publicStatistics), createPublicStatsController(services));
  return router;
}
