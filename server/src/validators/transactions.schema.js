import { z } from "zod";
import { TRANSACTION_DIRECTIONS, TRANSACTION_TYPES } from "../../../shared/constants.js";
import { dateFilters, listQuery, objectId } from "./common.schema.js";

export const transactionList = {
  query: listQuery(["createdAt", "amount"], {
    type: z.enum(Object.values(TRANSACTION_TYPES)).optional(),
    direction: z.enum(Object.values(TRANSACTION_DIRECTIONS)).optional(),
    userId: objectId.optional(), ...dateFilters
  })
};
