import { z } from "zod";
import { KYC_STATUS } from "../../../shared/constants.js";
import { empty, idParams, media } from "./common.schema.js";

export const kycSubmit = {
  query: empty,
  body: z.object({
    docs: z.array(media).min(1, "At least one identification document is required"),
    selfie: media
  }).strict()
};

export const kycReview = {
  params: z.object({ userId: idParams.shape.id }).strict(),
  query: empty,
  body: z.object({
    status: z.enum([KYC_STATUS.APPROVED, KYC_STATUS.REJECTED]),
    reason: z.string().trim().min(1).max(2000).optional()
  }).strict().refine((data) => data.status !== KYC_STATUS.REJECTED || Boolean(data.reason),
    { message: "A reason is required when rejecting", path: ["reason"] })
};
