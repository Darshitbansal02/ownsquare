import { ApiError } from "../utils/ApiError.js";
import { integer, sum } from "../utils/money.js";
import { inTransaction } from "../utils/transaction.js";

export const FEATURE_NAMES = Object.freeze(["kyc", "withdrawals", "enquiries", "notifications", "passwordReset", "ownershipCap"]);
export function validatedFeatures(input) {
  if (!input || FEATURE_NAMES.some((key) => typeof input[key] !== "boolean") ||
      Object.keys(input).some((key) => !FEATURE_NAMES.includes(key))) {
    throw new ApiError("SERVICE_UNAVAILABLE", "Explicit server feature configuration is required");
  }
  return Object.freeze(Object.fromEntries(FEATURE_NAMES.map((key) => [key, input[key]])));
}

export function createPublicStatsService({ connection, models, features, paymentProvider }) {
  const capabilities = validatedFeatures(features);
  if (paymentProvider !== "mock") throw new ApiError("SERVICE_UNAVAILABLE", "This increment supports the approved mock provider only");
  async function get() {
    return inTransaction(connection, async (session) => {
      const rows = await models.Investment.find({ status: { $in: ["ACTIVE", "EXITED"] } }).select("amount").session(session);
      const investorCount = await models.User.countDocuments({ role: "INVESTOR", isActive: true }).session(session);
      return {
        totalRaised: sum(rows.map((row) => row.amount)),
        investorCount: integer(investorCount, "investorCount"),
        features: capabilities, paymentProvider
      };
    });
  }
  return { get };
}
