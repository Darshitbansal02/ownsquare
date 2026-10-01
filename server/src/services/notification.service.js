import { ApiError } from "../utils/ApiError.js";
import { requireActor, requireFeature } from "../utils/actors.js";
import { requireSession } from "../utils/transaction.js";
import { notificationDTO } from "../utils/dto.js";
import { pageOf } from "../utils/pagination.js";

export function createNotificationService({ models, features }) {
  if (typeof features?.notifications !== "boolean") throw new ApiError("SERVICE_UNAVAILABLE", "Notification configuration is required");
  async function record(event, session) {
    requireSession(session);
    if (!features.notifications) return;
    if (!await models.User.exists({ _id: event.userId }).session(session)) throw new ApiError("CONFLICT", "Notification recipient missing");
    await models.Notification.create([event], { session });
  }
  async function list(userId, query) {
    requireFeature(features, "notifications");
    await requireActor(models, userId);
    return pageOf(models.Notification, { userId, ...(query.read !== undefined ? { read: query.read } : {}) }, query, notificationDTO);
  }
  async function markRead(userId, notificationId) {
    requireFeature(features, "notifications");
    await requireActor(models, userId);
    const row = await models.Notification.findOneAndUpdate(
      { _id: notificationId, userId }, { $set: { read: true } }, { new: true }
    );
    if (!row) throw new ApiError("NOT_FOUND", "Notification not found");
    return notificationDTO(row);
  }
  return { record, list, markRead };
}
