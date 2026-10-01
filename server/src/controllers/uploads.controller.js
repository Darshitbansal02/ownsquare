import { actorId, send } from "../utils/http.js";

export function createUploadsController({ uploads }) {
  return async (req, res) => send(res,
    await uploads.upload(actorId(req), req.validated.body.purpose, req.file), "Media uploaded", 201);
}
