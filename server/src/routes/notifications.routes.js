import express from "express";
import { protectedRouter, send } from "../utils/http.js";

export function createNotificationsRouter({ services, authenticate }) {
  const router = express.Router();
  router.use(authenticate);

  // GET /api/v1/notifications
  router.get("/", async (req, res, next) => {
    try {
      const query = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sort: req.query.sort || "-createdAt"
      };
      if (req.query.read !== undefined) {
        query.read = req.query.read === "true";
      }
      const result = await services.notifications.list(req.user._id, query);
      return send(res, result, "Notifications retrieved");
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/notifications/:id/read
  router.patch("/:id/read", async (req, res, next) => {
    try {
      const result = await services.notifications.markRead(req.user._id, req.params.id);
      return send(res, result, "Notification marked as read");
    } catch (err) {
      next(err);
    }
  });

  return router;
}
