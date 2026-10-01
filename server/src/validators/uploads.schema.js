import { z } from "zod";
import { empty } from "./common.schema.js";

export const uploadInput = {
  query: empty, body: z.object({ purpose: z.enum(["property", "kyc"]) }).strict()
};
