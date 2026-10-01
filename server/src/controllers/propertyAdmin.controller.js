import { actorId, send } from "../utils/http.js";

export function createPropertyAdminController({ lifecycle, payouts, admin }) {
  return {
    approve: async (req, res) =>
      send(res, await lifecycle.approve(actorId(req), req.validated.params.id), "Property approved and now LIVE"),
    reject: async (req, res) =>
      send(res, await lifecycle.reject(actorId(req), req.validated.params.id, req.validated.body.reason), "Property rejected"),
    updateStatus: async (req, res) =>
      send(res, await lifecycle.changeStatus(actorId(req), req.validated.params.id, req.validated.body.status), "Property status updated"),
    preview: async (req, res) =>
      send(res, await payouts.preview(actorId(req), req.validated.params.id, req.validated.query.salePrice), "Payout preview calculated"),
    sell: async (req, res) =>
      send(res, await payouts.execute(actorId(req), req.validated.params.id, req.validated.body), "Sale recorded and payouts credited"),
    investors: async (req, res) =>
      send(res, await admin.propertyInvestors(req.user, req.validated.params.id, req.validated.query), "Property investors retrieved")
  };
}
