import { z } from "zod";
import { WITHDRAWAL_STATUS } from "../../../shared/constants.js";
import { bankDetails, empty, listQuery, positiveInteger } from "./common.schema.js";

export const walletRead = { query: empty };
export const topupOrder = { query: empty, body: z.object({ amount: positiveInteger }).strict() };
export const topupVerify = {
  query: empty, body: z.object({
    gatewayOrderId: z.string().min(1).max(100), gatewayPaymentId: z.string().min(1).max(100),
    mockOrderToken: z.string().min(1).max(2048)
  }).strict()
};
export const withdraw = {
  query: empty, body: z.object({ amount: positiveInteger, bankDetails }).strict()
};
export const withdrawalHistory = {
  query: listQuery(["createdAt"], { status: z.enum(Object.values(WITHDRAWAL_STATUS)).optional() })
};
