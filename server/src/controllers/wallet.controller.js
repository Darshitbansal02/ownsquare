import { actorId, send } from "../utils/http.js";

export function createWalletController({ wallet, withdrawals }) {
  return {
    get: async (req, res) => send(res, await wallet.get(actorId(req)), "Wallet retrieved"),
    order: async (req, res) => send(res, await wallet.order(actorId(req), req.validated.body.amount), "Mock payment - no real money", 201),
    verify: async (req, res) => send(res, await wallet.verify(actorId(req), req.validated.body), "Mock top-up credited"),
    withdraw: async (req, res) => send(res, await withdrawals.request(actorId(req), req.validated.body), "Simulated withdrawal reserved", 201),
    history: async (req, res) => send(res, await withdrawals.list(actorId(req), req.validated.query), "Withdrawals retrieved")
  };
}
