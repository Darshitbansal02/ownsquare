import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSessionFence } from '../pages/auth/sessionFence.mjs';

export const AuthContext = createContext(null);

export default function AuthProvider({ api, queryClient, constants, features: suppliedFeatures, children }) {
  const fence = useRef(createSessionFence());
  const [session, setSession] = useState({ user: null, accessToken: null, sessionKey: 0 });
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [capabilities, setCapabilities] = useState({ features: suppliedFeatures ?? {}, loading: !suppliedFeatures, error: null });

  useEffect(() => () => { fence.current.next(); }, []);

  const clearSession = useCallback(() => {
    const sessionKey = fence.current.next();
    api.setAccessToken(null);
    queryClient?.clear();
    setSession({ user: null, accessToken: null, sessionKey });
    setSessionError(null);
    setLoading(false);
  }, [api, queryClient]);

  useEffect(() => api.onUnauthorized(clearSession), [api, clearSession]);

  // Initial reload refresh: restore active session from httpOnly refresh cookie
  useEffect(() => {
    let active = true;
    api.auth.refresh()
      .then(result => {
        if (!active) return;
        const generation = fence.current.current();
        api.setAccessToken(result.accessToken);
        setSession({ user: result.user, accessToken: result.accessToken, sessionKey: generation });
      })
      .catch(() => {
        // Unauthenticated or invalid refresh token on initial load
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [api]);

  useEffect(() => {
    if (suppliedFeatures) { setCapabilities({ features: suppliedFeatures, loading: false, error: null }); return; }
    let active = true;
    api.platform.stats().then(data => { if (active) setCapabilities({ features: data.features, loading: false, error: null }); })
      .catch(error => { if (active) setCapabilities({ features: {}, loading: false, error }); });
    return () => { active = false; };
  }, [api, suppliedFeatures]);

  const authenticate = useCallback(async (method, body) => {
    clearSession();
    const generation = fence.current.current();
    setLoading(true);
    try {
      const result = await api.auth[method](body);
      if (!fence.current.accepts(generation)) throw new Error('This sign-in was replaced. Please try again.');
      api.setAccessToken(result.accessToken);
      setSession({ user: result.user, accessToken: result.accessToken, sessionKey: generation });
      return result.user;
    } finally { if (fence.current.accepts(generation)) setLoading(false); }
  }, [api, clearSession]);

  const login = useCallback(body => authenticate('login', body), [authenticate]);
  const register = useCallback(body => authenticate('register', body), [authenticate]);

  const logout = useCallback(async () => {
    // The API captures the current bearer token before memory/cache are cleared.
    const request = api.auth.logout();
    clearSession();
    const generation = fence.current.current();
    try { await request; } catch (error) {
      if (fence.current.accepts(generation)) setSessionError(new Error(`Your local session was cleared, but the server could not confirm sign out. ${error.message}`));
      throw error;
    }
  }, [api, clearSession]);

  const refreshUser = useCallback(async () => {
    const generation = fence.current.current();
    const user = await api.auth.me();
    if (!fence.current.accepts(generation)) return null;
    setSession(current => ({ ...current, user }));
    return user;
  }, [api]);

  // Silent refresh before access token expiry
  useEffect(() => {
    if (!session.accessToken) return;
    try {
      const payload = JSON.parse(atob(session.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return;
      const delay = Math.max(0, payload.exp * 1000 - Date.now() - 30000);
      const timer = setTimeout(() => {
        api.auth.refresh()
          .then(result => {
            const generation = fence.current.current();
            api.setAccessToken(result.accessToken);
            setSession({ user: result.user, accessToken: result.accessToken, sessionKey: generation });
          })
          .catch(() => {
            clearSession();
          });
      }, delay);
      return () => clearTimeout(timer);
    } catch { /* An opaque access token can still be invalidated by server 401. */ }
  }, [session.accessToken, api, clearSession]);

  const value = useMemo(() => ({ ...session, api, constants, features: capabilities.features, featuresLoading: capabilities.loading,
    loading, sessionError, featuresError: capabilities.error, login, register, logout, refreshUser, clearSession }),
  [session, api, constants, loading, sessionError, capabilities, login, register, logout, refreshUser, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
