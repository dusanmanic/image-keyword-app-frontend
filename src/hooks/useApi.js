import { useState, useCallback } from 'react';

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
        // Add other fields as JSON
        formData.append(key, typeof imageData[key] === 'object' 
          ? JSON.stringify(imageData[key]) 
          : String(imageData[key])
        );
      }
    });
    
    const data = await apiCall(`/api/user/folders/${folderId}/images`, {
      method: 'POST',
      body: formData
    });
    return data.image;
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
    getFolderImages,
    saveImageMetadata,
    login,
    register,
    logout,
    getCreditPackages,
    createPaymentIntent,
    confirmPaymentSuccess,
    getUserCredits,
    getCreditTransactions,
    downloadInvoice
  };
}
