import { randomUUID } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase } from "../config/db.js";
import { createLedgerService } from "../services/ledger.service.js";
import { createWalletService } from "../services/wallet.service.js";
import { createWithdrawalService } from "../services/withdrawal.service.js";
import { createNotificationService } from "../services/notification.service.js";
import { createInvestmentService } from "../services/investment.service.js";
import { createPropertyLifecycleService } from "../services/propertyLifecycle.service.js";
import { inTransaction } from "./transaction.js";

export async function openTestDatabase() {
  const replica = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const databaseName = `ownsquare_test_${randomUUID().replaceAll("-", "")}`;
  let db;
  try {
    db = await connectDatabase(replica.getUri(databaseName));
  } catch (error) {
    await replica.stop();
    throw error;
  }
  const features = { kyc: true, withdrawals: true, enquiries: true, notifications: true, passwordReset: false, ownershipCap: true };
  const payment = { provider: "mock", secret: randomUUID() };
  const context = { ...db, features, payment };
  const ledger = createLedgerService(context);
  const notifications = createNotificationService(context);
  const wallet = createWalletService({ ...context, ledger });
  const withdrawals = createWithdrawalService({ ...context, ledger, notifications });
  const investments = createInvestmentService({ ...context, ledger, notifications });
  const lifecycle = createPropertyLifecycleService({ ...context, ledger, notifications });
  async function user(role = "INVESTOR", extra = {}) {
    return db.models.User.create({
      name: "Fixture Actor", email: `${randomUUID()}@example.test`, phone: "9999999999",
      passwordHash: "unused-domain-fixture-hash", role, kyc: { status: "APPROVED" },
      brokerApproved: role === "BROKER", ...extra
    });
  }
  async function credit(userId, amount) {
    const orderId = `fixture_order_${randomUUID()}`;
    return inTransaction(db.connection, (session) => ledger.post({
      userId, type: "TOPUP", direction: "CREDIT", amount, refType: "TopupOrder", refId: orderId,
      gatewayOrderId: orderId, gatewayPaymentId: `fixture_payment_${randomUUID()}`
    }, session));
  }
  async function settings() {
    const existing = await db.models.Settings.findOne({ singletonKey: "platform" });
    if (existing) return existing;
    const admin = await user("ADMIN");
    return db.models.Settings.create({ feeAccountUserId: admin._id });
  }
  async function close() {
    await db.connection.close();
    await replica.stop();
  }
  async function liveProperty(extra = {}) {
    const admin = await user("ADMIN");
    return db.models.Property.create({
      createdBy: admin._id, valuation: 10000, totalUnits: 100, unitPrice: 100,
      minUnits: 1, status: "LIVE", liveAt: new Date(), expectedAppreciationPct: 12, ...extra
    });
  }
  return { ...context, ledger, notifications, wallet, withdrawals, investments, lifecycle, user, credit, settings, liveProperty, close };
}
