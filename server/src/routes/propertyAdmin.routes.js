import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { createPropertyAdminController } from "../controllers/propertyAdmin.controller.js";
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

// Admin and the owning broker may inspect an asset's investors; foreign brokers must not.
export function createPropertyInvestorsRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["ADMIN", "BROKER"]);
  const controller = createPropertyAdminController(services);
  router.get("/:id/investors", validate(adminPropertyInvestors), controller.investors);
  return router;
}
