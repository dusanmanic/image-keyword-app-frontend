/**
 * TSV/Sales Data API Service
 */

import { getApiBaseUrl } from "../config/api.js";
import { getAuthHeaders } from "./authService.js";

/**
 * Parse TSV file
 * @param {File} file - TSV file to parse
 * @returns {Promise<{success: boolean, data: {sales: Array, stats: Object}}>}
 */
export async function parseTsvFile(file) {
  const formData = new FormData();
  formData.append("tsv", file);

  const response = await fetch(`${getApiBaseUrl()}/tsv/parse`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to parse TSV file");
  }

  return await response.json();
}

/**
 * Get sales data from database with optional pagination
 * @param {Object} options - Pagination options
 * @param {number} options.limit - Number of rows to fetch (default: 20)
 * @param {boolean} options.includeStats - Whether to include statistics (default: true)
 * @returns {Promise<{success: boolean, data: {sales: Array, stats: Object, pagination: Object}}>}
 */
export async function getSalesData(options = {}) {
  const { limit = 20, page = 1, includeStats = true } = options;
  
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    includeStats: includeStats.toString()
  });

  const response = await fetch(`${getApiBaseUrl()}/tsv/sales?${queryParams}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data || !result.data.sales) {
    throw new Error("Invalid response format from server");
  }

  return result;
}
