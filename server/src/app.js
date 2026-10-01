import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import { createAuthenticate, createRequireRole } from "./middlewares/auth.js";
import { createErrorHandler } from "./middlewares/error.js";
import { createBackendServices } from "./utils/backendServices.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createAdminRouter } from "./routes/admin.routes.js";
import { createPropertyAdminRouter, createPropertyInvestorsRouter } from "./routes/propertyAdmin.routes.js";
import { createKycRouter } from "./routes/kyc.routes.js";
import { createInvestmentsRouter } from "./routes/investments.routes.js";
import { createPortfolioRouter } from "./routes/portfolio.routes.js";
import { createTransactionsRouter } from "./routes/transactions.routes.js";
import { createUploadsRouter } from "./routes/uploads.routes.js";
import { createWalletRouter } from "./routes/wallet.routes.js";
import { createPublicStatsRouter } from "./routes/publicStats.routes.js";
import { createBrokerRouter } from "./routes/broker.routes.js";
import { createNotificationsRouter } from "./routes/notifications.routes.js";
import { createEnquiriesRouter } from "./routes/enquiries.routes.js";
import { ApiError } from "./utils/ApiError.js";

export function createApp({ env, db, mediaAdapter, mailer, logger = console }) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  // The refresh token requires an explicit same-origin credentialed request; everything else
  // uses a bearer header, so the wildcard stays closed to credentialed cross-origin calls.
  app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["Retry-After"]
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Password reset is the only mail consumer; without SMTP it reports unavailability
  // rather than silently pretending a reset email was sent.
  const transport = mailer ?? (env.features.passwordReset
    ? nodemailer.createTransport({ host: env.smtp.host, port: env.smtp.port, secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass } })
    : null);
  const mail = transport ?? { async sendMail() { throw new Error("Mail transport is not configured"); } };

  const services = createBackendServices(db, { features: env.features, payment: env.payment,
    mediaAdapter, env, mailer: mail });
  const authenticate = createAuthenticate({ models: db.models, secret: env.jwt.secret });
  const requireRole = createRequireRole();
  const auth = { services, authenticate, requireRole, models: db.models };
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
  api.use("/auth", createAuthRouter({ ...auth, env }));
  api.use("/admin", createAdminRouter(auth));
  api.use("/admin/properties", createPropertyAdminRouter(auth));
  api.use("/properties", createPropertyInvestorsRouter(auth));
  api.use("/kyc", kyc.investor);
  api.use("/admin/kyc", kyc.admin);
  api.use("/investments", createInvestmentsRouter(auth));
  api.use("/portfolio", createPortfolioRouter(auth));
  api.use("/transactions", createTransactionsRouter(auth));
  api.use("/wallet", createWalletRouter(auth));
  api.use("/broker", createBrokerRouter(auth));
  api.use("/notifications", createNotificationsRouter(auth));
  api.use("/enquiries", createEnquiriesRouter(auth));
  app.use("/api/v1", api);

  app.use((_req, _res, next) => next(new ApiError("NOT_FOUND", "Resource not found")));
  app.use(createErrorHandler(logger));
  return { app, services };
}
