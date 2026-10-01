import { send } from "../utils/http.js";

export function createPublicStatsController({ publicStats }) {
  return async (_req, res) => send(res, await publicStats.get(), "Platform statistics retrieved");
}
