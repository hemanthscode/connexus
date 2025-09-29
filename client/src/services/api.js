import axios from 'axios'
import { API_CONFIG, STORAGE_KEYS } from '@/utils/constants.js'
import { parseErrorMessage, retryWithBackoff } from '@/utils/helpers.js'
import { decryptLocalStorageData } from '@/utils/encryption.js'

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management
let authToken = null

const getAuthToken = () => {
  if (authToken) return authToken
  
  try {
    const encryptedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (encryptedToken) {
      authToken = decryptLocalStorageData(encryptedToken)
      return authToken
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error)
  }
  
  return null
}

export const setAuthToken = (token) => {
  authToken = token
  api.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : undefined
  if (!token) {
    delete api.defaults.headers.common['Authorization']
  }
}

export const clearAuthToken = () => {
  authToken = null
  delete api.defaults.headers.common['Authorization']
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_DATA)
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Debug logging
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Debug logging
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    }
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Debug logging
    if (import.meta.env.VITE_SHOW_API_LOGS === 'true') {
      console.error(`❌ ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, 
        error.response?.data?.message || error.message)
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      clearAuthToken()
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return Promise.reject(error)
    }
    
    // Retry network errors
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
  handleError: (error) => ({
    message: parseErrorMessage(error),
    status: error.response?.status || 0,
    isNetworkError: !error.response,
    isServerError: (error.response?.status || 0) >= 500,
    isClientError: (error.response?.status || 0) >= 400 && (error.response?.status || 0) < 500,
    originalError: error,
  }),
  
  handleSuccess: (response) => ({
    data: response.data.data || response.data,
    message: response.data.message || 'Success',
    status: response.status,
    success: response.data.success !== false,
  }),
  
  createPaginationConfig: (page = 1, limit = 50, additionalParams = {}) => ({
    params: { page, limit, ...additionalParams },
  }),
  
  createFormData: (data) => {
    const formData = new FormData()
    
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item))
      } else if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })
    
    return formData
  },
}

export default api
