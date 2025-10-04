/**
 * Core API Service
 * Centralized HTTP client with interceptors
 */

import axios from 'axios';
import { API_URL, STORAGE_KEYS, ERROR_CODES, ROUTES } from '../utils/constants';
import { formatError } from '../utils/formatters';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;
    
    // Network errors
    if (!response) {
      error.code = ERROR_CODES.NETWORK_ERROR;
      return Promise.reject(error);
    }
    
    const { status } = response;
    
    // Handle different HTTP status codes
    switch (status) {
      case 401:
        // Unauthorized - clear auth data and redirect
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        if (!window.location.pathname.includes(ROUTES.LOGIN)) {
          window.location.href = ROUTES.LOGIN;
        }
        break;
        
      case 403:
        error.code = ERROR_CODES.FORBIDDEN;
        break;
        
      case 404:
        error.code = ERROR_CODES.NOT_FOUND;
        break;
        
      case 422:
        error.code = ERROR_CODES.VALIDATION_ERROR;
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        error.code = ERROR_CODES.SERVER_ERROR;
        break;
        
      default:
        if (code === 'ECONNABORTED') {
          error.code = ERROR_CODES.TIMEOUT_ERROR;
        }
    }
    
    // Add formatted error message
    error.formattedMessage = formatError(error);
    
    return Promise.reject(error);
  }
);

// API helper methods
export const apiHelpers = {
  // Build URL with parameters
  buildUrl: (endpoint, params = {}) => {
    let url = endpoint;
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
    return url;
  },
  
  // Create form data for file uploads
  createFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },
};

export default api;
