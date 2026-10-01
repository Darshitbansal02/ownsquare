import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { portfolioSummary } from "../validators/portfolio.schema.js";
import { createPortfolioController } from "../controllers/portfolio.controller.js";

export function createPortfolioRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["INVESTOR"]);
  router.get("/summary", validate(portfolioSummary), createPortfolioController(services));
  return router;
}
