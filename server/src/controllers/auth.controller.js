import { send } from "../utils/http.js";
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from "../utils/refreshCookie.js";

export function createAuthController({ auth, nodeEnv }) {
  const withCookie = (res, session, message, status = 200) => {
    setRefreshCookie(res, session.refreshRaw, nodeEnv);
    const { refreshRaw, ...data } = session;
    void refreshRaw;
    return send(res, data, message, status);
  };

  return {
    register: async (req, res) => withCookie(res, await auth.register(req.validated.body), "Account created", 201),
    login: async (req, res) => withCookie(res, await auth.login(req.validated.body), "Logged in"),
    refresh: async (req, res) => {
      try {
        return withCookie(res, await auth.refresh(getRefreshCookie(req)), "Token refreshed");
      } catch (error) {
        // A failed rotation always clears the cookie so the browser stops retrying it.
        clearRefreshCookie(res, nodeEnv);
        throw error;
      }
    },
    logout: async (req, res) => {
      const current = getRefreshCookie(req);
      clearRefreshCookie(res, nodeEnv);
      return send(res, await auth.logout(req.user._id, current), "Logged out");
    },
    me: async (req, res) => send(res, req.user, "Current user"),
    forgotPassword: async (req, res) =>
      send(res, await auth.forgotPassword(req.validated.body),
        "If an active account exists, a reset email has been requested"),
    resetPassword: async (req, res) => {
      clearRefreshCookie(res, nodeEnv);
      return send(res, await auth.resetPassword(req.validated.params.token, req.validated.body),
        "Password reset. Sign in again");
    }
  };
}
