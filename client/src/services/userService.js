import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS } from '@/utils/constants.js'
import { validateData, userValidation } from '@/utils/validators.js'

// Configuration constants
const AVATAR_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  FALLBACK_API: 'https://ui-avatars.com/api'
}

const USER_STATUS = {
  VALID: ['online', 'away', 'offline'],
  ONLINE_THRESHOLD: 5 // minutes
}

// Utility functions
const validateAndExecute = async (validationSchema, data, apiCall) => {
  const validation = validateData(validationSchema, data)
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0])
  }
  return await apiCall(validation.data)
}

const updateStoredUserData = (userData) => {
  try {
    Promise.resolve(import('@/utils/encryption.js')).then(({ encryptLocalStorageData }) => {
      Promise.resolve(import('@/utils/constants.js')).then(({ STORAGE_KEYS }) => {
        const encryptedData = encryptLocalStorageData(userData)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, encryptedData)
      })
    })
  } catch (error) {
    console.warn('Failed to update stored user data:', error)
  }
}

// Core API functions
export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.PROFILE(userId))
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const updateUserProfile = async (profileData) => {
  try {
    const result = await validateAndExecute(
      userValidation.updateProfile,
      profileData,
      (data) => api.put(API_ENDPOINTS.USERS.ME, data)
    )
    
    const response = apiHelpers.handleSuccess(result)
    
    // Update stored user data
    if (response.success && response.data) {
      updateStoredUserData(response.data)
    }
    
    return response
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const searchUsers = async (query, limit = 10) => {
  try {
    const result = await validateAndExecute(
      userValidation.searchUsers,
      { query, limit },
      (data) => {
        const config = apiHelpers.createPaginationConfig(1, data.limit, { q: data.query })
        return api.get(API_ENDPOINTS.USERS.SEARCH, config)
      }
    )
    
    return apiHelpers.handleSuccess(result)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const uploadAvatar = async (file) => {
  try {
    // Validate file
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid image file')
    }
    
    if (file.size > AVATAR_CONFIG.MAX_SIZE) {
      throw new Error('File size must be less than 5MB')
    }
    
    if (!AVATAR_CONFIG.ALLOWED_TYPES.some(type => file.type === type)) {
      throw new Error('Please select a valid image file (JPEG, PNG, WebP, or GIF)')
    }
    
    const formData = apiHelpers.createFormData({ avatar: file })
    
    const response = await api.post(API_ENDPOINTS.UPLOAD.AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const updateUserStatus = async (status) => {
  try {
    if (!USER_STATUS.VALID.includes(status)) {
      throw new Error('Invalid status. Must be online, away, or offline')
    }
    
    const response = await api.put(API_ENDPOINTS.USERS.ME, { status })
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const getUserStats = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    const result = apiHelpers.handleSuccess(response)
    
    return {
      ...result,
      data: {
        contactsCount: result.data.contactsCount || 0,
        conversationsCount: result.data.conversationsCount || 0,
        // Add other stats as needed
      }
    }
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

// User blocking operations
const userBlockingOperations = {
  block: (userId) => api.post(`${API_ENDPOINTS.USERS.ME}/block`, { userId }),
  unblock: (userId) => api.post(`${API_ENDPOINTS.USERS.ME}/unblock`, { userId }),
  getBlocked: () => api.get(`${API_ENDPOINTS.USERS.ME}/blocked`)
}

export const blockUser = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required')
    
    const response = await userBlockingOperations.block(userId)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const unblockUser = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required')
    
    const response = await userBlockingOperations.unblock(userId)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

export const getBlockedUsers = async () => {
  try {
    const response = await userBlockingOperations.getBlocked()
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

// Utility functions
export const checkUserOnlineStatus = (lastSeen) => {
  if (!lastSeen) return false
  
  const lastSeenDate = new Date(lastSeen)
  const now = new Date()
  const diffInMinutes = (now - lastSeenDate) / (1000 * 60)
  
  return diffInMinutes <= USER_STATUS.ONLINE_THRESHOLD
}

export const formatUserDisplayName = (user) => {
  if (!user) return 'Unknown User'
  return user.name || user.email || 'Unknown User'
}

export const getUserAvatarUrl = (user) => {
  if (!user) return null
  
  if (user.avatar) return user.avatar
  
  // Generate avatar from initials
  const name = formatUserDisplayName(user)
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
  
  const params = new URLSearchParams({
    name: initials,
    background: '0ea5e9',
    color: 'fff',
    size: '200',
    rounded: 'true',
    bold: 'true'
  })
  
  return `${AVATAR_CONFIG.FALLBACK_API}/?${params.toString()}`
}

// Export consolidated service
export default {
  // Profile operations
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  getUserStats,

  // User operations
  searchUsers,
  uploadAvatar,
  updateUserStatus,

  // Blocking operations
  blockUser,
  unblockUser,
  getBlockedUsers,

  // Utility functions
  checkUserOnlineStatus,
  formatUserDisplayName,
  getUserAvatarUrl,
}
