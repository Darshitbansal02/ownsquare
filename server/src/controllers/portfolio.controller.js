import { actorId, send } from "../utils/http.js";

export function createPortfolioController({ portfolio }) {
  return async (req, res) => send(res, await portfolio.summary(actorId(req)), "Portfolio retrieved");
}
