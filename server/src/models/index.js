import { userSchema } from "./User.js";
import { propertySchema } from "./Property.js";
import { investmentSchema } from "./Investment.js";
import { transactionSchema } from "./Transaction.js";
import { payoutSchema } from "./Payout.js";
import { withdrawalSchema } from "./Withdrawal.js";
import { enquirySchema } from "./Enquiry.js";
import { notificationSchema } from "./Notification.js";
import { settingsSchema } from "./Settings.js";
import { refreshTokenSchema } from "./RefreshToken.js";

export function getModels(connection) {
  return Object.fromEntries([
    ["User", userSchema, "users"], ["Property", propertySchema, "properties"],
    ["Investment", investmentSchema, "investments"], ["Transaction", transactionSchema, "transactions"],
    ["Payout", payoutSchema, "payouts"], ["Withdrawal", withdrawalSchema, "withdrawals"],
    ["Enquiry", enquirySchema, "enquiries"], ["Notification", notificationSchema, "notifications"],
    ["Settings", settingsSchema, "settings"], ["RefreshToken", refreshTokenSchema, "refreshtokens"]
  ].map(([name, schema, collection]) => [
    name, connection.models[name] || connection.model(name, schema, collection)
  ]));
}
