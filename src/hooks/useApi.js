import { useState, useCallback } from 'react';
import { fetchPublicTos as fetchPublicTosRequest } from '../services/tosPublicService.js';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic API call function
  const apiCall = useCallback(async (endpoint, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      console.log('API call to:', endpoint, 'with token:', token ? 'present' : 'missing');
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };
      
      // Only set Content-Type for non-FormData requests
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Folders API
  const getFolders = useCallback(async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    if (filters.tags && filters.tags.length) params.set('tags', filters.tags.join(','));
    if (filters.mode) params.set('mode', filters.mode);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.order) params.set('order', filters.order);
    if (Number.isFinite(filters.limit)) params.set('limit', String(filters.limit));
    if (Number.isFinite(filters.offset)) params.set('offset', String(filters.offset));
    const q = params.toString();
    const data = await apiCall(`/api/user/folders${q ? `?${q}` : ''}`);
    return data.folders || [];
  }, [apiCall]);

  const saveFolder = useCallback(async (folder) => {
    const data = await apiCall('/api/user/folders', {
      method: 'POST',
      body: JSON.stringify(folder)
    });
    return data.folder;
  }, [apiCall]);

  const deleteFolder = useCallback(async (folderId) => {
    const data = await apiCall(`/api/user/folders/${folderId}`, {
      method: 'DELETE'
    });
    return data;
  }, [apiCall]);

  const getFolderStats = useCallback(async (folderId) => {
    const data = await apiCall(`/api/user/folders/${folderId}/stats`);
    return data.stats;
  }, [apiCall]);

  // Images API
  const getFolderImages = useCallback(async (folderId) => {
    const data = await apiCall(`/api/user/folders/${folderId}/images`);
    return data.images || [];
  }, [apiCall]);

  const saveImageMetadata = useCallback(async (folderId, imageData) => {
    // Create FormData to handle blob
    const formData = new FormData();
    
    // Add all image data fields
    Object.keys(imageData).forEach(key => {
      if (key === 'thumbnailBlob' && imageData[key]) {
        // Add thumbnail blob as file
        formData.append('thumbnail', imageData[key], `thumb_${imageData.name || 'image.jpg'}`);
      } else if (key !== 'blob' && key !== 'thumbnailBlob') {
        const value = imageData[key];
        if (value === null || value === undefined) {
          // Avoid sending literal "null"/"undefined" strings for optional fields (e.g. imageCreatedAt)
          formData.append(key, '');
          return;
        }
        // Add other fields as JSON
        formData.append(key, typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value)
        );
      }
    });
    
    const data = await apiCall(`/api/user/folders/${folderId}/images`, {
      method: 'POST',
      body: formData
    });
    return data.image;
  }, [apiCall]);

  const moveImages = useCallback(async (imageIds, targetFolderId) => {
    const data = await apiCall(`/api/user/images/move`, {
      method: 'POST',
      body: JSON.stringify({ imageIds, targetFolderId })
    });
    return data;
  }, [apiCall]);

  const startAnalyzeBatch = useCallback(async (folderId, imageIds, options = {}) => {
    const data = await apiCall('/api/analyze/batch', {
      method: 'POST',
      body: JSON.stringify({
        folderId,
        imageIds,
        maxKeywords: options.maxKeywords,
        prompt: options.prompt,
        gettyMode: options.gettyMode,
      })
    });
    return data;
  }, [apiCall]);

  const mapKeywordsToGetty = useCallback(async (keywords, maxKeywords = 50) => {
    const data = await apiCall('/api/analyze/map-to-getty', {
      method: 'POST',
      body: JSON.stringify({ keywords, maxKeywords })
    });
    return data;
  }, [apiCall]);

  /** Map custom keywords to Getty for selected images; persists on server. */
  const mapGettyBatch = useCallback(async ({
    folderId,
    imageIds,
    maxKeywords = 50,
    force = false,
    scoreThreshold,
  }) => {
    const body = { folderId, imageIds, maxKeywords, force };
    if (scoreThreshold != null) body.scoreThreshold = scoreThreshold;
    const data = await apiCall('/api/analyze/map-getty-batch', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data;
  }, [apiCall]);

  const saveImageExportLogs = useCallback(async ({ platform, batchId, items }) => {
    const data = await apiCall('/api/user/export-logs', {
      method: 'POST',
      body: JSON.stringify({ platform, batchId, items })
    });
    return data;
  }, [apiCall]);

  const getAnalyzeBatchStatus = useCallback(async (batchId) => {
    const data = await apiCall(`/api/analyze/batch/${batchId}`);
    return data;
  }, [apiCall]);

  const getAnalyzeStatusByImageIds = useCallback(async (imageIds) => {
    const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
    const q = ids.map(String).join(',');
    const data = await apiCall(`/api/analyze/batch/status?imageIds=${encodeURIComponent(q)}`);
    return data;
  }, [apiCall]);

  const getGettyKeywordsCatalog = useCallback(async () => {
    const data = await apiCall('/api/analyze/getty-keywords');
    return Array.isArray(data?.keywords) ? data.keywords : [];
  }, [apiCall]);

  // Auth API
  const login = useCallback(async (email, password) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  }, [apiCall]);

  const register = useCallback(async (email, password) => {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return data;
  }, [apiCall]);

  const logout = useCallback(async () => {
    try {
      await apiCall('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      // Ignore logout errors
      console.log('Logout error (ignored):', error);
    }
  }, [apiCall]);

  // ToS API (requires auth, does NOT require ToS acceptance)
  const getTos = useCallback(async () => {
    const data = await apiCall('/api/tos');
    return data;
  }, [apiCall]);

  const acceptTos = useCallback(async (content) => {
    const data = await apiCall('/api/tos/accept', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return data;
  }, [apiCall]);

  /** Public ToS (no JWT). Same as Terms page — uses tosPublicService. */
  const getPublicTos = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPublicTosRequest(options);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Payment API
  const getCreditPackages = useCallback(async () => {
    const data = await apiCall('/api/payment/packages');
    return data.packages || [];
  }, [apiCall]);

  const createPaymentIntent = useCallback(async (amount) => {
    const data = await apiCall('/api/payment/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    return data;
  }, [apiCall]);

  const confirmPaymentSuccess = useCallback(async (paymentIntentId) => {
    const data = await apiCall('/api/payment/payment-success', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId })
    });
    return data;
  }, [apiCall]);

  const getPayPalConfig = useCallback(async () => {
    const data = await apiCall('/api/payment/paypal-config');
    return data?.enabled ?? false;
  }, [apiCall]);

  const createPayPalOrder = useCallback(async (amount) => {
    const data = await apiCall('/api/payment/create-paypal-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency: 'USD' })
    });
    return data?.orderId;
  }, [apiCall]);

  const confirmPayPalSuccess = useCallback(async (orderId) => {
    const data = await apiCall('/api/payment/payment-success-paypal', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    });
    return data;
  }, [apiCall]);

  const getUserCredits = useCallback(async () => {
    const data = await apiCall('/api/payment/credits');
    return data;
  }, [apiCall]);

  const getCreditTransactions = useCallback(async () => {
    const data = await apiCall('/api/payment/transactions');
    return data.transactions || [];
  }, [apiCall]);

  const downloadInvoice = useCallback(async (paymentIntentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/payment/invoice/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${paymentIntentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    isLoading,
    error,
    apiCall,
    getFolders,
    saveFolder,
    deleteFolder,
    getFolderStats,
    getFolderImages,
    saveImageMetadata,
    moveImages,
    startAnalyzeBatch,
    getAnalyzeBatchStatus,
    getAnalyzeStatusByImageIds,
    getGettyKeywordsCatalog,
    mapKeywordsToGetty,
    mapGettyBatch,
    saveImageExportLogs,
    login,
    register,
    logout,
    getTos,
    acceptTos,
    getPublicTos,
    getCreditPackages,
    createPaymentIntent,
    confirmPaymentSuccess,
    getPayPalConfig,
    createPayPalOrder,
    confirmPayPalSuccess,
    getUserCredits,
    getCreditTransactions,
    downloadInvoice
  };
}
