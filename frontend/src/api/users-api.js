// users-api.js — real backend calls. Admin-only screens.
// No delete exists by design: "remove" = deactivate; table defaults to active-only.
// KEEP client-side: ROLES.
import { request } from './auth-api';

export const ROLES = [
  { key: 'admin', label: 'Admin', note: 'Manages accounts and prices' },
  { key: 'chef', label: 'Chef', note: 'Builds and costs dishes' },
  { key: 'staff', label: 'Kitchen staff', note: 'Reads the menu and prep lists' }
];

export const roleLabel = (key) => (ROLES.find(r => r.key === key) || {}).label || key;

/** The backend enforces 8–64; every password field in the app agrees with this. */
export const PASSWORD_MIN_LENGTH = 8;

/** Shortest possible result is 9 characters, so it always clears the backend's 8. */
const WORDS = ['thyme', 'plum', 'matcha', 'clove', 'sorrel', 'fennel', 'quince', 'cedar'];

export function suggestPassword() {
  const w = WORDS[Math.floor(Math.random() * WORDS.length)];
  return w + '-' + String(Math.floor(1000 + Math.random() * 8999));
}

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
