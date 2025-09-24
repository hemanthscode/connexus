import api, { setAuthToken, clearAuthToken, apiHelpers } from './api.js'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants.js'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'
import { validateData, authValidation } from '@/utils/validators.js'

/**
 * Register new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Registration response
 */
export const registerUser = async (userData) => {
  try {
    // Validate input data
    const validation = validateData(authValidation.register, userData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, validation.data)
    const result = apiHelpers.handleSuccess(response)
    
    // Store auth token and user data
    if (result.data.token) {
      await storeAuthData(result.data.token, result.data.user)
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Login user
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} Login response
 */
export const loginUser = async (credentials) => {
  try {
    // Validate input data
    const validation = validateData(authValidation.login, credentials)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, validation.data)
    const result = apiHelpers.handleSuccess(response)
    
    // Store auth token and user data
    if (result.data.token) {
      await storeAuthData(result.data.token, result.data.user)
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Logout user
 * @returns {Promise<object>} Logout response
 */
export const logoutUser = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    const result = apiHelpers.handleSuccess(response)
    
    // Clear local auth data
    clearAuthData()
    
    return result
  } catch (error) {
    // Clear local data even if API call fails
    clearAuthData()
    throw apiHelpers.handleError(error)
  }
}

/**
 * Change user password
 * @param {object} passwordData - Password change data
 * @returns {Promise<object>} Change password response
 */
export const changePassword = async (passwordData) => {
  try {
    // Validate input data
    const validation = validateData(authValidation.changePassword, passwordData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword: validation.data.currentPassword,
      newPassword: validation.data.newPassword,
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Verify auth token validity
 * @returns {Promise<boolean>} Token validity status
 */
export const verifyToken = async () => {
  try {
    const userData = getStoredUserData()
    if (!userData) return false
    
    // Try to fetch current user profile to verify token
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    return response.status === 200
  } catch (error) {
    // Token is invalid, clear stored data
    clearAuthData()
    return false
  }
}

/**
 * Get current user data from API
 * @returns {Promise<object>} Current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    const result = apiHelpers.handleSuccess(response)
    
    // Update stored user data
    if (result.data) {
      const existingToken = getStoredAuthToken()
      if (existingToken) {
        await storeAuthData(existingToken, result.data)
      }
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Refresh authentication state on app load
 * @returns {Promise<object|null>} User data or null
 */
export const refreshAuth = async () => {
  try {
    const token = getStoredAuthToken()
    if (!token) return null
    
    // Set token in API headers
    setAuthToken(token)
    
    // Verify token and get current user
    const userData = await getCurrentUser()
    return userData.data
  } catch (error) {
    // Token is invalid or expired
    clearAuthData()
    return null
  }
}

// Helper functions for local storage management

/**
 * Store auth token and user data in localStorage
 * @param {string} token - Auth token
 * @param {object} userData - User data
 */
const storeAuthData = async (token, userData) => {
  try {
    // Encrypt and store token
    const encryptedToken = encryptLocalStorageData(token)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, encryptedToken)
    
    // Encrypt and store user data
    const encryptedUserData = encryptLocalStorageData(userData)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, encryptedUserData)
    
    // Set token in API headers
    setAuthToken(token)
    
    console.log('Auth data stored successfully')
  } catch (error) {
    console.error('Failed to store auth data:', error)
  }
}

/**
 * Get stored auth token from localStorage
 * @returns {string|null} Auth token or null
 */
const getStoredAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!encryptedToken) return null
    
    return decryptLocalStorageData(encryptedToken)
  } catch (error) {
    console.warn('Failed to get stored auth token:', error)
    return null
  }
}

/**
 * Get stored user data from localStorage
 * @returns {object|null} User data or null
 */
export const getStoredUserData = () => {
  try {
    const encryptedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    if (!encryptedUserData) return null
    
    return decryptLocalStorageData(encryptedUserData)
  } catch (error) {
    console.warn('Failed to get stored user data:', error)
    return null
  }
}

/**
 * Clear all auth data from localStorage
 */
const clearAuthData = () => {
  try {
    clearAuthToken()
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    console.log('Auth data cleared')
  } catch (error) {
    console.error('Failed to clear auth data:', error)
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = getStoredAuthToken()
  const userData = getStoredUserData()
  return !!(token && userData)
}

/**
 * Get auth header for manual API calls
 * @returns {object|null} Auth header object or null
 */
export const getAuthHeader = () => {
  const token = getStoredAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : null
}

// Export auth service object
export default {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  verifyToken,
  getCurrentUser,
  refreshAuth,
  getStoredUserData,
  isAuthenticated,
  getAuthHeader,
}
