// auth-api.js — real backend session calls.
// The session cookie is HttpOnly and rides automatically; this module
// never sees, stores, or parses any credential or token.
// DELETE from the design's version: the credential store, scramble(),
// any issuedAt/expiry math, any client-side "register" logic.

let onUnauthorized = null;

/** Register once at app startup: clear auth state + redirect to login. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function request(path, { method = 'GET', body, skipAuthRedirect = false } = {}) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuthRedirect && onUnauthorized) {
    onUnauthorized();
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.fields = data.fields || null;
    throw err;
  }

  return res.status === 204 ? null : res.json();
}

/** POST /api/session → {username, role}. Throws with .status 401/403 and message. */
export function login(username, password) {
  return request('/api/session', {
    method: 'POST',
    body: { username, password },
    skipAuthRedirect: true,            // wrong password must not trigger the redirect
  });
}

/** GET /api/session → {username, role}, or null when signed out (expected on load). */
export async function session() {
  try {
    return await request('/api/session', { skipAuthRedirect: true });
  } catch (e) {
    if (e.status === 401) return null; // signed out is a state, not an error
    throw e;
  }
}

/** DELETE /api/session — clears the cookie. Caller clears app state. */
export function signOut() {
  return request('/api/session', { method: 'DELETE', skipAuthRedirect: true });
}
