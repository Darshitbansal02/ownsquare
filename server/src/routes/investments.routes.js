import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { investmentCreate, investmentList } from "../validators/investments.schema.js";
import { createInvestmentsController } from "../controllers/investments.controller.js";

export function createInvestmentsRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["INVESTOR"]);
  const controller = createInvestmentsController(services);
  router.post("/", createRateLimit(30), validate(investmentCreate), controller.create);
  router.get("/me", validate(investmentList), controller.list);
  return router;
}
