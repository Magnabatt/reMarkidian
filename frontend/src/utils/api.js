import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.message || 'Bad request');
          break;
        case 401:
          toast.error('Unauthorized access');
          break;
        case 403:
          toast.error('Access forbidden');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 500:
          toast.error('Server error occurred');
          break;
        default:
          toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error - please check your connection');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const healthAPI = {
  check: () => api.get('/health'),
  system: () => api.get('/health/system'),
};

export const vaultsAPI = {
  getAll: () => api.get('/vaults'),
  getById: (id) => api.get(`/vaults/${id}`),
  create: (data) => api.post('/vaults', data),
  update: (id, data) => api.put(`/vaults/${id}`, data),
  delete: (id) => api.delete(`/vaults/${id}`),
};

export const syncAPI = {
  getHistory: (params = {}) => api.get('/sync/history', { params }),
  getStatus: () => api.get('/sync/status'),
  start: (vaultId) => api.post('/sync/start', { vault_id: vaultId }),
  stop: (syncId) => api.post(`/sync/stop/${syncId}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  updateMultiple: (settings) => api.put('/settings', { settings }),
  reset: (key) => api.post(`/settings/${key}/reset`),
};

// Helper functions
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return defaultMessage;
};

export const isApiError = (error) => {
  return error.response && error.response.data;
};

// Export the axios instance for custom requests
export default api;
