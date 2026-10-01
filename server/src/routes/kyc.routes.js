import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { createKycController } from "../controllers/kyc.controller.js";
import { kycReview, kycSubmit } from "../validators/kyc.schema.js";

export function createKycRouter({ services, authenticate, requireRole }) {
  const controller = createKycController(services);
  const investor = protectedRouter(authenticate, requireRole, ["INVESTOR"]);
  investor.post("/", createRateLimit(10), validate(kycSubmit), controller.submit);
  const admin = protectedRouter(authenticate, requireRole, ["ADMIN"]);
  admin.patch("/:userId", validate(kycReview), controller.review);
  return { investor, admin };
}
