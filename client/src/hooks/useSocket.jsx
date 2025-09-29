import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useSocketContext } from '@/context/SocketContext.jsx'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { debounce } from '@/utils/helpers.js'

// Main socket hook
export const useSocket = () => {
  const socketContext = useSocketContext()
  
  if (!socketContext) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  
  return socketContext
}

// Conversation-specific socket hook - optimized
export const useConversationSocket = (conversationId) => {
  const {
    isConnected,
    addEventListener,
    removeEventListener,
    joinConversation,
    leaveConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesRead,
    emitTypingStart,
    emitTypingStop,
    getTypingUsers
  } = useSocket()

  const [messages, setMessages] = useState([])
  const [isJoined, setIsJoined] = useState(false)
  
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)

  // Join/leave conversation
  useEffect(() => {
    if (!conversationId || !isConnected) return

    joinConversation(conversationId)
    setIsJoined(true)

    return () => {
      if (isJoined) {
        leaveConversation(conversationId)
        setIsJoined(false)
      }
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation])

  // Message event handlers
  useEffect(() => {
    if (!conversationId || !isConnected) return

    const handlers = {
      [SOCKET_EVENTS.NEW_MESSAGE]: ({ message, conversationId: msgConvId }) => {
        if (msgConvId === conversationId) {
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === message._id)
            if (exists) return prev
            return [...prev, message].sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            )
          })
        }
      },

      [SOCKET_EVENTS.MESSAGE_EDITED]: ({ messageId, newContent, editedAt }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, content: newContent, editedAt } : msg
        ))
      },

      [SOCKET_EVENTS.MESSAGE_DELETED]: ({ messageId, deletedAt }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, isDeleted: true, deletedAt } : msg
        ))
      },

      [SOCKET_EVENTS.REACTION_UPDATED]: ({ messageId, reactions }) => {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        ))
      },

      [SOCKET_EVENTS.MESSAGE_READ]: ({ conversationId: readConvId, userId }) => {
        if (readConvId === conversationId) {
          setMessages(prev => prev.map(msg => ({
            ...msg,
            readBy: [
              ...(msg.readBy || []),
              ...(msg.readBy?.find(r => r.user === userId) ? [] : [{
                user: userId, 
                readAt: new Date().toISOString()
              }])
            ]
          })))
        }
      },
    }

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      addEventListener(event, handler)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        removeEventListener(event, handler)
      })
    }
  }, [conversationId, isConnected, addEventListener, removeEventListener])

  // Typing management with debouncing
  const debouncedStopTyping = useMemo(() => debounce(() => {
    if (isTypingRef.current && conversationId) {
      emitTypingStop(conversationId)
      isTypingRef.current = false
    }
  }, 1000), [conversationId, emitTypingStop])

  const handleTypingStart = useCallback(() => {
    if (!conversationId || !isConnected) return

    if (!isTypingRef.current) {
      emitTypingStart(conversationId)
      isTypingRef.current = true
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to auto-stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitTypingStop(conversationId)
        isTypingRef.current = false
      }
    }, 3000)

    debouncedStopTyping()
  }, [conversationId, isConnected, emitTypingStart, emitTypingStop, debouncedStopTyping])

  const handleTypingStop = useCallback(() => {
    if (!conversationId || !isConnected) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (isTypingRef.current) {
      emitTypingStop(conversationId)
      isTypingRef.current = false
    }
  }, [conversationId, isConnected, emitTypingStop])

  // Socket operations
  const socketOperations = useMemo(() => ({
    sendMessage: (messageData) => {
      if (!conversationId || !isConnected) return
      sendMessage({ ...messageData, conversationId })
    },

    editMessage: (messageId, newContent) => {
      if (!isConnected) return
      editMessage(messageId, newContent)
    },

    deleteMessage: (messageId) => {
      if (!isConnected) return
      deleteMessage(messageId)
    },

    addReaction: (messageId, emoji) => {
      if (!isConnected) return
      addReaction(messageId, emoji)
    },

    removeReaction: (messageId, emoji) => {
      if (!isConnected) return
      removeReaction(messageId, emoji)
    },

    markMessagesRead: (messageIds) => {
      if (!conversationId || !isConnected || !messageIds.length) return
      markMessagesRead(messageIds, conversationId)
    },
  }), [conversationId, isConnected, sendMessage, editMessage, deleteMessage, addReaction, removeReaction, markMessagesRead])

  return {
    // State
    messages,
    isJoined,
    isConnected,
    typingUsers: getTypingUsers(conversationId),

    // Operations
    ...socketOperations,

    // Typing
    startTyping: handleTypingStart,
    stopTyping: handleTypingStop,

    // Utilities
    setMessages,
    clearMessages: () => setMessages([]),
  }
}

// Simplified group socket hook
export const useGroupSocket = (groupId) => {
  const { isConnected, addEventListener, removeEventListener, joinGroup, leaveGroup } = useSocket()
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    if (!groupId || !isConnected) return

    joinGroup(groupId)

    const handlers = {
      [SOCKET_EVENTS.USER_JOINED_GROUP]: ({ userId, user, groupId: joinedGroupId }) => {
        if (joinedGroupId === groupId) {
          setParticipants(prev => {
            const exists = prev.some(p => p.userId === userId)
            return exists ? prev : [...prev, { userId, user }]
          })
        }
      },

      [SOCKET_EVENTS.USER_LEFT_GROUP]: ({ userId, groupId: leftGroupId }) => {
        if (leftGroupId === groupId) {
          setParticipants(prev => prev.filter(p => p.userId !== userId))
        }
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      addEventListener(event, handler)
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        removeEventListener(event, handler)
      })
      leaveGroup(groupId)
    }
  }, [groupId, isConnected, joinGroup, leaveGroup, addEventListener, removeEventListener])

  return { participants, isConnected }
}

// Socket error and stats hooks combined
export const useSocketStatus = () => {
  const { connectionError, connectionStatus, reconnectAttempts, connect, isConnected, onlineUsers } = useSocket()
  
  const [connectionUptime, setConnectionUptime] = useState(0)
  const [errorHistory, setErrorHistory] = useState([])
  const connectionStartTime = useRef(null)

  // Track connection uptime
  useEffect(() => {
    if (isConnected) {
      connectionStartTime.current = Date.now()
      const interval = setInterval(() => {
        if (connectionStartTime.current) {
          setConnectionUptime(Date.now() - connectionStartTime.current)
        }
      }, 1000)
      return () => clearInterval(interval)
    } else {
      connectionStartTime.current = null
      setConnectionUptime(0)
    }
  }, [isConnected])

  // Track error history
  useEffect(() => {
    if (connectionError) {
      setErrorHistory(prev => [
        ...prev.slice(-9), // Keep last 10 errors
        {
          error: connectionError,
          timestamp: new Date().toISOString(),
          attempts: reconnectAttempts
        }
      ])
    }
  }, [connectionError, reconnectAttempts])

  const retry = useCallback(() => connect(), [connect])
  const clearErrors = useCallback(() => setErrorHistory([]), [])

  return {
    // Connection status
    error: connectionError,
    status: connectionStatus,
    isConnected,
    attempts: reconnectAttempts,

    // Statistics
    onlineUsersCount: onlineUsers.length,
    connectionUptime,
    uptimeFormatted: connectionUptime > 0 
      ? `${Math.floor(connectionUptime / 60000)}m ${Math.floor((connectionUptime % 60000) / 1000)}s`
      : '0s',

    // Error management
    errorHistory,
    hasError: !!connectionError,

    // Actions
    retry,
    clearErrors,
  }
}

export default useSocket
