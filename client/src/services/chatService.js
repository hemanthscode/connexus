import api, { apiHelpers } from './api.js'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants.js'
import { validateData, chatValidation } from '@/utils/validators.js'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'

// Helper for consistent error handling
const handleApiCall = async (apiCall, validator = null, data = null) => {
  try {
    if (validator && data) {
      const validation = validateData(validator, data)
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0])
      }
      data = validation.data
    }
    
    const response = await apiCall(data)
    return apiHelpers.handleSuccess(response)
  } catch (error) {
    throw apiHelpers.handleError(error)
  }
}

// Conversation management
export const getConversations = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.CHAT.CONVERSATIONS)
    const result = apiHelpers.handleSuccess(response)
    
    // Cache for offline use
    if (result.success && result.data) {
      try {
        const encrypted = encryptLocalStorageData(result.data)
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS_CACHE, encrypted)
      } catch (cacheError) {
        console.warn('Failed to cache conversations:', cacheError)
      }
    }
    
    return result
  } catch (error) {
    // Try cached data
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS_CACHE)
      if (cached) {
        const conversations = decryptLocalStorageData(cached)
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

export const getMessages = async (conversationId, page = 1, limit = 50) => {
  if (!conversationId) throw new Error('Conversation ID is required')
  
  return handleApiCall(() => {
    const config = apiHelpers.createPaginationConfig(page, limit)
    return api.get(API_ENDPOINTS.CHAT.CONVERSATION_MESSAGES(conversationId), config)
  })
}

export const createDirectConversation = async (participantId) => {
  return handleApiCall(
    (data) => api.post(API_ENDPOINTS.CHAT.DIRECT_CONVERSATION, data),
    chatValidation.createDirectConversation,
    { participantId }
  )
}

export const createGroup = async (groupData) => {
  return handleApiCall(
    (data) => api.post(API_ENDPOINTS.CHAT.GROUP_CONVERSATION, data),
    chatValidation.createGroup,
    groupData
  )
}

export const updateGroup = async (groupId, updateData) => {
  if (!groupId) throw new Error('Group ID is required')
  
  return handleApiCall(
    (data) => api.put(API_ENDPOINTS.CHAT.UPDATE_GROUP(groupId), data),
    chatValidation.updateGroup,
    updateData
  )
}

export const archiveConversation = async (conversationId, archived) => {
  if (!conversationId) throw new Error('Conversation ID is required')
  if (typeof archived !== 'boolean') throw new Error('Archived status must be a boolean')
  
  return handleApiCall(() => 
    api.put(API_ENDPOINTS.CHAT.ARCHIVE_CONVERSATION(conversationId), { archived })
  )
}

// Message management
export const sendMessage = async (messageData) => {
  return handleApiCall(
    (data) => api.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, data),
    chatValidation.sendMessage,
    messageData
  )
}

export const editMessage = async (messageId, newContent) => {
  return handleApiCall(
    (data) => api.put(API_ENDPOINTS.CHAT.EDIT_MESSAGE, data),
    chatValidation.editMessage,
    { messageId, newContent }
  )
}

export const deleteMessage = async (messageId) => {
  if (!messageId) throw new Error('Message ID is required')
  
  return handleApiCall(() => api.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(messageId)))
}

export const markAsRead = async (conversationId) => {
  if (!conversationId) throw new Error('Conversation ID is required')
  
  return handleApiCall(() => api.put(API_ENDPOINTS.CHAT.MARK_READ(conversationId)))
}

// Reactions
export const addReaction = async (messageId, emoji) => {
  if (!messageId || !emoji) throw new Error('Message ID and emoji are required')
  
  return handleApiCall(() => api.post(API_ENDPOINTS.CHAT.ADD_REACTION, { messageId, emoji }))
}

export const removeReaction = async (messageId, emoji) => {
  if (!messageId || !emoji) throw new Error('Message ID and emoji are required')
  
  return handleApiCall(() => api.post(API_ENDPOINTS.CHAT.REMOVE_REACTION, { messageId, emoji }))
}

// Group management
export const addParticipants = async (groupId, participants) => {
  if (!groupId) throw new Error('Group ID is required')
  
  return handleApiCall(
    (data) => api.post(API_ENDPOINTS.CHAT.ADD_PARTICIPANTS(groupId), data),
    chatValidation.addParticipants,
    { participants }
  )
}

export const removeParticipant = async (groupId, participantId) => {
  if (!groupId || !participantId) {
    throw new Error('Group ID and participant ID are required')
  }
  
  return handleApiCall(() => 
    api.delete(API_ENDPOINTS.CHAT.REMOVE_PARTICIPANT(groupId, participantId))
  )
}

export const changeParticipantRole = async (groupId, participantId, role) => {
  if (!groupId) throw new Error('Group ID is required')
  
  return handleApiCall(
    (data) => api.put(API_ENDPOINTS.CHAT.CHANGE_ROLE(groupId), data),
    chatValidation.changeRole,
    { participantId, role }
  )
}

// Search and upload
export const searchUsers = async (query, limit = 10) => {
  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters')
  }
  
  return handleApiCall(() => {
    const config = apiHelpers.createPaginationConfig(1, limit, { q: query.trim() })
    return api.get(API_ENDPOINTS.CHAT.SEARCH_USERS, config)
  })
}

export const uploadAttachment = async (file, conversationId) => {
  if (!file || !(file instanceof File)) throw new Error('Please select a valid file')
  if (!conversationId) throw new Error('Conversation ID is required')
  if (file.size > 10 * 1024 * 1024) throw new Error('File size must be less than 10MB')
  
  return handleApiCall(() => {
    const formData = apiHelpers.createFormData({ attachment: file, conversationId })
    return api.post(API_ENDPOINTS.UPLOAD.ATTACHMENT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  })
}

// Utility functions
export const formatConversationName = (conversation, currentUserId) => {
  if (!conversation) return 'Unknown Conversation'
  
  if (conversation.type === 'group') {
    return conversation.name || 'Unnamed Group'
  }
  
  const otherParticipant = conversation.participants?.find(
    p => p.user._id !== currentUserId
  )
  
  return otherParticipant?.user?.name || 'Unknown User'
}

export const getConversationAvatar = (conversation, currentUserId) => {
  if (!conversation) return null
  
  if (conversation.type === 'group') {
    return conversation.avatar || null
  }
  
  const otherParticipant = conversation.participants?.find(
    p => p.user._id !== currentUserId
  )
  
  return otherParticipant?.user?.avatar || null
}

// Export service object
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
