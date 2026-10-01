import { ApiError } from "../utils/ApiError.js";
import { requireActor } from "../utils/actors.js";
import { propertyDTO } from "../utils/dto.js";
import { multiply, sum } from "../utils/money.js";
import { validatePropertySubmission } from "../utils/propertyValidation.js";
import { inTransaction } from "../utils/transaction.js";

export function createPropertyLifecycleService({ connection, models, ledger, notifications, uploads }) {
  async function owned(actor, propertyId, session) {
    const property = await models.Property.findById(propertyId).session(session);
    if (!property || (actor.role === "BROKER" && String(property.brokerId) !== String(actor._id))) {
      throw new ApiError("NOT_FOUND", "Property not found");
    }
    return property;
  }
  async function guard(property, changes, session) {
    const updated = await models.Property.findOneAndUpdate({
      _id: property._id, status: property.status, version: property.version
    }, { $set: changes, $inc: { version: 1 } }, { session, new: true, runValidators: true });
    if (!updated) throw new ApiError("INVALID_PROPERTY_STATUS", "Property changed concurrently");
    return updated;
  }
  async function checkMedia(property, session) {
    if (!uploads?.verifyAttachments) throw new ApiError("SERVICE_UNAVAILABLE", "Upload verification must be integrated before publication");
    await uploads.verifyAttachments(property.createdBy, [...property.images, ...property.documents], "property", session);
  }
  async function submit(actorId, propertyId) {
    return inTransaction(connection, async (session) => {
      const actor = await requireActor(models, actorId, ["BROKER", "ADMIN"], session);
      if (actor.role === "BROKER" && !actor.brokerApproved) throw new ApiError("BROKER_NOT_APPROVED", "Broker approval is required");
      const property = await owned(actor, propertyId, session);
      if (actor.role === "ADMIN" && String(property.createdBy) !== String(actor._id)) throw new ApiError("NOT_FOUND", "Own draft required");
      if (!["DRAFT", "REJECTED"].includes(property.status)) throw new ApiError("INVALID_PROPERTY_STATUS", "Only drafts or rejected properties may be submitted");
      validatePropertySubmission(property);
      // Media verification is read-only. No uploads or other network writes are retried here.
      await checkMedia(property, session);
      return propertyDTO(models, await guard(property, { status: "PENDING_APPROVAL", rejectionReason: null }, session), session);
    });
  }
  async function approve(adminId, propertyId) {
    return inTransaction(connection, async (session) => {
      const actor = await requireActor(models, adminId, ["ADMIN"], session);
      const property = await owned(actor, propertyId, session);
      if (property.status !== "PENDING_APPROVAL") throw new ApiError("INVALID_PROPERTY_STATUS", "Pending approval required");
      validatePropertySubmission(property);
      await checkMedia(property, session);
      const result = await guard(property, { status: "LIVE", approvedBy: actor._id, liveAt: new Date() }, session);
      if (property.brokerId) await notifications.record({
        userId: property.brokerId, type: "PROPERTY_APPROVED", title: "Property approved",
        body: "Your property is now live.", link: `/broker/properties/${property._id}`
      }, session);
      return propertyDTO(models, result, session);
    });
  }
  async function reject(adminId, propertyId, reason) {
    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 2000) throw new ApiError("VALIDATION_ERROR", "Rejection reason is required");
    return inTransaction(connection, async (session) => {
      const actor = await requireActor(models, adminId, ["ADMIN"], session);
      const property = await owned(actor, propertyId, session);
      if (property.status !== "PENDING_APPROVAL") throw new ApiError("INVALID_PROPERTY_STATUS", "Pending approval required");
      const result = await guard(property, { status: "REJECTED", rejectionReason: reason.trim() }, session);
      if (property.brokerId) await notifications.record({
        userId: property.brokerId, type: "PROPERTY_REJECTED", title: "Property rejected",
        body: reason.trim(), link: `/broker/properties/${property._id}`
      }, session);
      return propertyDTO(models, result, session);
    });
  }
  async function changeStatus(adminId, propertyId, status) {
    if (!["HOLDING", "CANCELLED"].includes(status)) throw new ApiError("INVALID_PROPERTY_STATUS", "Only acquisition or cancellation is permitted");
    return inTransaction(connection, async (session) => {
      const actor = await requireActor(models, adminId, ["ADMIN"], session);
      const property = await owned(actor, propertyId, session);
      const required = status === "HOLDING" ? "FUNDED" : "LIVE";
      if (property.status !== required || (status === "HOLDING" && property.unitsSold !== property.totalUnits)) {
        throw new ApiError("INVALID_PROPERTY_STATUS", `${required} property required`);
      }
      const investments = status === "CANCELLED"
        ? await models.Investment.find({ propertyId, status: "ACTIVE" }).sort({ investorId: 1, _id: 1 }).session(session) : [];
      if (status === "CANCELLED" &&
          (sum(investments.map((row) => row.units), "units") !== property.unitsSold ||
           sum(investments.map((row) => row.amount)) !== multiply(property.unitsSold, property.unitPrice))) {
        throw new ApiError("CONFLICT", "Cancellation holdings do not reconcile");
      }
      const result = await guard(property, { status, ...(status === "CANCELLED" ? { unitsSold: 0 } : {}) }, session);
      for (const investment of investments) {
        await ledger.post({ userId: investment.investorId, type: "REFUND", direction: "CREDIT",
          amount: investment.amount, refType: "Investment", refId: String(investment._id) }, session);
        await models.Investment.updateOne({ _id: investment._id, status: "ACTIVE" }, {
          $set: { status: "REFUNDED" }
        }, { session, runValidators: true });
      }
      return {
        property: await propertyDTO(models, result, session),
        refundedAmount: sum(investments.map((row) => row.amount)), refundedInvestments: investments.length
      };
    });
  }
  return { submit, approve, reject, changeStatus };
}
