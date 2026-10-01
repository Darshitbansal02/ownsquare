import { ApiError } from "./ApiError.js";

export async function requireActor(models, userId, roles, session) {
  if (!userId) throw new ApiError("UNAUTHORIZED", "Authentication required");
  const user = await models.User.findById(userId).session(session || null);
  if (!user?.isActive) throw new ApiError("UNAUTHORIZED", "Active authentication required");
  if (roles && !roles.includes(user.role)) throw new ApiError("FORBIDDEN", "Role is not permitted");
  return user;
}

export async function requireSettings(models, session) {
  const settings = await models.Settings.findOne({ singletonKey: "platform" }).session(session || null);
  if (!settings) throw new ApiError("SERVICE_UNAVAILABLE", "Platform settings have not been seeded");
  return settings;
}

export function requireFeature(features, name) {
  if (typeof features?.[name] !== "boolean") throw new ApiError("SERVICE_UNAVAILABLE", `Feature configuration missing: ${name}`);
  if (!features[name]) throw new ApiError("FEATURE_DISABLED", `${name} is disabled`);
}
