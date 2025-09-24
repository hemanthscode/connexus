import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import socketService from '@/services/socketService.js'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Create context
const SocketContext = createContext(null)

// Custom hook to use socket context
export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}

// Socket provider component
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user, setUserStatus } = useAuth()
  const toast = useToast()
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  
  // User presence
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [typingUsers, setTypingUsers] = useState(new Map())
  
  // Event listeners
  const eventListeners = useRef(new Map())
  const reconnectTimer = useRef(null)
  const typingTimers = useRef(new Map())

  // Initialize socket connection
  const connect = useCallback(async () => {
    if (!isAuthenticated || isConnecting || isConnected) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      await socketService.initializeSocket()
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('Socket connected successfully')
      }
    } catch (error) {
      console.error('Socket connection failed:', error)
      setConnectionError(error.message)
      
      // Attempt reconnection with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      
      reconnectTimer.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1)
        connect()
      }, delay)
    }
  }, [isAuthenticated, isConnecting, isConnected, reconnectAttempts])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    
    // Clear typing timers
    typingTimers.current.forEach(timer => clearTimeout(timer))
    typingTimers.current.clear()
    
    // Clean up socket
    socketService.cleanup()
    socketService.disconnect()
    
    setIsConnected(false)
    setIsConnecting(false)
    setReconnectAttempts(0)
    setOnlineUsers(new Map())
    setTypingUsers(new Map())
    
    if (DEBUG.SOCKET_LOGS) {
      console.log('Socket disconnected and cleaned up')
    }
  }, [])

  // Handle connection events
  useEffect(() => {
    if (!isAuthenticated) {
      disconnect()
      return
    }

    // Connection successful
    const handleConnect = () => {
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionError(null)
      setReconnectAttempts(0)
      
      // Update user status to online
      if (user) {
        setUserStatus('online')
        socketService.updateUserStatus('online')
      }
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('Socket connected')
      }
    }

    // Connection lost
    const handleDisconnect = (reason) => {
      setIsConnected(false)
      setIsConnecting(false)
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('Socket disconnected:', reason)
      }
      
      // Don't auto-reconnect for manual disconnects
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        // Attempt reconnection
        setTimeout(() => {
          if (isAuthenticated) {
            connect()
          }
        }, 2000)
      }
    }

    // Handle connection errors
    const handleConnectError = (error) => {
      setIsConnecting(false)
      setConnectionError(error.message)
      
      console.error('Socket connection error:', error)
      
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        
        reconnectTimer.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connect()
        }, delay)
      } else {
        toast.error('Failed to connect to chat server')
      }
    }

    // Handle reconnection
    const handleReconnect = () => {
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionError(null)
      setReconnectAttempts(0)
      
      toast.success('Reconnected to chat server')
    }

    // Register event listeners
    socketService.on(SOCKET_EVENTS.CONNECT, handleConnect)
    socketService.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
    socketService.on('connect_error', handleConnectError)
    socketService.on(SOCKET_EVENTS.RECONNECT, handleReconnect)

    // Initial connection attempt
    connect()

    return () => {
      socketService.off(SOCKET_EVENTS.CONNECT, handleConnect)
      socketService.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
      socketService.off('connect_error', handleConnectError)
      socketService.off(SOCKET_EVENTS.RECONNECT, handleReconnect)
    }
  }, [isAuthenticated, connect, disconnect, reconnectAttempts, user, setUserStatus, toast])

  // Handle user presence events
  useEffect(() => {
    if (!isConnected) return

    // User came online
    const handleUserOnline = ({ userId, lastSeen }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev)
        updated.set(userId, {
          userId,
          status: 'online',
          lastSeen: null
        })
        return updated
      })
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('User came online:', userId)
      }
    }

    // User went offline
    const handleUserOffline = ({ userId, lastSeen }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev)
        updated.set(userId, {
          userId,
          status: 'offline',
          lastSeen
        })
        return updated
      })
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('User went offline:', userId)
      }
    }

    // Current online users
    const handleCurrentOnlineUsers = (users) => {
      const userMap = new Map()
      users.forEach(user => {
        userMap.set(user.userId, {
          userId: user.userId,
          status: 'online',
          lastSeen: null
        })
      })
      setOnlineUsers(userMap)
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('Current online users:', users.length)
      }
    }

    // User status updated
    const handleUserStatusUpdated = ({ userId, status, lastSeen }) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev)
        updated.set(userId, {
          userId,
          status,
          lastSeen: status === 'offline' ? lastSeen : null
        })
        return updated
      })
    }

    // Register presence event listeners
    socketService.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline)
    socketService.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline)
    socketService.on(SOCKET_EVENTS.CURRENT_ONLINE_USERS, handleCurrentOnlineUsers)
    socketService.on(SOCKET_EVENTS.USER_STATUS_UPDATED, handleUserStatusUpdated)

    return () => {
      socketService.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline)
      socketService.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline)
      socketService.off(SOCKET_EVENTS.CURRENT_ONLINE_USERS, handleCurrentOnlineUsers)
      socketService.off(SOCKET_EVENTS.USER_STATUS_UPDATED, handleUserStatusUpdated)
    }
  }, [isConnected])

  // Handle typing events
  useEffect(() => {
    if (!isConnected) return

    // User started typing
    const handleUserTyping = ({ userId, user, conversationId }) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        const conversationTyping = updated.get(conversationId) || new Map()
        
        conversationTyping.set(userId, {
          userId,
          user,
          timestamp: Date.now()
        })
        
        updated.set(conversationId, conversationTyping)
        return updated
      })

      // Clear typing after timeout
      const timerId = setTimeout(() => {
        setTypingUsers(prev => {
          const updated = new Map(prev)
          const conversationTyping = updated.get(conversationId)
          
          if (conversationTyping) {
            conversationTyping.delete(userId)
            if (conversationTyping.size === 0) {
              updated.delete(conversationId)
            } else {
              updated.set(conversationId, conversationTyping)
            }
          }
          
          return updated
        })
      }, 3000)

      // Store timer for cleanup
      const timerKey = `${conversationId}-${userId}`
      if (typingTimers.current.has(timerKey)) {
        clearTimeout(typingTimers.current.get(timerKey))
      }
      typingTimers.current.set(timerKey, timerId)
    }

    // User stopped typing
    const handleUserStopTyping = ({ userId, conversationId }) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        const conversationTyping = updated.get(conversationId)
        
        if (conversationTyping) {
          conversationTyping.delete(userId)
          if (conversationTyping.size === 0) {
            updated.delete(conversationId)
          } else {
            updated.set(conversationId, conversationTyping)
          }
        }
        
        return updated
      })

      // Clear timer
      const timerKey = `${conversationId}-${userId}`
      if (typingTimers.current.has(timerKey)) {
        clearTimeout(typingTimers.current.get(timerKey))
        typingTimers.current.delete(timerKey)
      }
    }

    // Register typing event listeners
    socketService.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping)
    socketService.on(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping)

    return () => {
      socketService.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping)
      socketService.off(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping)
    }
  }, [isConnected])

  // Handle page visibility for status updates
  useEffect(() => {
    if (!isConnected || !user) return

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online'
      setUserStatus(status)
      socketService.updateUserStatus(status)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isConnected, user, setUserStatus])

  // Handle page unload
  useEffect(() => {
    if (!isConnected) return

    const handleBeforeUnload = () => {
      if (user) {
        setUserStatus('offline')
        socketService.updateUserStatus('offline')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isConnected, user, setUserStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Utility functions
  const addEventListener = useCallback((event, callback) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set())
    }
    eventListeners.current.get(event).add(callback)
    socketService.on(event, callback)
  }, [])

  const removeEventListener = useCallback((event, callback) => {
    if (eventListeners.current.has(event)) {
      eventListeners.current.get(event).delete(callback)
    }
    socketService.off(event, callback)
  }, [])

  const emit = useCallback((event, data) => {
    if (isConnected) {
      socketService.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }, [isConnected])

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    if (connectionError) return 'error'
    if (isConnecting) return 'connecting'
    if (isConnected) return 'connected'
    return 'disconnected'
  }, [isConnected, isConnecting, connectionError])

  // Get user online status
  const getUserOnlineStatus = useCallback((userId) => {
    const userStatus = onlineUsers.get(userId)
    return userStatus?.status || 'offline'
  }, [onlineUsers])

  // Get typing users for conversation
  const getTypingUsers = useCallback((conversationId) => {
    return Array.from(typingUsers.get(conversationId)?.values() || [])
  }, [typingUsers])

  // Context value
  const contextValue = {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    connectionStatus: getConnectionStatus(),
    reconnectAttempts,

    // User presence
    onlineUsers: Array.from(onlineUsers.values()),
    typingUsers,
    
    // Connection control
    connect,
    disconnect,
    
    // Event handling
    addEventListener,
    removeEventListener,
    emit,
    
    // Utility functions
    getUserOnlineStatus,
    getTypingUsers,
    
    // Socket service methods
    joinConversation: socketService.joinConversation,
    leaveConversation: socketService.leaveConversation,
    emitTypingStart: socketService.emitTypingStart,
    emitTypingStop: socketService.emitTypingStop,
    sendMessage: socketService.sendMessage,
    editMessage: socketService.editMessage,
    deleteMessage: socketService.deleteMessage,
    addReaction: socketService.addReaction,
    removeReaction: socketService.removeReaction,
    markMessagesRead: socketService.markMessagesRead,
    updateUserStatus: socketService.updateUserStatus,
    joinGroup: socketService.joinGroup,
    leaveGroup: socketService.leaveGroup,
    requestConversationInfo: socketService.requestConversationInfo,
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

// Export context for direct access if needed
export { SocketContext }

// Default export
export default SocketProvider
