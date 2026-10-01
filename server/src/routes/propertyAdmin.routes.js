import express from "express";
import { protectedRouter, send } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { createPropertyAdminController } from "../controllers/propertyAdmin.controller.js";
import { propertyDTO } from "../utils/dto.js";
import { ApiError } from "../utils/ApiError.js";
import {
  adminPayoutPreview, adminPropertyApprove, adminPropertyInvestors, adminPropertyReject,
  adminPropertySell, adminPropertyStatus
} from "../validators/admin.schema.js";

export function createPropertyAdminRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["ADMIN"]);
  const controller = createPropertyAdminController(services);
  router.post("/:id/approve", createRateLimit(30), validate(adminPropertyApprove), controller.approve);
  router.post("/:id/reject", createRateLimit(30), validate(adminPropertyReject), controller.reject);
  router.post("/:id/status", createRateLimit(30), validate(adminPropertyStatus), controller.updateStatus);
  router.get("/:id/payout-preview", validate(adminPayoutPreview), controller.preview);
  router.post("/:id/sell", createRateLimit(10), validate(adminPropertySell), controller.sell);
  return router;
}

// Public listing + details, plus protected broker/admin investor inspection.
export function createPropertyInvestorsRouter({ services, authenticate, requireRole, models }) {
  const router = express.Router();
  const controller = createPropertyAdminController(services);

  // Public property listing (for Marketplace & Landing page)
  router.get("/", async (req, res, next) => {
    try {
      const allowed = ["LIVE", "FUNDED", "HOLDING", "SOLD"];
      const statusParam = req.query.status;
      const statusFilter = statusParam && allowed.includes(statusParam) ? statusParam : { $in: allowed };
      const query = { ...req.query, status: statusFilter };
      const result = await services.admin.allProperties(query);
      return send(res, result, "Properties retrieved");
    } catch (err) {
      next(err);
    }
  });

  // Admin and the owning broker may inspect an asset's investors; foreign brokers must not.
  router.get("/:id/investors", authenticate, requireRole("ADMIN", "BROKER"), validate(adminPropertyInvestors), controller.investors);

  // Public property details by ID
  router.get("/:id", async (req, res, next) => {
    try {
      const property = await models.Property.findById(req.params.id);
      if (!property) throw new ApiError("NOT_FOUND", "Property not found");
      const dto = await propertyDTO(models, property);
      return send(res, dto, "Property retrieved");
    } catch (err) {
      next(err);
    }
  });

  return router;
}
