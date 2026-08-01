// foods-api.js — real backend CRUD.
// DELETE from the design's version: localStorage persistence, the JSON seed.
import { request } from './auth-api';

export function listFoods() {
  return request('/api/foods');
}

export function createFood({ name, qty, unit, price }) {
  return request('/api/foods', { method: 'POST', body: { name, qty, unit, price } });
}

export function updateFood(id, { name, qty, unit, price }) {
  return request(`/api/foods/${id}`, { method: 'PATCH', body: { name, qty, unit, price } });
}

export function deleteFood(id) {
  return request(`/api/foods/${id}`, { method: 'DELETE' });
}
