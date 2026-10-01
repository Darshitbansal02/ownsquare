import { actorId, send } from "../utils/http.js";

export function createKycController({ kyc }) {
  return {
    submit: async (req, res) =>
      send(res, await kyc.submit(actorId(req), req.validated.body), "KYC submitted successfully", 201),
    review: async (req, res) =>
      send(res, await kyc.review(actorId(req), req.validated.params.userId, req.validated.body), "KYC review completed")
  };
}
