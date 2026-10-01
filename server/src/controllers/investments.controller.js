import { actorId, send } from "../utils/http.js";
import { parse } from "../middlewares/validate.js";
import { idempotencyKey } from "../validators/investments.schema.js";

export function createInvestmentsController({ investments }) {
  return {
    create: async (req, res) => {
      const result = await investments.invest(actorId(req), req.validated.body, parse(idempotencyKey, req.get("Idempotency-Key")));
      return send(res, result.data, "Investment confirmed", result.replay ? 200 : 201);
    },
    list: async (req, res) => send(res, await investments.list(actorId(req), req.validated.query), "Investments retrieved")
  };
}
