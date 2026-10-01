import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createAuthenticate, createRequireRole } from "./middlewares/auth.js";
import { createErrorHandler } from "./middlewares/error.js";
import { createRateLimit } from "./middlewares/rateLimit.js";
import { createBackendServices } from "./utils/backendServices.js";
import { createAdminRouter } from "./routes/admin.routes.js";
import { createPropertyAdminRouter, createPropertyInvestorsRouter } from "./routes/propertyAdmin.routes.js";
import { createKycRouter } from "./routes/kyc.routes.js";
import { createInvestmentsRouter } from "./routes/investments.routes.js";
import { createPortfolioRouter } from "./routes/portfolio.routes.js";
import { createTransactionsRouter } from "./routes/transactions.routes.js";
import { createUploadsRouter } from "./routes/uploads.routes.js";
import { createWalletRouter } from "./routes/wallet.routes.js";
import { createPublicStatsRouter } from "./routes/publicStats.routes.js";
import { ApiError } from "./utils/ApiError.js";

export function createApp({ env, db, mediaAdapter, logger = console }) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  // Credentialed CORS is not used: the P0 contract is a bearer token, never a cookie.
  app.use(cors({ origin: env.clientUrl, credentials: false }));
  app.use(express.json({ limit: "100kb" }));

  const services = createBackendServices(db, { features: env.features, payment: env.payment, mediaAdapter });
  const authenticate = createAuthenticate({ models: db.models, secret: env.jwt.secret });
  const requireRole = createRequireRole();
  const auth = { services, authenticate, requireRole };
  const kyc = createKycRouter(auth);

  app.get("/health", async (_req, res) => {
    try {
      const ready = db.connection.db?.admin() ? await db.connection.db.admin().ping() : null;
      if (!ready) throw new ApiError("SERVICE_UNAVAILABLE", "Database is not reachable");
      return res.status(200).json({ success: true, data: { status: "ok", database: "connected" }, message: "Service healthy" });
    } catch {
      return res.status(503).json({ success: false, error: { code: "SERVICE_UNAVAILABLE",
        message: "Service is not ready", details: [] } });
    }
  });

  const api = express.Router();
  api.use("/platform", createPublicStatsRouter(auth));
  api.use("/uploads", createUploadsRouter(auth));
  api.use("/auth", createRateLimit(20)); // Register/login arrive with Devang's auth module.
  api.use("/admin", createAdminRouter(auth));
  api.use("/admin/properties", createPropertyAdminRouter(auth));
  api.use("/properties", createPropertyInvestorsRouter(auth));
  api.use("/kyc", kyc.investor);
  api.use("/admin/kyc", kyc.admin);
  api.use("/investments", createInvestmentsRouter(auth));
  api.use("/portfolio", createPortfolioRouter(auth));
  api.use("/transactions", createTransactionsRouter(auth));
  api.use("/wallet", createWalletRouter(auth));
  app.use("/api/v1", api);

  app.use((_req, _res, next) => next(new ApiError("NOT_FOUND", "Resource not found")));
  app.use(createErrorHandler(logger));
  return { app, services };
}
