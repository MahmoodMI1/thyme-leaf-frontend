import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, session as apiSession, signOut as apiSignOut, setUnauthorizedHandler } from '../api/auth-api.js';
import { clearUi } from '../lib/ui-state.js';
import { SessionContext } from './session-context.js';

/**
 * Owns the only copy of {username, role} in the app, runs the app-load probe,
 * and registers the global 401 handler exactly once.
 *
 * Session death is reactive: nothing warns before the cookie expires, and the
 * server can also kill a live session (deactivation, password reset). Either
 * way the next request 401s and lands here.
 */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  // The handler must not close over a stale navigate, and must register once.
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      clearUi();
      const from = window.location.pathname + window.location.search;
      navRef.current('/login', {
        replace: true,
        state: { expired: true, from: from === '/login' ? undefined : from }
      });
    });
  }, []);

  // App-load probe. A 401 here is the normal signed-out case: session()
  // resolves to null rather than throwing, so it never looks like an expiry.
  useEffect(() => {
    let live = true;
    apiSession()
      .then(u => { if (live) setUser(u); })
      .catch(() => { if (live) setUser(null); })
      .finally(() => { if (live) setStatus('ready'); });
    return () => { live = false; };
  }, []);

  const signIn = useCallback(async (username, password) => {
    const u = await apiLogin(username, password);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } finally {
      // Even if the DELETE fails, this browser is done with the session.
      setUser(null);
      clearUi();
      navRef.current('/login', { replace: true });
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut }),
    [user, status, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
