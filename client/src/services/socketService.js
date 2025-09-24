import { io } from 'socket.io-client'
import { API_CONFIG, SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { getStoredUserData } from './authService.js'
import { decryptLocalStorageData } from '@/utils/encryption.js'
import { STORAGE_KEYS } from '@/utils/constants.js'

// Socket instance
let socket = null
let isConnected = false
let reconnectAttempts = 0
let maxReconnectAttempts = 5

// Event listeners storage
const eventListeners = new Map()

/**
 * Get auth token for socket connection
 * @returns {string|null} Auth token
 */
const getAuthToken = () => {
  try {
    const encryptedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!encryptedToken) return null
    return decryptLocalStorageData(encryptedToken)
  } catch (error) {
    console.warn('Failed to get auth token for socket:', error)
    return null
  }
}

/**
 * Initialize socket connection
 * @returns {Promise<object>} Socket instance
 */
export const initializeSocket = () => {
  return new Promise((resolve, reject) => {
    try {
      const token = getAuthToken()
      if (!token) {
        reject(new Error('No auth token available'))
        return
      }
      
      // Disconnect existing socket if any
      if (socket) {
        socket.disconnect()
      }
      
      // Create new socket connection
      socket = io(API_CONFIG.SOCKET_URL, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      })
      
      // Connection successful
      socket.on(SOCKET_EVENTS.CONNECT, () => {
        isConnected = true
        reconnectAttempts = 0
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('✅ Socket connected:', socket.id)
        }
        
        // Emit user online status
        const userData = getStoredUserData()
        if (userData) {
          socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'online' })
        }
        
        resolve(socket)
      })
      
      // Connection error
      socket.on('connect_error', (error) => {
        isConnected = false
        
        if (DEBUG.SOCKET_LOGS) {
          console.error('❌ Socket connection error:', error.message)
        }
        
        reject(error)
      })
      
      // Disconnection
      socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        isConnected = false
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('🔌 Socket disconnected:', reason)
        }
        
        // Attempt reconnection for certain reasons
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Server initiated disconnect or manual disconnect - don't reconnect
          return
        }
        
        // Attempt reconnection
        attemptReconnection()
      })
      
      // Reconnection successful
      socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
        isConnected = true
        reconnectAttempts = 0
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
        }
        
        // Re-emit user status
        const userData = getStoredUserData()
        if (userData) {
          socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'online' })
        }
      })
      
      // Handle authentication errors
      socket.on('error', (error) => {
        if (DEBUG.SOCKET_LOGS) {
          console.error('Socket error:', error)
        }
        
        if (error.message?.includes('Authentication')) {
          // Token is invalid, need to re-login
          disconnect()
          reject(new Error('Socket authentication failed'))
        }
      })
      
    } catch (error) {
      console.error('Failed to initialize socket:', error)
      reject(error)
    }
  })
}

/**
 * Attempt to reconnect socket
 */
const attemptReconnection = () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    if (DEBUG.SOCKET_LOGS) {
      console.error('Max reconnection attempts reached')
    }
    return
  }
  
  reconnectAttempts++
  
  if (DEBUG.SOCKET_LOGS) {
    console.log(`Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts}`)
  }
  
  setTimeout(() => {
    if (!isConnected) {
      initializeSocket().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }
  }, 2000 * reconnectAttempts) // Exponential backoff
}

/**
 * Disconnect socket
 */
export const disconnect = () => {
  if (socket) {
    // Emit offline status before disconnecting
    if (isConnected) {
      socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'offline' })
    }
    
    socket.disconnect()
    socket = null
    isConnected = false
    
    if (DEBUG.SOCKET_LOGS) {
      console.log('Socket manually disconnected')
    }
  }
}

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return socket?.connected || false
}

/**
 * Get socket instance
 * @returns {object|null} Socket instance
 */
export const getSocket = () => {
  return socket
}

/**
 * Emit socket event
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export const emit = (event, data) => {
  if (socket && isConnected) {
    if (DEBUG.SOCKET_LOGS) {
      console.log(`📤 Emitting: ${event}`, data)
    }
    socket.emit(event, data)
  } else {
    console.warn('Socket not connected, cannot emit event:', event)
  }
}

/**
 * Listen to socket event
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 */
export const on = (event, callback) => {
  if (socket) {
    // Store listener reference for cleanup
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event).add(callback)
    
    socket.on(event, callback)
    
    if (DEBUG.SOCKET_LOGS) {
      console.log(`👂 Listening to: ${event}`)
    }
  }
}

