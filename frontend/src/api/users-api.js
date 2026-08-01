// users-api.js — real backend calls. Admin-only screens.
// No delete exists by design: "remove" = deactivate; table defaults to active-only.
// KEEP client-side: ROLES.
import { request } from './auth-api';

export function listUsers() {
  return request('/api/users');
}

/** body: {username, role, password} — password min 8 (backend enforces 8-64). */
export function createUser({ username, role, password }) {
  return request('/api/users', { method: 'POST', body: { username, role, password } });
}

/** Partial: {role} and/or {status: 'active'|'deactivated'}. */
export function updateUser(id, changes) {
  return request(`/api/users/${id}`, { method: 'PATCH', body: changes });
}

export function setPassword(id, password) {
  return request(`/api/users/${id}/password`, { method: 'POST', body: { password } });
}

/** The design's "remove" action maps here. */
export function deactivateUser(id) {
  return updateUser(id, { status: 'deactivated' });
}

export function reactivateUser(id) {
  return updateUser(id, { status: 'active' });
}
