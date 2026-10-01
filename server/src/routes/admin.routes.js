import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createAdminController } from "../controllers/admin.controller.js";
import {
  adminPropertiesQuery, adminSettingsUpdate, adminStatsQuery, adminUserUpdate,
  adminUsersQuery, adminWithdrawalReview, adminWithdrawalsQuery
} from "../validators/admin.schema.js";

export function createAdminRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["ADMIN"]);
  const controller = createAdminController(services);
  router.get("/stats", validate(adminStatsQuery), controller.stats);
  router.get("/users", validate(adminUsersQuery), controller.users);
  router.patch("/users/:id", validate(adminUserUpdate), controller.updateUser);
  router.get("/settings", controller.getSettings);
  router.patch("/settings", validate(adminSettingsUpdate), controller.updateSettings);
  router.get("/withdrawals", validate(adminWithdrawalsQuery), controller.withdrawals);
  router.patch("/withdrawals/:id", validate(adminWithdrawalReview), controller.processWithdrawal);
  router.get("/properties", validate(adminPropertiesQuery), controller.properties);
  return router;
}
