import { createLedgerService } from "../services/ledger.service.js";
import { createWalletService } from "../services/wallet.service.js";
import { createWithdrawalService } from "../services/withdrawal.service.js";
import { createPropertyLifecycleService } from "../services/propertyLifecycle.service.js";
import { createInvestmentService } from "../services/investment.service.js";
import { createPayoutService } from "../services/payout.service.js";
import { createPortfolioService } from "../services/portfolio.service.js";
import { createUploadService } from "../services/upload.service.js";
import { createNotificationService } from "../services/notification.service.js";
import { createPublicStatsService, validatedFeatures } from "../services/publicStats.service.js";

export function createBackendServices(db, { features, payment, mediaAdapter }) {
  const context = { ...db, features: validatedFeatures(features), payment, mediaAdapter };
  const ledger = createLedgerService(context);
  const notifications = createNotificationService(context);
  const uploads = createUploadService(context);
  const financial = { ...context, ledger, notifications, uploads };
  return Object.freeze({
    ledger, notifications, uploads,
    wallet: createWalletService(financial),
    withdrawals: createWithdrawalService(financial),
    lifecycle: createPropertyLifecycleService(financial),
    investments: createInvestmentService(financial),
    payouts: createPayoutService(financial),
    portfolio: createPortfolioService(financial),
    publicStats: createPublicStatsService({ ...financial, paymentProvider: payment?.provider })
  });
}
