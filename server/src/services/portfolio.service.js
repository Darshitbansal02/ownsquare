import { ApiError } from "../utils/ApiError.js";
import { requireActor } from "../utils/actors.js";
import { propertyDTO } from "../utils/dto.js";
import { integer, sum } from "../utils/money.js";
import { inTransaction } from "../utils/transaction.js";

export function estimatedValue(invested, appreciationPct, liveAt, now) {
  integer(invested);
  if (!liveAt || !Number.isFinite(new Date(liveAt).getTime()) || !Number.isFinite(now.getTime()) ||
      !Number.isFinite(appreciationPct) || appreciationPct < 0 || appreciationPct > 100) {
    throw new ApiError("CONFLICT", "Holding estimate inputs are invalid");
  }
  const years = Math.max(0, (now.getTime() - new Date(liveAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return integer(Math.round(invested * (1 + appreciationPct / 100) ** years), "estimatedValue");
}

export function createPortfolioService({ connection, models, ledger, clock = () => new Date() }) {
  async function summary(investorId) {
    return inTransaction(connection, async (session) => {
      await requireActor(models, investorId, ["INVESTOR"], session);
      const rows = await models.Investment.find({ investorId }).sort({ propertyId: 1, _id: 1 }).session(session);
      const groups = new Map();
      for (const row of rows) {
        const key = String(row.propertyId);
        const group = groups.get(key) || [];
        group.push(row);
        groups.set(key, group);
      }
      const holdings = [];
      const allocation = [];
      const now = clock();
      for (const [propertyId, investments] of groups) {
        const property = await models.Property.findById(propertyId).session(session);
        if (!property) throw new ApiError("CONFLICT", "Holding property missing");
        const statuses = new Set(investments.map((row) => row.status));
        if (statuses.size !== 1) throw new ApiError("CONFLICT", "Holding statuses do not reconcile");
        const status = investments[0].status;
        const units = sum(investments.map((row) => row.units), "units");
        const invested = sum(investments.map((row) => row.amount));
        const payoutAmount = sum(investments.map((row) => row.payoutAmount));
        const value = status === "ACTIVE" ? estimatedValue(invested, property.expectedAppreciationPct, property.liveAt, now)
          : status === "EXITED" ? payoutAmount : invested;
        holdings.push({
          property: await propertyDTO(models, property, session), units,
          ownershipPct: units / property.totalUnits * 100, invested, estimatedValue: value,
          payoutAmount, status, roiPct: invested ? (value - invested) / invested * 100 : null
        });
        if (status === "ACTIVE") allocation.push({ propertyId, title: property.title, amount: invested });
      }
      const totalInvested = sum(holdings.map((row) => row.invested));
      const currentValue = sum(holdings.map((row) => row.estimatedValue));
      const payouts = await models.Transaction.find({ userId: investorId, type: "PAYOUT", direction: "CREDIT" }).select("amount").session(session);
      const totalPayouts = sum(payouts.map((row) => row.amount));
      if (totalPayouts !== sum(holdings.map((row) => row.payoutAmount))) throw new ApiError("CONFLICT", "Portfolio payouts do not reconcile");
      return {
        totalInvested, currentValue, totalPayouts,
        overallRoiPct: totalInvested ? (currentValue - totalInvested) / totalInvested * 100 : null,
        wallet: await ledger.read(investorId, session), holdings, allocation
      };
    });
  }
  return { summary };
}