/**
 * Stop listening to socket event
 * @param {string} event - Event name
 * @param {Function} callback - Event callback (optional)
 */
export const off = (event, callback) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback)
      
      // Remove from stored listeners
      if (eventListeners.has(event)) {
        eventListeners.get(event).delete(callback)
      }
    } else {
      socket.off(event)
      
      // Clear all listeners for this event
      eventListeners.delete(event)
    }
    
    if (DEBUG.SOCKET_LOGS) {
      console.log(`🔇 Stopped listening to: ${event}`)
    }
  }
}

/**
 * Clean up all event listeners
 */
export const cleanup = () => {
  if (socket) {
    eventListeners.forEach((callbacks, event) => {
      socket.off(event)
    })
    eventListeners.clear()
    
    if (DEBUG.SOCKET_LOGS) {
      console.log('🧹 Cleaned up all socket listeners')
    }
  }
}

// High-level socket event helpers

/**
 * Join a conversation room
 * @param {string} conversationId - Conversation ID
 */
export const joinConversation = (conversationId) => {
  emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId)
}

/**
 * Leave a conversation room
 * @param {string} conversationId - Conversation ID
 */
export const leaveConversation = (conversationId) => {
  emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId)
}

/**
 * Send typing indicator
 * @param {string} conversationId - Conversation ID
 */
export const emitTypingStart = (conversationId) => {
  emit(SOCKET_EVENTS.TYPING_START, { conversationId })
}

/**
 * Stop typing indicator
 * @param {string} conversationId - Conversation ID
 */
export const emitTypingStop = (conversationId) => {
  emit(SOCKET_EVENTS.TYPING_STOP, { conversationId })
}

/**
 * Send message via socket
 * @param {object} messageData - Message data
 */
export const sendMessage = (messageData) => {
  emit(SOCKET_EVENTS.SEND_MESSAGE, messageData)
}

/**
 * Edit message via socket
 * @param {string} messageId - Message ID
 * @param {string} newContent - New content
 */
export const editMessage = (messageId, newContent) => {
  emit(SOCKET_EVENTS.EDIT_MESSAGE, { messageId, newContent })
}

/**
 * Delete message via socket
 * @param {string} messageId - Message ID
 */
export const deleteMessage = (messageId) => {
  emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId })
}

/**
 * Add reaction via socket
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji reaction
 */
export const addReaction = (messageId, emoji) => {
  emit(SOCKET_EVENTS.ADD_REACTION, { messageId, emoji })
}

/**
 * Remove reaction via socket
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji reaction
 */
export const removeReaction = (messageId, emoji) => {
  emit(SOCKET_EVENTS.REMOVE_REACTION, { messageId, emoji })
}

/**
 * Mark messages as read via socket
 * @param {Array} messageIds - Array of message IDs
 * @param {string} conversationId - Conversation ID
 */
export const markMessagesRead = (messageIds, conversationId) => {
  emit(SOCKET_EVENTS.MARK_MESSAGE_READ, { messageIds, conversationId })
}

/**
 * Update user status
 * @param {string} status - User status (online, away, offline)
 */
export const updateUserStatus = (status) => {
  emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status })
}

/**
 * Join group via socket
 * @param {string} groupId - Group ID
 */
export const joinGroup = (groupId) => {
  emit(SOCKET_EVENTS.JOIN_GROUP, { groupId })
}

/**
 * Leave group via socket
 * @param {string} groupId - Group ID
 */
export const leaveGroup = (groupId) => {
  emit(SOCKET_EVENTS.LEAVE_GROUP, { groupId })
}

/**
 * Request conversation info
 * @param {string} conversationId - Conversation ID
 */
export const requestConversationInfo = (conversationId) => {
  emit(SOCKET_EVENTS.REQUEST_CONVERSATION_INFO, { conversationId })
}

// Export socket service object
export default {
  initializeSocket,
  disconnect,
  isSocketConnected,
  getSocket,
  emit,
  on,
  off,
  cleanup,
  joinConversation,
  leaveConversation,
  emitTypingStart,
  emitTypingStop,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markMessagesRead,
  updateUserStatus,
  joinGroup,
  leaveGroup,
  requestConversationInfo,
}
