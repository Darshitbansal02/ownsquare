import { protectedRouter } from "../utils/http.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { createWalletController } from "../controllers/wallet.controller.js";
import { walletRead, topupOrder, topupVerify, withdraw, withdrawalHistory } from "../validators/wallet.schema.js";

export function createWalletRouter({ services, authenticate, requireRole }) {
  const router = protectedRouter(authenticate, requireRole, ["INVESTOR"]);
  const controller = createWalletController(services);
  router.get("/", validate(walletRead), controller.get);
  router.post("/topup/order", createRateLimit(20), validate(topupOrder), controller.order);
  router.post("/topup/verify", createRateLimit(30), validate(topupVerify), controller.verify);
  router.post("/withdraw", validate(withdraw), controller.withdraw);
  router.get("/withdrawals", validate(withdrawalHistory), controller.history);
  return router;
}
