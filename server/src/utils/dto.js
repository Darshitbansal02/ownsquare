export const id = (value) => value === null || value === undefined ? null : String(value);
export const iso = (value) => value === null || value === undefined ? null : new Date(value).toISOString();
const pick = (row, fields) => Object.fromEntries(fields.map((field) => [field, row[field] ?? null]));
export const mediaDTO = (row) => pick(row, ["url", "publicId", "name"]);

export function userDTO(row) {
  return {
    _id: id(row._id), ...pick(row, ["name", "email", "phone", "role", "isActive", "brokerApproved"]),
    kyc: pick(row.kyc, ["status", "reason"]), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt)
  };
}

export function investmentDTO(row, totalUnits) {
  return {
    _id: id(row._id), investorId: id(row.investorId), propertyId: id(row.propertyId),
    ...pick(row, ["units", "amount", "status", "payoutAmount"]),
    ownershipPct: row.units / totalUnits * 100,
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt)
  };
}

export async function propertyDTO(models, row, session) {
  const investors = await models.Investment.distinct("investorId", {
    propertyId: row._id, status: { $ne: "REFUNDED" }
  }).session(session || null);
  return {
    _id: id(row._id),
    ...pick(row, ["title", "description", "type", "address", "city", "state", "pincode", "areaSqft",
      "valuation", "totalUnits", "unitPrice", "minUnits", "maxUnitsPerInvestor", "unitsSold",
      "expectedAppreciationPct", "rentalYieldPct", "holdingPeriodMonths", "status", "rejectionReason", "salePrice"]),
    geo: row.geo ? pick(row.geo, ["lat", "lng"]) : null,
    images: row.images.map(mediaDTO), documents: row.documents.map(mediaDTO),
    brokerId: id(row.brokerId), createdBy: id(row.createdBy), approvedBy: id(row.approvedBy),
    liveAt: iso(row.liveAt), fundedAt: iso(row.fundedAt), soldAt: iso(row.soldAt),
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
    fundingPct: row.totalUnits ? row.unitsSold / row.totalUnits * 100 : 0,
    remainingUnits: row.totalUnits ? row.totalUnits - row.unitsSold : 0,
    investorCount: investors.length
  };
}

export function transactionDTO(row) {
  return {
    _id: id(row._id), userId: id(row.userId),
    ...pick(row, ["type", "direction", "amount", "balanceAfter", "refType", "refId"]),
    ...(row.gatewayOrderId ? { gatewayOrderId: row.gatewayOrderId } : {}),
    ...(row.gatewayPaymentId ? { gatewayPaymentId: row.gatewayPaymentId } : {}),
    createdAt: iso(row.createdAt)
  };
}
export function withdrawalDTO(row) {
  return {
    _id: id(row._id), userId: id(row.userId), ...pick(row, ["amount", "status", "reason"]),
    bankDetails: pick(row.bankDetails, ["accountHolder", "accountNumber", "ifsc"]),
    processedBy: id(row.processedBy), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt)
  };
}
export function payoutDTO(row) {
  return {
    _id: id(row._id), propertyId: id(row.propertyId),
    ...pick(row, ["salePrice", "platformFeePct", "platformFee", "distributable"]),
    items: row.items.map((item) => ({ investorId: id(item.investorId), units: item.units, amount: item.amount })),
    executedBy: id(row.executedBy), executedAt: iso(row.executedAt)
  };
}
export function notificationDTO(row) {
  return {
    _id: id(row._id), userId: id(row.userId), ...pick(row, ["type", "title", "body", "link", "read"]),
    createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt)
  };
}
