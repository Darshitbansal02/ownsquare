import { ApiError } from "../utils/ApiError.js";
import { requireActor } from "../utils/actors.js";
import { userDTO } from "../utils/dto.js";
import { requireFeature } from "../utils/actors.js";
import { inTransaction } from "../utils/transaction.js";

export function createKycService({ connection, models, features, notifications }) {
  const { User } = models;

  // POST /kyc. Dummy documents only; assets must already be privately uploaded by this investor.
  async function submit(actorId, data) {
    requireFeature(features, "kyc");
    return inTransaction(connection, async (session) => {
      const investor = await requireActor(models, actorId, ["INVESTOR"], session);
      if (["PENDING", "APPROVED"].includes(investor.kyc.status)) {
        throw new ApiError("KYC_ALREADY_SUBMITTED", "KYC has already been submitted or approved");
      }
      const updated = await User.findOneAndUpdate({ _id: investor._id },
        { $set: { kyc: { status: "PENDING", docs: data.docs, selfie: data.selfie, reason: null,
          reviewedBy: null, reviewedAt: null } } },
        { session, new: true, runValidators: true });
      return { status: updated.kyc.status, docs: updated.kyc.docs, selfie: updated.kyc.selfie, reason: null };
    });
  }

  // PATCH /admin/kyc/:userId. Review is admin-only and permitted only from PENDING.
  async function review(actorId, investorId, data) {
    requireFeature(features, "kyc");
    return inTransaction(connection, async (session) => {
      const admin = await requireActor(models, actorId, ["ADMIN"], session);
      if (data.status === "REJECTED" && (typeof data.reason !== "string" || !data.reason.trim())) {
        throw new ApiError("VALIDATION_ERROR", "A rejection reason is required");
      }
      const investor = await User.findById(investorId).session(session);
      if (!investor) throw new ApiError("NOT_FOUND", "Investor not found");
      if (investor.role !== "INVESTOR") throw new ApiError("VALIDATION_ERROR", "KYC applies to investor accounts only");
      if (investor.kyc.status !== "PENDING") {
        throw new ApiError("INVALID_KYC_STATUS", "Only pending submissions may be reviewed");
      }
      const updated = await User.findOneAndUpdate({ _id: investor._id, "kyc.status": "PENDING" },
        { $set: { "kyc.status": data.status, "kyc.reason": data.status === "REJECTED" ? data.reason.trim() : null,
          "kyc.reviewedBy": admin._id, "kyc.reviewedAt": new Date() } },
        { session, new: true, runValidators: true });
      if (!updated) throw new ApiError("INVALID_KYC_STATUS", "Submission changed concurrently");
      await notifications.record({
        userId: updated._id, type: data.status === "APPROVED" ? "KYC_APPROVED" : "KYC_REJECTED",
        title: `KYC ${data.status.toLowerCase()}`,
        body: data.status === "APPROVED" ? "You may now invest in live properties." : updated.kyc.reason,
        link: "/investor/kyc"
      }, session);
      return userDTO(updated);
    });
  }

  return { submit, review };
}
