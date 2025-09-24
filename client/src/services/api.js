import axios from 'axios'
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '@/utils/constants.js'
import { parseErrorMessage, retryWithBackoff } from '@/utils/helpers.js'
import { decryptLocalStorageData } from '@/utils/encryption.js'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let authToken = null

/**
 * Get auth token from localStorage or memory
 * @returns {string|null} Auth token
 */
const getAuthToken = () => {
  if (authToken) return authToken
  
  try {
    const encryptedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (encryptedToken) {
      const decryptedToken = decryptLocalStorageData(encryptedToken)
      authToken = decryptedToken
      return authToken
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error)
  }
  
  return null
}

/**
 * Set auth token in memory and localStorage
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  authToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

/**
 * Clear auth token from memory and localStorage
 */
export const clearAuthToken = () => {
  authToken = null
  delete api.defaults.headers.common['Authorization']
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_DATA)
}

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log API requests in development
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Log API errors in development
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      })
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear invalid token
      clearAuthToken()
      
      // Redirect to login (you can customize this logic)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return Promise.reject(error)
    }
    
    // Handle network errors with retry
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        return await retryWithBackoff(
          () => api.request(originalRequest),
          API_CONFIG.RETRY_ATTEMPTS,
          API_CONFIG.RETRY_DELAY
        )
      } catch (retryError) {
        console.error('API retry failed:', retryError)
      }
    }
    
    return Promise.reject(error)
  }
)

// API helper functions
export const apiHelpers = {
  /**
   * Handle API errors consistently
   * @param {any} error - Error object
   * @returns {object} Formatted error
   */
  handleError: (error) => {
    const message = parseErrorMessage(error)
    const status = error.response?.status || 0
    
    return {
      message,
      status,
      isNetworkError: !error.response,
      isServerError: status >= 500,
      isClientError: status >= 400 && status < 500,
      originalError: error,
    }
  },
  
  /**
   * Format success response
   * @param {object} response - Axios response
   * @returns {object} Formatted response
   */
  handleSuccess: (response) => {
    return {
      data: response.data.data || response.data,
      message: response.data.message || 'Success',
      status: response.status,
      success: response.data.success !== false,
    }
  },
  
  /**
   * Create request config with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {object} additionalParams - Additional query params
   * @returns {object} Request config
   */
  createPaginationConfig: (page = 1, limit = 50, additionalParams = {}) => {
    return {
      params: {
        page,
        limit,
        ...additionalParams,
      },
    }
  },
  
  /**
   * Create multipart form data for file uploads
   * @param {object} data - Form data object
   * @returns {FormData} FormData object
   */
  createFormData: (data) => {
    const formData = new FormData()
    
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item))
      } else if (value !== null && value !== undefined) {
        formData.append(key, JSON.stringify(value))
      }
    })
    
    return formData
  },
}

// Export configured axios instance
export default api
