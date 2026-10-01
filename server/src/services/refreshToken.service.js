import crypto from "node:crypto";

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export function createRefreshTokenService({ models }) {
  const { RefreshToken } = models;

  // Returns the raw token (sent once, to the cookie) and the persisted document.
  async function issue(userId, sessionVersion) {
    const raw = crypto.randomBytes(32).toString("hex");
    const doc = await RefreshToken.create({
      tokenHash: hashToken(raw), userId, family: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS), sessionVersion
    });
    return { raw, doc };
  }

  // Single-use rotation with reuse detection: replaying a consumed token revokes the family.
  async function rotate(rawToken) {
    const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
    if (!existing || existing.expiresAt < new Date() || existing.revokedAt) return null;
    if (existing.usedAt) {
      await RefreshToken.updateMany({ userId: existing.userId, family: existing.family, revokedAt: null },
        { $set: { revokedAt: new Date() } });
      return null;
    }
    // Conditional claim so two concurrent rotations cannot both succeed.
    const consumed = await RefreshToken.findOneAndUpdate(
      { _id: existing._id, usedAt: null, revokedAt: null }, { $set: { usedAt: new Date() } }, { new: true }
    );
    if (!consumed) return null;
    const raw = crypto.randomBytes(32).toString("hex");
    await RefreshToken.create({
      tokenHash: hashToken(raw), userId: existing.userId, family: existing.family,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS), sessionVersion: existing.sessionVersion
    });
    return { raw, userId: existing.userId, sessionVersion: existing.sessionVersion };
  }

  // Called on logout, password change, password reset and account deactivation.
  function revokeAll(userId) {
    return RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }

  function revoke(rawToken) {
    if (!rawToken) return Promise.resolve();
    return RefreshToken.updateOne({ tokenHash: hashToken(rawToken), revokedAt: null },
      { $set: { revokedAt: new Date() } });
  }

  return { issue, rotate, revokeAll, revoke, hashToken };
}
