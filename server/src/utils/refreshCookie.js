/**
 * Refresh-token cookie configuration.
 * httpOnly, SameSite=Strict, Secure in production, path-scoped to /api/v1/auth/refresh.
 */
const COOKIE_NAME = 'ownsquare_refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshCookie(res, rawToken, env) {
  res.cookie(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: REFRESH_MAX_AGE_MS
  });
}

export function clearRefreshCookie(res, env) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth/refresh'
  });
}

export function getRefreshCookie(req) {
  return req.cookies?.[COOKIE_NAME] ?? null;
}

export { COOKIE_NAME };
