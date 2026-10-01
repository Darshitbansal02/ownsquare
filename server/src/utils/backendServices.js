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
import { createAdminService } from "../services/admin.service.js";
import { createKycService } from "../services/kyc.service.js";

export function createBackendServices(db, { features, payment, mediaAdapter }) {
  const context = { ...db, features: validatedFeatures(features), payment, mediaAdapter };
  const ledger = createLedgerService(context);
  const notifications = createNotificationService(context);
  // Media hosting is optional infrastructure. Without a configured adapter the upload service
  // is absent rather than faked: uploads answer 503 and publication refuses unverified media.
  const uploads = mediaAdapter ? createUploadService(context) : null;
  const financial = { ...context, ledger, notifications, uploads };
  const withdrawals = createWithdrawalService(financial);
  return Object.freeze({
    ledger, notifications, uploads, withdrawals,
    wallet: createWalletService(financial),
    lifecycle: createPropertyLifecycleService(financial),
    investments: createInvestmentService(financial),
    payouts: createPayoutService(financial),
    portfolio: createPortfolioService(financial),
    // Admin HTTP orchestration delegates all money and state transitions to the owners above.
    admin: createAdminService({ ...financial, withdrawals }),
    kyc: createKycService(financial),
    publicStats: createPublicStatsService({ ...financial, paymentProvider: payment?.provider })
  });
}
