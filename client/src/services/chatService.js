import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants.js'
import { validateData, chatValidation } from '@/utils/validators.js'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'

/**
 * Get user conversations
 * @returns {Promise<object>} Conversations list
 */
export const getConversations = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.CHAT.CONVERSATIONS)
    const result = apiHelpers.handleSuccess(response)
    
    // Cache conversations for offline use
    if (result.success && result.data) {
      try {
        const encryptedConversations = encryptLocalStorageData(result.data)
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS_CACHE, encryptedConversations)
      } catch (cacheError) {
        console.warn('Failed to cache conversations:', cacheError)
      }
    }
    
    return result
  } catch (error) {
    // Try to return cached conversations if API fails
    try {
      const cachedData = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS_CACHE)
      if (cachedData) {
        const conversations = decryptLocalStorageData(cachedData)
        return {
          data: conversations,
          message: 'Showing cached conversations (offline)',
          status: 200,
          success: true,
          isFromCache: true,
        }
      }
    } catch (cacheError) {
      console.warn('Failed to load cached conversations:', cacheError)
    }
    
    throw apiHelpers.handleError(error)
  }
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} page - Page number
 * @param {number} limit - Messages per page
 * @returns {Promise<object>} Messages list
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required')
    }
    
    const config = apiHelpers.createPaginationConfig(page, limit)
    const response = await api.get(API_ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId), config)
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Send a message
 * @param {object} messageData - Message data
 * @returns {Promise<object>} Sent message
 */
