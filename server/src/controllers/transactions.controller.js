import { actorId, send } from "../utils/http.js";

export function createTransactionsController({ ledger }) {
  return async (req, res) => {
    return send(res, await ledger.list(actorId(req), req.validated.query), "Transactions retrieved");
  };
}
