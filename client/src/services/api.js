/**
 * Core API Service - OPTIMIZED WITH UTILITIES
 * Enhanced HTTP client with utility-based error handling
 */
import axios from 'axios';
import { 
  API_URL, 
  STORAGE_KEYS, 
  ERROR_CONFIG, 
  ROUTES,
  TIME 
} from '../utils/constants';
import { formatError, getErrorSeverity } from '../utils/formatters';

// Create axios instance with optimized config
const api = axios.create({
  baseURL: API_URL,
  timeout: TIME.CONSTANTS.MINUTE, // 60 seconds using constants
  headers: {
    'Content-Type': 'application/json',
  },
});

// ENHANCED: Request interceptor with better token handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', formatError(error));
    return Promise.reject(error);
  }
);

// ENHANCED: Response interceptor with utility-based error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, code } = error;
    
    // Use ERROR_CONFIG for consistent error codes
    if (!response) {
      error.code = ERROR_CONFIG.CODES.NETWORK_ERROR;
      error.formattedMessage = ERROR_CONFIG.MESSAGES.NETWORK_ERROR;
      return Promise.reject(error);
    }
    
    const { status } = response;
    
    // Enhanced error handling with formatError utility
    switch (status) {
      case 401:
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        if (!window.location.pathname.includes(ROUTES.LOGIN)) {
          window.location.href = ROUTES.LOGIN;
        }
        error.code = ERROR_CONFIG.CODES.UNAUTHORIZED;
        break;
        
      case 403:
        error.code = ERROR_CONFIG.CODES.FORBIDDEN;
        break;
        
      case 404:
        error.code = ERROR_CONFIG.CODES.NOT_FOUND;
        break;
        
      case 422:
        error.code = ERROR_CONFIG.CODES.VALIDATION_ERROR;
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        error.code = ERROR_CONFIG.CODES.SERVER_ERROR;
        break;
        
      default:
        if (code === 'ECONNABORTED') {
          error.code = ERROR_CONFIG.CODES.TIMEOUT_ERROR;
        }
    }
    
    // Use formatError utility for consistent error formatting
    error.formattedMessage = formatError(error);
    error.severity = getErrorSeverity(error);
    
    return Promise.reject(error);
  }
);

// ENHANCED: API helpers with more utilities
export const apiHelpers = {
  buildUrl: (endpoint, params = {}) => {
    let url = endpoint;
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
    return url;
  },
  
  createFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },

  // NEW: Utility for safe API calls with error handling
  safeApiCall: async (apiCall, fallbackValue = null) => {
    try {
      return await apiCall();
    } catch (error) {
      console.error('API call failed:', formatError(error));
      return fallbackValue;
    }
  },

  // NEW: Build query string from params
  buildQueryString: (params) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        query.append(key, params[key]);
      }
    });
    return query.toString();
  },
};

export default api;