export const sendMessage = async (messageData) => {
  try {
    // Validate input data
    const validation = validateData(chatValidation.sendMessage, messageData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Edit a message
 * @param {string} messageId - Message ID
 * @param {string} newContent - New message content
 * @returns {Promise<object>} Edited message
 */
export const editMessage = async (messageId, newContent) => {
  try {
    // Validate input data
    const validation = validateData(chatValidation.editMessage, { messageId, newContent })
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.put(API_ENDPOINTS.CHAT.EDIT_MESSAGE, validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} Delete response
 */
export const deleteMessage = async (messageId) => {
  try {
    if (!messageId) {
      throw new Error('Message ID is required')
    }
    
    const response = await api.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(messageId))
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Add reaction to message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji reaction
 * @returns {Promise<object>} Reaction response
 */
export const addReaction = async (messageId, emoji) => {
  try {
    if (!messageId || !emoji) {
      throw new Error('Message ID and emoji are required')
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.ADD_REACTION, {
      messageId,
      emoji,
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Remove reaction from message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji reaction
 * @returns {Promise<object>} Remove reaction response
 */
export const removeReaction = async (messageId, emoji) => {
  try {
    if (!messageId || !emoji) {
      throw new Error('Message ID and emoji are required')
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.REMOVE_REACTION, {
      messageId,
      emoji,
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Mark conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Mark read response
 */
export const markAsRead = async (conversationId) => {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required')
    }
    
    const response = await api.put(API_ENDPOINTS.CHAT.MARK_READ(conversationId))
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Create direct conversation
 * @param {string} participantId - Other user's ID
 * @returns {Promise<object>} Created conversation
 */
export const createDirectConversation = async (participantId) => {
  try {
    // Validate input data
    const validation = validateData(chatValidation.createDirectConversation, { participantId })
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.DIRECT_CONVERSATION, validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Create group conversation
 * @param {object} groupData - Group data
 * @returns {Promise<object>} Created group
 */
export const createGroup = async (groupData) => {
  try {
    // Validate input data
    const validation = validateData(chatValidation.createGroup, groupData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.GROUP_CONVERSATION, validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Update group information
 * @param {string} groupId - Group ID
 * @param {object} updateData - Update data
 * @returns {Promise<object>} Updated group
 */
export const updateGroup = async (groupId, updateData) => {
  try {
    if (!groupId) {
      throw new Error('Group ID is required')
    }
    
    // Validate input data
    const validation = validateData(chatValidation.updateGroup, updateData)
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.put(API_ENDPOINTS.CHAT.UPDATE_GROUP(groupId), validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Add participants to group
 * @param {string} groupId - Group ID
 * @param {Array} participants - Array of user IDs
 * @returns {Promise<object>} Updated group
 */
export const addParticipants = async (groupId, participants) => {
  try {
    if (!groupId) {
      throw new Error('Group ID is required')
    }
    
    // Validate input data
    const validation = validateData(chatValidation.addParticipants, { participants })
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.post(API_ENDPOINTS.CHAT.ADD_PARTICIPANTS(groupId), validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Remove participant from group
 * @param {string} groupId - Group ID
 * @param {string} participantId - Participant ID to remove
 * @returns {Promise<object>} Updated group
 */
export const removeParticipant = async (groupId, participantId) => {
  try {
    if (!groupId || !participantId) {
      throw new Error('Group ID and participant ID are required')
    }
    
    const response = await api.delete(API_ENDPOINTS.CHAT.REMOVE_PARTICIPANT(groupId, participantId))
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Change participant role in group
 * @param {string} groupId - Group ID
 * @param {string} participantId - Participant ID
 * @param {string} role - New role (admin, moderator, member)
 * @returns {Promise<object>} Updated group
 */
export const changeParticipantRole = async (groupId, participantId, role) => {
  try {
    if (!groupId) {
      throw new Error('Group ID is required')
    }
    
    // Validate input data
    const validation = validateData(chatValidation.changeRole, { participantId, role })
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0])
    }
    
    const response = await api.put(API_ENDPOINTS.CHAT.CHANGE_ROLE(groupId), validation.data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Archive/unarchive conversation
 * @param {string} conversationId - Conversation ID
 * @param {boolean} archived - Archive status
 * @returns {Promise<object>} Updated conversation
 */
export const archiveConversation = async (conversationId, archived) => {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required')
    }
    
    if (typeof archived !== 'boolean') {
      throw new Error('Archived status must be a boolean')
    }
    
    const response = await api.put(API_ENDPOINTS.CHAT.ARCHIVE_CONVERSATION(conversationId), {
      archived,
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Search users for chat
 * @param {string} query - Search query
 * @param {number} limit - Results limit
 * @returns {Promise<object>} Search results
 */
export const searchUsers = async (query, limit = 10) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters')
    }
    
    const config = apiHelpers.createPaginationConfig(1, limit, {
      q: query.trim(),
    })
    
    const response = await api.get(API_ENDPOINTS.CHAT.SEARCH_USERS, config)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

/**
 * Upload file attachment
 * @param {File} file - File to upload
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Upload response
 */
export const uploadAttachment = async (file, conversationId) => {
  try {
    if (!file || !(file instanceof File)) {
      throw new Error('Please select a valid file')
    }
    
    if (!conversationId) {
      throw new Error('Conversation ID is required')
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB')
    }
    
    const formData = apiHelpers.createFormData({
      attachment: file,
      conversationId,
    })
    
    const response = await api.post(API_ENDPOINTS.UPLOAD.ATTACHMENT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

// Utility functions

/**
 * Format conversation display name
 * @param {object} conversation - Conversation object
 * @param {string} currentUserId - Current user ID
 * @returns {string} Display name
 */
export const formatConversationName = (conversation, currentUserId) => {
  if (!conversation) return 'Unknown Conversation'
  
  if (conversation.type === 'group') {
    return conversation.name || 'Unnamed Group'
  }
  
  // For direct conversations, show other participant's name
  const otherParticipant = conversation.participants?.find(
    p => p.user._id !== currentUserId
  )
  
  return otherParticipant?.user?.name || 'Unknown User'
}

/**
 * Get conversation avatar URL
 * @param {object} conversation - Conversation object
 * @param {string} currentUserId - Current user ID
 * @returns {string|null} Avatar URL
 */
export const getConversationAvatar = (conversation, currentUserId) => {
  if (!conversation) return null
  
  if (conversation.type === 'group') {
    return conversation.avatar || null
  }
  
  // For direct conversations, show other participant's avatar
  const otherParticipant = conversation.participants?.find(
    p => p.user._id !== currentUserId
  )
  
  return otherParticipant?.user?.avatar || null
}

// Export chat service object
export default {
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markAsRead,
  createDirectConversation,
  createGroup,
  updateGroup,
  addParticipants,
  removeParticipant,
  changeParticipantRole,
  archiveConversation,
  searchUsers,
  uploadAttachment,
  formatConversationName,
  getConversationAvatar,
}
