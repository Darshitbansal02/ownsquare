const enumeration = (values) => Object.freeze(Object.fromEntries(values.map((value) => [value, value])));

export const ROLES = enumeration(["ADMIN", "BROKER", "INVESTOR"]);
export const PROPERTY_STATUS = enumeration(["DRAFT", "PENDING_APPROVAL", "LIVE", "FUNDED", "HOLDING", "SOLD", "REJECTED", "CANCELLED"]);
export const PROPERTY_TYPES = enumeration(["APARTMENT", "VILLA", "COMMERCIAL", "PLOT", "WAREHOUSE"]);
export const TRANSACTION_TYPES = enumeration(["TOPUP", "INVESTMENT", "PAYOUT", "REFUND", "COMMISSION", "WITHDRAWAL", "FEE"]);
export const TRANSACTION_DIRECTIONS = enumeration(["CREDIT", "DEBIT"]);
export const INVESTMENT_STATUS = enumeration(["ACTIVE", "EXITED", "REFUNDED"]);
export const KYC_STATUS = enumeration(["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"]);
export const WITHDRAWAL_STATUS = enumeration(["PENDING", "APPROVED", "REJECTED"]);
export const ENQUIRY_STATUS = enumeration(["OPEN", "CLOSED"]);
export const NOTIFICATION_TYPES = enumeration(["PROPERTY_APPROVED", "PROPERTY_REJECTED", "FUNDING_COMPLETE", "PAYOUT_CREDITED", "KYC_APPROVED", "KYC_REJECTED", "WITHDRAWAL_APPROVED", "WITHDRAWAL_REJECTED", "ENQUIRY_REPLY"]);
