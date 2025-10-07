/**
 * Authentication API Service
 */

import { getApiBaseUrl } from "../config/api.js";

export async function fetchCurrentUser() {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    method: 'GET',
    headers
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return await res.json();
}

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<void>}
 */
// registerUser removed (no UI flow uses registration)

/**
 * Get auth token from localStorage
 * @returns {string|null}
 */
export function getAuthToken() {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

/**
 * Get auth headers with token
 * @returns {Object}
 */
export function getAuthHeaders() {
  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
