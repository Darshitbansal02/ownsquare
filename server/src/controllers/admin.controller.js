import { actorId, send } from "../utils/http.js";

export function createAdminController({ admin }) {
  return {
    stats: async (req, res) => {
      const { from, to } = req.validated.query;
      return send(res, await admin.stats(from ? new Date(from) : undefined, to ? new Date(to) : undefined), "Platform stats retrieved");
    },
    users: async (req, res) => send(res, await admin.users(req.validated.query), "Users retrieved"),
    updateUser: async (req, res) =>
      send(res, await admin.updateUser(actorId(req), req.validated.params.id, req.validated.body), "User updated"),
    getSettings: async (_req, res) => send(res, await admin.getSettings(), "Settings retrieved"),
    updateSettings: async (req, res) => send(res, await admin.updateSettings(actorId(req), req.validated.body), "Settings updated"),
    withdrawals: async (req, res) => send(res, await admin.listWithdrawals(req.validated.query), "Withdrawals retrieved"),
    processWithdrawal: async (req, res) =>
      send(res, await admin.processWithdrawal(actorId(req), req.validated.params.id, req.validated.body), "Withdrawal processed"),
    properties: async (req, res) => send(res, await admin.allProperties(req.validated.query), "Properties retrieved")
  };
}
