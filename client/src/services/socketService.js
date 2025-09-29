import { io } from 'socket.io-client'
import { API_CONFIG, SOCKET_EVENTS, DEBUG, STORAGE_KEYS } from '@/utils/constants.js'
import { getStoredUserData } from './authService.js'
import { decryptLocalStorageData } from '@/utils/encryption.js'

// Socket state
let socket = null
let isConnected = false
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const eventListeners = new Map()

// Helper functions
const getAuthToken = () => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return encrypted ? decryptLocalStorageData(encrypted) : null
  } catch (error) {
    console.warn('Failed to get auth token for socket:', error)
    return null
  }
}

const log = (message, ...args) => {
  if (DEBUG.SOCKET_LOGS) console.log(message, ...args)
}

const attemptReconnection = () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    log('❌ Max reconnection attempts reached')
    return
  }
  
  reconnectAttempts++
  log(`🔄 Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts}`)
  
  setTimeout(() => {
    if (!isConnected) {
      initializeSocket().catch(error => console.error('Reconnection failed:', error))
    }
  }, 2000 * reconnectAttempts)
}

// Core socket functions
export const initializeSocket = () => {
  return new Promise((resolve, reject) => {
    const token = getAuthToken()
    if (!token) {
      reject(new Error('No auth token available'))
      return
    }
    
    // Clean up existing socket
    if (socket) socket.disconnect()
    
    // Create new connection
    socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    })
    
    // Connection handlers
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      isConnected = true
      reconnectAttempts = 0
      log('✅ Socket connected:', socket.id)
      
      // Set user online
      const userData = getStoredUserData()
      if (userData) {
        socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'online' })
      }
      
      resolve(socket)
    })
    
    socket.on('connect_error', (error) => {
      isConnected = false
      log('❌ Connection error:', error.message)
      reject(error)
    })
    
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      isConnected = false
      log('🔌 Disconnected:', reason)
      
      // Auto-reconnect for certain reasons
      if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
        attemptReconnection()
      }
    })
    
    socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
      isConnected = true
      reconnectAttempts = 0
      log('🔄 Reconnected after', attemptNumber, 'attempts')
      
      const userData = getStoredUserData()
      if (userData) {
        socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'online' })
      }
    })
    
    socket.on('error', (error) => {
      log('Socket error:', error)
      if (error.message?.includes('Authentication')) {
        disconnect()
        reject(new Error('Socket authentication failed'))
      }
    })
  })
}

export const disconnect = () => {
  if (socket && isConnected) {
    socket.emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status: 'offline' })
    socket.disconnect()
  }
  
  socket = null
  isConnected = false
  log('Socket manually disconnected')
}

// Event management
export const emit = (event, data) => {
  if (socket && isConnected) {
    log(`📤 Emitting: ${event}`, data)
    socket.emit(event, data)
  } else {
    console.warn('Socket not connected, cannot emit:', event)
  }
}

export const on = (event, callback) => {
  if (!socket) return
  
  // Store listener for cleanup
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event).add(callback)
  
  socket.on(event, callback)
  log(`👂 Listening to: ${event}`)
}

export const off = (event, callback) => {
  if (!socket) return
  
  if (callback) {
    socket.off(event, callback)
    eventListeners.get(event)?.delete(callback)
  } else {
    socket.off(event)
    eventListeners.delete(event)
  }
  
  log(`🔇 Stopped listening to: ${event}`)
}

export const cleanup = () => {
  if (socket) {
    eventListeners.forEach((callbacks, event) => socket.off(event))
    eventListeners.clear()
    log('🧹 Cleaned up all listeners')
  }
}

// Utility functions
export const isSocketConnected = () => socket?.connected || false
export const getSocket = () => socket

// High-level socket operations
export const joinConversation = (conversationId) => emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId)
export const leaveConversation = (conversationId) => emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId)
export const emitTypingStart = (conversationId) => emit(SOCKET_EVENTS.TYPING_START, { conversationId })
export const emitTypingStop = (conversationId) => emit(SOCKET_EVENTS.TYPING_STOP, { conversationId })
export const sendMessage = (messageData) => emit(SOCKET_EVENTS.SEND_MESSAGE, messageData)
export const editMessage = (messageId, newContent) => emit(SOCKET_EVENTS.EDIT_MESSAGE, { messageId, newContent })
export const deleteMessage = (messageId) => emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId })
export const addReaction = (messageId, emoji) => emit(SOCKET_EVENTS.ADD_REACTION, { messageId, emoji })
export const removeReaction = (messageId, emoji) => emit(SOCKET_EVENTS.REMOVE_REACTION, { messageId, emoji })
export const markMessagesRead = (messageIds, conversationId) => emit(SOCKET_EVENTS.MARK_MESSAGE_READ, { messageIds, conversationId })
export const updateUserStatus = (status) => emit(SOCKET_EVENTS.UPDATE_USER_STATUS, { status })
export const joinGroup = (groupId) => emit(SOCKET_EVENTS.JOIN_GROUP, { groupId })
export const leaveGroup = (groupId) => emit(SOCKET_EVENTS.LEAVE_GROUP, { groupId })
export const requestConversationInfo = (conversationId) => emit(SOCKET_EVENTS.REQUEST_CONVERSATION_INFO, { conversationId })

// Export service object
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
