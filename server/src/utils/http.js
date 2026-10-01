import { Router } from "express";

export function protectedRouter(authenticate, requireRole, roles) {
  if (typeof authenticate !== "function" || typeof requireRole !== "function") {
    throw new TypeError("Real authenticate and requireRole middleware must be supplied by Devang");
  }
  const router = Router();
  router.use(authenticate);
  if (roles) router.use(requireRole(...roles));
  return router;
}
export const actorId = (req) => req.user?._id;
export function send(res, data, message, status = 200) {
  return res.status(status).json({ success: true, data, message });
}
