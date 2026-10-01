import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { transactionList } from "../validators/transactions.schema.js";
import { createTransactionsController } from "../controllers/transactions.controller.js";

export function createTransactionsRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole);
  router.get("/", validate(transactionList), createTransactionsController(services));
  return router;
}
