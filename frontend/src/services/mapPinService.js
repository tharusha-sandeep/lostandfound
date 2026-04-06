import axiosClient from './axiosClient';

/**
 * Fetch map pins (heatmap data).
 * @param {Object} params - { floor?, range?, type? }
 */
export async function fetchMapPins(params = {}) {
  const { data } = await axiosClient.get('/mappins', { params });
  return data; // { count, pins }
}

/**
 * Create or update a pin for a post (admin only).
 * @param {{ postId: string, floor: string, x: number, y: number }} body
 */
export async function createMapPin(body) {
  const { data } = await axiosClient.post('/mappins', body);
  return data;
}

/**
 * Delete a pin by its own _id (admin only).
 */
export async function deleteMapPin(pinId) {
  const { data } = await axiosClient.delete(`/mappins/${pinId}`);
  return data;
}