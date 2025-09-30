/**
 * TSV/Sales Data API Service
 */

import { getApiBaseUrl } from "../config/api.js";

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
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to parse TSV file");
  }

  return await response.json();
}

/**
 * Get sales data from database
 * @returns {Promise<{success: boolean, data: {sales: Array, stats: Object}}>}
 */
export async function getSalesData() {
  const response = await fetch(`${getApiBaseUrl()}/tsv/sales`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success || !result.data || !result.data.sales) {
    throw new Error("Invalid response format from server");
  }

  return result;
}
