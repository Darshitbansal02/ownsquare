import crypto from 'node:crypto';
import RefreshToken from '../models/RefreshToken.js';

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issue a new refresh token for a user. Returns the raw token (for cookie)
 * and the persisted document.
 */
export async function issueRefreshToken(userId, sessionVersion) {
  const raw = crypto.randomBytes(32).toString('hex');
  const family = crypto.randomUUID();
  const doc = await RefreshToken.create({
    tokenHash: hashToken(raw),
    userId,
    family,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    sessionVersion
  });
  return { raw, doc };
}

/**
 * Rotate a refresh token atomically. Returns {raw, doc} for the new token,
 * or null if the token is invalid/expired/revoked.
 *
 * Reuse detection: if the presented token was already consumed (usedAt set),
 * revoke the entire family (all tokens sharing the same family) and return null.
 */
export async function rotateRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (!existing) return null;

  // Expired token
  if (existing.expiresAt < new Date()) return null;

  // Already revoked
  if (existing.revokedAt) return null;

  // Reuse detection: if this token was already consumed, revoke the entire family.
  if (existing.usedAt) {
    await RefreshToken.updateMany(
      { userId: existing.userId, family: existing.family, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return null;
  }

  // Mark the current token as consumed (atomic one-use)
  const consumed = await RefreshToken.findOneAndUpdate(
    { _id: existing._id, usedAt: null, revokedAt: null },
    { $set: { usedAt: new Date() } },
    { returnDocument: 'after' }
  );
  // Another concurrent rotation won the race
  if (!consumed || consumed.usedAt === null) return null;

  // Issue a replacement in the same family
  const raw = crypto.randomBytes(32).toString('hex');
  const doc = await RefreshToken.create({
    tokenHash: hashToken(raw),
    userId: existing.userId,
    family: existing.family,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    sessionVersion: existing.sessionVersion
  });
  return { raw, doc, userId: existing.userId, sessionVersion: existing.sessionVersion };
}

/**
 * Revoke all refresh tokens for a user. Called on logout, password change,
 * password reset, and account deactivation.
 */
export async function revokeAllRefreshTokens(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Revoke a single refresh token by its raw value.
 */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}
