import { z } from "zod";
import { INVESTMENT_STATUS } from "../../../shared/constants.js";
import { empty, listQuery, objectId, positiveInteger } from "./common.schema.js";

export const investmentInput = z.object({ propertyId: objectId, units: positiveInteger }).strict();
export const idempotencyKey = z.string().uuid().transform((value) => value.toLowerCase());
export const investmentCreate = { query: empty, body: investmentInput };
export const investmentList = {
  query: listQuery(["createdAt", "amount"], {
    propertyId: objectId.optional(), status: z.enum(Object.values(INVESTMENT_STATUS)).optional()
  })
};
