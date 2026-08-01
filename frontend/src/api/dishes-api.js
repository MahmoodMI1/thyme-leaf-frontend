// dishes-api.js — real backend CRUD, fully live.
// List responses carry NO photo; fetch the single dish on card-open/edit for it.
// DELETE from the design's version: localStorage persistence, the JSON seed.
// KEEP client-side: TYPES / typeLabel.
import { request } from './auth-api';

export function listDishes() {
  return request('/api/dishes');
}

/** Full dish including photo — used by menu card open and ?edit=<id>. */
export function getDish(id) {
  return request(`/api/dishes/${id}`);
}

/** body: {name, type, photo, credit, creditHref, ingredients:[{foodId, amount}]}
    Server recomputes all costs; any client-sent cost/name/unit on lines is ignored. */
export function createDish(dish) {
  return request('/api/dishes', { method: 'POST', body: dish });
}

/** Full replace. Same body shape as create. */
export function updateDish(id, dish) {
  return request(`/api/dishes/${id}`, { method: 'PUT', body: dish });
}

export function deleteDish(id) {
  return request(`/api/dishes/${id}`, { method: 'DELETE' });
}
