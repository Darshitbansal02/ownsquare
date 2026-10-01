// Refresh token lives in an httpOnly cookie scoped to the refresh endpoint, so page scripts
// can never read it and it is not attached to ordinary API calls.
const COOKIE_NAME = "ownsquare_refresh";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = (nodeEnv) => ({
  httpOnly: true,
  secure: nodeEnv === "production",
  sameSite: nodeEnv === "production" ? "strict" : "lax",
  path: "/api/v1/auth/refresh"
});

export function setRefreshCookie(res, rawToken, nodeEnv) {
  res.cookie(COOKIE_NAME, rawToken, { ...cookieOptions(nodeEnv), maxAge: REFRESH_MAX_AGE_MS });
}

export function clearRefreshCookie(res, nodeEnv) {
  res.clearCookie(COOKIE_NAME, cookieOptions(nodeEnv));
}

export function getRefreshCookie(req) {
  return req.cookies?.[COOKIE_NAME] ?? null;
}

export { COOKIE_NAME };
