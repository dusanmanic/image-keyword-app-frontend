/**
 * Image Analysis API Service
 */

import { getAuthHeaders } from "./authService.js";
import { getApiBaseUrl } from "../config/api.js";

/**
 * Analyze image and generate metadata
 * @param {Blob} imageBlob - Image blob to analyze
 * @param {number} maxKeywords - Maximum number of keywords to generate
 * @param {string} [prompt] - Optional additional prompt
 * @returns {Promise<{title: string, description: string, keywords: string[]}>}
 */
export async function analyzeImage(imageBlob, maxKeywords = 30, prompt = "", openAiApiKey = "") {
  const formData = new FormData();
  formData.append("image", imageBlob);
  formData.append("maxKeywords", String(maxKeywords));
  
  if (prompt && prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }
  if (openAiApiKey && openAiApiKey.trim()) {
    formData.append("openAiApiKey", openAiApiKey.trim());
  }

  const headers = getAuthHeaders();

  const res = await fetch(`${getApiBaseUrl()}/analyze`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Analysis failed: ${res.status}`);
  }

  return await res.json();
}
