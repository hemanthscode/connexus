import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS } from '@/utils/constants.js'
import { validateData, userValidation } from '@/utils/validators.js'

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.PROFILE(userId))
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Get current user profile
 * @returns {Promise<object>} Current user profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Update user profile
 * @param {object} profileData - Profile update data
 * @returns {Promise<object>} Updated profile data
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Validate input data
    const validation = validateData(userValidation.updateProfile, profileData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.put(API_ENDPOINTS.USERS.ME, validation.data)
    const result = apiHelpers.handleSuccess(response)
    
    // Update stored user data if successful
    if (result.success && result.data) {
      try {
        const { encryptLocalStorageData } = await import('@/utils/encryption.js')
        const { STORAGE_KEYS } = await import('@/utils/constants.js')
        
        const encryptedUserData = encryptLocalStorageData(result.data)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, encryptedUserData)
      } catch (storageError) {
        console.warn('Failed to update stored user data:', storageError)
      }
    }
    
    return result
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Search users
 * @param {string} query - Search query
 * @param {number} limit - Results limit
 * @returns {Promise<object>} Search results
 */
export const searchUsers = async (query, limit = 10) => {
  try {
    // Validate input data
    const validation = validateData(userValidation.searchUsers, { query, limit })
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const config = apiHelpers.createPaginationConfig(1, validation.data.limit, {
      q: validation.data.query,
    })
    
    const response = await api.get(API_ENDPOINTS.USERS.SEARCH, config)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Upload user avatar
 * @param {File} file - Avatar image file
 * @returns {Promise<object>} Upload response with avatar URL
 */
export const uploadAvatar = async (file) => {
  try {
    // Validate file
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid image file')
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }
    
    const formData = apiHelpers.createFormData({ avatar: file })
    
    const response = await api.post(API_ENDPOINTS.UPLOAD.AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Update user status (online, away, offline)
 * @param {string} status - User status
 * @returns {Promise<object>} Update response
 */
export const updateUserStatus = async (status) => {
  try {
    const validStatuses = ['online', 'away', 'offline']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status. Must be online, away, or offline')
    }
    
    const response = await api.put(API_ENDPOINTS.USERS.ME, { status })
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Get user's conversations count
 * @returns {Promise<object>} Conversations count
 */
export const getUserStats = async () => {
  try {
    // This would typically be a separate endpoint, but for now we can get it from profile
    const response = await api.get(API_ENDPOINTS.USERS.ME)
    const result = apiHelpers.handleSuccess(response)
    
    return {
      ...result,
      data: {
        contactsCount: result.data.contactsCount || 0,
        // Add other stats as needed
      }
    }
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Block a user
 * @param {string} userId - User ID to block
 * @returns {Promise<object>} Block response
 */
export const blockUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    // This would typically be a separate endpoint
    // For now, we'll use a generic approach
    const response = await api.post(`${API_ENDPOINTS.USERS.ME}/block`, { userId })
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Unblock a user
 * @param {string} userId - User ID to unblock
 * @returns {Promise<object>} Unblock response
 */
export const unblockUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    const response = await api.post(`${API_ENDPOINTS.USERS.ME}/unblock`, { userId })
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Get blocked users list
 * @returns {Promise<object>} Blocked users list
 */
export const getBlockedUsers = async () => {
  try {
    const response = await api.get(`${API_ENDPOINTS.USERS.ME}/blocked`)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Check if user is online based on last seen
 * @param {string} lastSeen - Last seen timestamp
 * @returns {boolean} Online status
 */
export const checkUserOnlineStatus = (lastSeen) => {
  if (!lastSeen) return false
  
  const lastSeenDate = new Date(lastSeen)
  const now = new Date()
  const diffInMinutes = (now - lastSeenDate) / (1000 * 60)
  
  // Consider online if last seen within 5 minutes
  return diffInMinutes <= 5
}

/**
 * Format user display name
 * @param {object} user - User object
 * @returns {string} Formatted display name
 */
export const formatUserDisplayName = (user) => {
  if (!user) return 'Unknown User'
  return user.name || user.email || 'Unknown User'
}

/**
 * Get user avatar URL with fallback
 * @param {object} user - User object
 * @returns {string} Avatar URL
 */
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
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0ea5e9&color=fff&size=200&rounded=true&bold=true`
}

// Export user service object
export default {
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  searchUsers,
  uploadAvatar,
  updateUserStatus,
  getUserStats,
  blockUser,
  unblockUser,
  getBlockedUsers,
  checkUserOnlineStatus,
  formatUserDisplayName,
  getUserAvatarUrl,
}
