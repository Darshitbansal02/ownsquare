import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { userDTO } from "../utils/dto.js";
import { createRefreshTokenService } from "./refreshToken.service.js";

// bcrypt cost 12, and a fixed dummy hash so an unknown email still performs a real
// comparison and does not disclose account existence through response timing.
const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.3KcRK89pEeC3S75LDDmSjULvh6xXP1e";

export function createAuthService({ connection, models, env, mailer }) {
  const { User } = models;
  const refreshTokens = createRefreshTokenService({ models });

  const accessTokenFor = (user) => jwt.sign(
    { role: user.role, sessionVersion: user.sessionVersion },
    env.jwt.secret,
    { subject: String(user._id), expiresIn: env.jwt.expiresIn, algorithm: "HS256",
      issuer: "ownsquare", audience: "ownsquare-web" }
  );

  const expiresInSeconds = () => Math.floor(parseDurationSeconds(env.jwt.expiresIn));

  async function issueSession(user) {
    const refresh = await refreshTokens.issue(user._id, user.sessionVersion);
    return { user: userDTO(user), accessToken: accessTokenFor(user),
      expiresIn: expiresInSeconds(), refreshRaw: refresh.raw };
  }

  // POST /auth/register. Admin is seeded and can never be self-registered.
  async function register(body) {
    const role = body.role;
    if (role === "ADMIN") throw new ApiError("VALIDATION_ERROR", "Admin accounts cannot be self-registered");
    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    let user;
    try {
      user = await User.create({ name: body.name, email: body.email, phone: body.phone, role, passwordHash });
    } catch (error) {
      if (error.code === 11000) throw new ApiError("EMAIL_ALREADY_EXISTS", "That email is already registered");
      throw error;
    }
    return issueSession(user);
  }

  // POST /auth/login. Identical failure for unknown email and wrong password.
  async function login(body) {
    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    const valid = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect");
    if (!user.isActive) throw new ApiError("UNAUTHORIZED", "This account is inactive");
    return issueSession(user);
  }

  // POST /auth/logout. Bumps sessionVersion so every issued access token dies immediately.
  async function logout(userId, currentRefreshToken) {
    await refreshTokens.revoke(currentRefreshToken);
    const user = await User.findByIdAndUpdate(userId,
      { $inc: { sessionVersion: 1 } }, { new: true });
    if (user) await refreshTokens.revokeAll(user._id);
    return { loggedOut: true };
  }

  // POST /auth/refresh. Rotates the token and revalidates the persisted session.
  async function refresh(rawToken) {
    if (!rawToken) throw new ApiError("UNAUTHORIZED", "Refresh token is required");
    const rotated = await refreshTokens.rotate(rawToken);
    if (!rotated) throw new ApiError("UNAUTHORIZED", "Refresh token is invalid, expired, or reused");
    const user = await User.findById(rotated.userId);
    if (!user?.isActive || user.sessionVersion !== rotated.sessionVersion) {
      await refreshTokens.revokeAll(rotated.userId);
      throw new ApiError("UNAUTHORIZED", "Your session has been revoked");
    }
    return { user: userDTO(user), accessToken: accessTokenFor(user),
      expiresIn: expiresInSeconds(), refreshRaw: rotated.raw };
  }

  // POST /auth/forgot-password. Always answers identically so accounts are not disclosed.
  async function forgotPassword({ email }) {
    if (!env.features.passwordReset) throw new ApiError("FEATURE_DISABLED", "Password reset is unavailable");
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = refreshTokens.hashToken(token);
    const user = await User.findOneAndUpdate({ email, isActive: true },
      { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000) } },
      { new: true });
    if (user) {
      try {
        await mailer.sendMail({ from: env.smtp.from, to: user.email, subject: "Reset your OwnSquare password",
          text: `Reset your password within 30 minutes: ${env.clientUrl}/reset-password/${token}` });
      } catch (error) {
        // Never leave a usable token behind when the mail could not be delivered.
        await User.updateOne({ _id: user._id, resetTokenHash: tokenHash },
          { $set: { resetTokenHash: null, resetTokenExpiresAt: null } });
        throw new ApiError("SERVICE_UNAVAILABLE", "Password reset email is unavailable", [], { cause: error });
      }
    }
    return { requested: true };
  }

  // POST /auth/reset-password/:token. Atomically consumes the token and kills all sessions.
  async function resetPassword(token, { password }) {
    if (!env.features.passwordReset) throw new ApiError("FEATURE_DISABLED", "Password reset is unavailable");
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const tokenHash = refreshTokens.hashToken(token);
    const user = await User.findOneAndUpdate(
      { resetTokenHash: tokenHash, resetTokenExpiresAt: { $gt: new Date() }, isActive: true },
      { $set: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null }, $inc: { sessionVersion: 1 } },
      { new: true }
    );
    if (!user) throw new ApiError("INVALID_RESET_TOKEN", "Reset link is invalid, expired, or already used");
    await refreshTokens.revokeAll(user._id);
    return { reset: true };
  }

  return { register, login, logout, refresh, forgotPassword, resetPassword, connection };
}

// Accepts "15m", "1h", "900" or "1d"; returns seconds. Access tokens are short-lived by policy.
function parseDurationSeconds(value) {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(String(value).trim());
  if (!match) throw new Error(`Unsupported JWT_EXPIRES_IN value: ${value}`);
  const amount = Number(match[1]);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] ?? "s"];
  return amount * factor;
}

export { parseDurationSeconds };
