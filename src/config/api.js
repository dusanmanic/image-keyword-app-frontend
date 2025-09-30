/**
 * API Configuration
 * Reads API URL from environment variables
 */

/**
 * Get the base URL for API calls
 * If VITE_API_URL is set in .env, use it directly
 * Otherwise, use empty string (Vite proxy will handle routing in dev mode)
 */
export function getApiBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If API URL is explicitly set in .env, always use it
  if (apiUrl) {
    return apiUrl;
  }
  
  // Otherwise, use proxy (empty string = relative URLs)
  return '';
}
