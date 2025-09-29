import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth.jsx'
import socketService from '@/services/socketService.js'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

const SocketContext = createContext(null)

export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  // FIXED: Get token from useAuth hook
  const { isAuthenticated, user, token } = useAuth()
  const toast = useToast()

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // User presence
  const [onlineUsers, setOnlineUsers] = useState(new Map())
  const [typingUsers, setTypingUsers] = useState(new Map())

  // Refs for cleanup
  const eventListeners = useRef(new Map())
  const reconnectTimer = useRef(null)
  const typingTimers = useRef(new Map())

  // FIXED: Connection management with token validation
  const connect = useCallback(async () => {
    // FIXED: Check for both authentication and token
    if (!isAuthenticated || !token || isConnecting || isConnected) {
      if (DEBUG.SOCKET_LOGS && !token) {
        console.log('Socket connection skipped: No auth token available')
      }
      return
    }

    setIsConnecting(true)
    setConnectionError(null)

    try {
      // FIXED: Pass the auth token to socket service
      await socketService.initializeSocket(token)
      if (DEBUG.SOCKET_LOGS) console.log('Socket connected with token')
    } catch (error) {
      console.error('Socket connection failed:', error)
      setConnectionError(error.message)

      // Only retry if we still have a valid token
      if (token && reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        reconnectTimer.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connect()
        }, delay)
      }
    }
  }, [isAuthenticated, token, isConnecting, isConnected, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }

    typingTimers.current.forEach(timer => clearTimeout(timer))
    typingTimers.current.clear()

    socketService.cleanup()
    socketService.disconnect()

    setIsConnected(false)
    setIsConnecting(false)
    setReconnectAttempts(0)
    setOnlineUsers(new Map())
    setTypingUsers(new Map())
  }, [])

  // FIXED: Socket event handlers with token dependency
  useEffect(() => {
    // FIXED: Disconnect if no auth or token
    if (!isAuthenticated || !token) {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Disconnecting socket: Authentication lost')
      }
      disconnect()
      return
    }

    const handleConnect = () => {
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionError(null)
      setReconnectAttempts(0)

      if (user) {
        socketService.updateUserStatus('online')
      }
    }

    const handleDisconnect = (reason) => {
      setIsConnected(false)
      setIsConnecting(false)

      if (DEBUG.SOCKET_LOGS) {
        console.log('Socket disconnected:', reason)
      }

      // Auto-reconnect for unexpected disconnects (but only if we have auth)
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect' && token) {
        setTimeout(() => {
          if (isAuthenticated && token) connect()
        }, 2000)
      }
    }

    const handleConnectError = (error) => {
      setIsConnecting(false)
      setConnectionError(error.message)

      // FIXED: Only retry if we have a valid token and haven't exceeded max attempts
      if (token && reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        reconnectTimer.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1)
          connect()
        }, delay)
      } else {
        if (reconnectAttempts >= 5) {
          toast.error('Failed to connect to chat server after multiple attempts')
        } else if (!token) {
          console.warn('Cannot reconnect: No auth token available')
        }
      }
    }

    const handleReconnect = () => {
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionError(null)
      setReconnectAttempts(0)
      toast.success('Reconnected to chat server')
    }

    // Register connection events
    socketService.on(SOCKET_EVENTS.CONNECT, handleConnect)
    socketService.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
    socketService.on('connect_error', handleConnectError)
    socketService.on(SOCKET_EVENTS.RECONNECT, handleReconnect)

    // FIXED: Only attempt connection if we have a token
    if (token) {
      connect()
    }

    return () => {
      socketService.off(SOCKET_EVENTS.CONNECT, handleConnect)
      socketService.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect)
      socketService.off('connect_error', handleConnectError)
      socketService.off(SOCKET_EVENTS.RECONNECT, handleReconnect)
    }
  }, [isAuthenticated, user, token, connect, disconnect, reconnectAttempts, toast])

  // User presence events
  useEffect(() => {
    if (!isConnected) return

    const updateUserPresence = (userId, status, lastSeen = null) => {
      setOnlineUsers(prev => {
        const updated = new Map(prev)
        updated.set(userId, { userId, status, lastSeen })
        return updated
      })
    }

    const handleUserOnline = ({ userId }) => updateUserPresence(userId, 'online')
    const handleUserOffline = ({ userId, lastSeen }) => updateUserPresence(userId, 'offline', lastSeen)
    const handleUserStatusUpdated = ({ userId, status, lastSeen }) => updateUserPresence(userId, status, lastSeen)
    
    const handleCurrentOnlineUsers = (users) => {
      const userMap = new Map()
      users.forEach(user => {
        userMap.set(user.userId, { userId: user.userId, status: 'online', lastSeen: null })
      })
      setOnlineUsers(userMap)
    }

    // Register presence events
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

  // Typing events
  useEffect(() => {
    if (!isConnected) return

    const handleUserTyping = ({ userId, user, conversationId }) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        const conversationTyping = updated.get(conversationId) || new Map()
        conversationTyping.set(userId, { userId, user, timestamp: Date.now() })
        updated.set(conversationId, conversationTyping)
        return updated
      })

      // Auto-clear typing after 3 seconds
      const timerKey = `${conversationId}-${userId}`
      if (typingTimers.current.has(timerKey)) {
        clearTimeout(typingTimers.current.get(timerKey))
      }
      
      const timerId = setTimeout(() => {
        setTypingUsers(prev => {
          const updated = new Map(prev)
          const conversationTyping = updated.get(conversationId)
          if (conversationTyping) {
            conversationTyping.delete(userId)
            if (conversationTyping.size === 0) {
              updated.delete(conversationId)
            }
          }
          return updated
        })
      }, 3000)
      
      typingTimers.current.set(timerKey, timerId)
    }

    const handleUserStopTyping = ({ userId, conversationId }) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        const conversationTyping = updated.get(conversationId)
        if (conversationTyping) {
          conversationTyping.delete(userId)
          if (conversationTyping.size === 0) {
            updated.delete(conversationId)
          }
        }
        return updated
      })

      const timerKey = `${conversationId}-${userId}`
      if (typingTimers.current.has(timerKey)) {
        clearTimeout(typingTimers.current.get(timerKey))
        typingTimers.current.delete(timerKey)
      }
    }

    socketService.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping)
    socketService.on(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping)

    return () => {
      socketService.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping)
      socketService.off(SOCKET_EVENTS.USER_STOP_TYPING, handleUserStopTyping)
    }
  }, [isConnected])

  // Status management based on page visibility
  useEffect(() => {
    if (!isConnected || !user) return

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online'
      socketService.updateUserStatus(status)
    }

    const handleBeforeUnload = () => {
      if (user) socketService.updateUserStatus('offline')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isConnected, user])

  // Cleanup on unmount
  useEffect(() => () => disconnect(), [disconnect])

  // Event management utilities
  const addEventListener = useCallback((event, callback) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set())
    }
    eventListeners.current.get(event).add(callback)
    socketService.on(event, callback)
  }, [])

  const removeEventListener = useCallback((event, callback) => {
    eventListeners.current.get(event)?.delete(callback)
    socketService.off(event, callback)
  }, [])

  const emit = useCallback((event, data) => {
    if (isConnected) {
      socketService.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }, [isConnected])

  // Utility functions
  const getUserOnlineStatus = useCallback((userId) => {
    return onlineUsers.get(userId)?.status || 'offline'
  }, [onlineUsers])

  const getTypingUsers = useCallback((conversationId) => {
    return Array.from(typingUsers.get(conversationId)?.values() || [])
  }, [typingUsers])

  const getConnectionStatus = useCallback(() => {
    if (connectionError) return 'error'
    if (isConnecting) return 'connecting'
    if (isConnected) return 'connected'
    return 'disconnected'
  }, [isConnected, isConnecting, connectionError])

  // FIXED: Memoized context value with token dependency
  const contextValue = useMemo(() => ({
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

    // Socket service methods (direct pass-through)
    joinConversation: (conversationId) => isConnected && socketService.joinConversation?.(conversationId),
    leaveConversation: (conversationId) => isConnected && socketService.leaveConversation?.(conversationId),
    updateUserStatus: (status) => isConnected && socketService.updateUserStatus?.(status),
  }), [
    isConnected, isConnecting, connectionError, reconnectAttempts,
    onlineUsers, typingUsers, connect, disconnect, addEventListener,
    removeEventListener, emit, getUserOnlineStatus, getTypingUsers, getConnectionStatus
  ])

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
