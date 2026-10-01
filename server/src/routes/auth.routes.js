import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { createAuthController } from "../controllers/auth.controller.js";
import { ApiError } from "../utils/ApiError.js";
import {
  authForgotPassword, authLogin, authLogout, authRegister, authResetPassword
} from "../validators/auth.schema.js";
import { empty } from "../validators/common.schema.js";

export function createAuthRouter({ services, authenticate, env }) {
  const router = Router();
  const controller = createAuthController({ auth: services.auth, nodeEnv: env.nodeEnv });

  // Credential endpoints are rate limited independently of the global limiter.
  const credentialLimit = createRateLimit(20);
  router.use(credentialLimit);

  // The refresh cookie is the only credential here, so reject unexpected origins.
  const originGuard = (req, _res, next) => {
    const origin = req.headers.origin;
    if (origin && origin !== env.clientUrl) {
      return next(new ApiError("FORBIDDEN", "Cross-origin request rejected"));
    }
    return next();
  };

  router.post("/register", validate(authRegister), controller.register);
  router.post("/login", validate(authLogin), controller.login);
  router.post("/refresh", originGuard, validate({ query: empty, body: empty }), controller.refresh);
  router.post("/forgot-password", validate(authForgotPassword), controller.forgotPassword);
  router.post("/reset-password/:token", validate(authResetPassword), controller.resetPassword);
  router.post("/logout", authenticate, validate(authLogout), controller.logout);
  router.get("/me", authenticate, controller.me);
  return router;
}
