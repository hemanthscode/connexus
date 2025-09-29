import api, { setAuthToken, clearAuthToken, apiHelpers } from './api.js'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants.js'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'
import { validateData, authValidation } from '@/utils/validators.js'

// Auth data management
const storeAuthData = async (token, userData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, encryptLocalStorageData(token))
    localStorage.setItem(STORAGE_KEYS.USER_DATA, encryptLocalStorageData(userData))
    setAuthToken(token)
  } catch (error) {
    console.error('Failed to store auth data:', error)
    throw error
  }
}

const getStoredAuthToken = () => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return encrypted ? decryptLocalStorageData(encrypted) : null
  } catch (error) {
    console.warn('Failed to get auth token:', error)
    return null
  }
}

export const getStoredUserData = () => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return encrypted ? decryptLocalStorageData(encrypted) : null
  } catch (error) {
    console.warn('Failed to get user data:', error)
    return null
  }
}

const clearAuthData = () => {
  clearAuthToken()
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_DATA)
}

// Auth API functions
export const registerUser = async (userData) => {
  const validation = validateData(authValidation.register, userData)
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0])
  }
  
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, validation.data)
    const result = apiHelpers.handleSuccess(response)
    
    if (result.data.token) {
      await storeAuthData(result.data.token, result.data.user)
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const loginUser = async (credentials) => {
  const validation = validateData(authValidation.login, credentials)
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0])
  }
  
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, validation.data)
    const result = apiHelpers.handleSuccess(response)
    
    if (result.data.token) {
      await storeAuthData(result.data.token, result.data.user)
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const logoutUser = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
    const result = apiHelpers.handleSuccess(response)
    clearAuthData()
    return result
  } catch (error) {
    clearAuthData() // Clear local data even if API fails
    throw apiHelpers.handleError(error)
  }
}

export const changePassword = async (passwordData) => {
  const validation = validateData(authValidation.changePassword, passwordData)
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0])
  }
  
  try {
    const response = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword: validation.data.currentPassword,
      newPassword: validation.data.newPassword,
    })
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const getCurrentUser = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    const result = apiHelpers.handleSuccess(response)
    
    // Update stored user data
    if (result.data && getStoredAuthToken()) {
      const token = getStoredAuthToken()
      await storeAuthData(token, result.data)
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const verifyToken = async () => {
  try {
    if (!getStoredUserData()) return false
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    return response.status === 200
  } catch (error) {
    clearAuthData()
    return false
  }
}

export const refreshAuth = async () => {
  try {
    const token = getStoredAuthToken()
    if (!token) return null
    
    setAuthToken(token)
    const userData = await getCurrentUser()
    return userData.data
  } catch (error) {
    clearAuthData()
    return null
  }
}

// Utility functions
export const isAuthenticated = () => {
  return !!(getStoredAuthToken() && getStoredUserData())
}

export const getAuthHeader = () => {
  const token = getStoredAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : null
}

// Export service object
export default {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  getCurrentUser,
  verifyToken,
  refreshAuth,
  getStoredUserData,
  isAuthenticated,
  getAuthHeader,
}
