import { getApiBaseUrl } from '../config/api.js';

/**
 * GET /api/tos/public — no auth. Shared by useApi.getPublicTos and useAuthRedux fallback.
 */
export async function fetchPublicTos(options = {}) {
  const { signal } = options;
  const res = await fetch(`${getApiBaseUrl()}/api/tos/public`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  if (!res.ok) {
    let msg = `Could not load terms (${res.status})`;
    try {
      const errData = await res.json();
      if (errData.error) msg = errData.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}
