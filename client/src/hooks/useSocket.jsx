import { useCallback, useEffect, useState, useRef } from 'react'
import { useSocketContext } from '@/context/SocketContext.jsx'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { debounce } from '@/utils/helpers.js'

/**
 * Main socket hook that provides socket functionality
 */
export const useSocket = () => {
  const socketContext = useSocketContext()
  
  if (!socketContext) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  
  return socketContext
}

/**
 * Hook for managing conversation-specific socket events
 */
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

  // Join conversation when component mounts or conversationId changes
  useEffect(() => {
    if (!conversationId || !isConnected) return

    joinConversation(conversationId)
    setIsJoined(true)

    const handleJoinedConversation = ({ conversationId: joinedId }) => {
      if (joinedId === conversationId) {
        setIsJoined(true)
        if (DEBUG.SOCKET_LOGS) {
          console.log('Joined conversation:', conversationId)
        }
      }
    }

    const handleLeftConversation = ({ conversationId: leftId }) => {
      if (leftId === conversationId) {
        setIsJoined(false)
        if (DEBUG.SOCKET_LOGS) {
          console.log('Left conversation:', conversationId)
        }
      }
    }

    addEventListener(SOCKET_EVENTS.JOINED_CONVERSATION, handleJoinedConversation)
    addEventListener(SOCKET_EVENTS.LEFT_CONVERSATION, handleLeftConversation)

    return () => {
      removeEventListener(SOCKET_EVENTS.JOINED_CONVERSATION, handleJoinedConversation)
      removeEventListener(SOCKET_EVENTS.LEFT_CONVERSATION, handleLeftConversation)
      
      if (isJoined) {
        leaveConversation(conversationId)
        setIsJoined(false)
      }
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation, addEventListener, removeEventListener, isJoined])

  // Handle new messages
  useEffect(() => {
    if (!conversationId || !isConnected) return

    const handleNewMessage = ({ message, conversationId: messageConversationId }) => {
      if (messageConversationId === conversationId) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg._id === message._id)
          if (exists) return prev
          
          return [...prev, message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          )
        })
      }
    }

    const handleMessageEdited = ({ messageId, newContent, editedAt }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, content: newContent, editedAt }
          : msg
      ))
    }

    const handleMessageDeleted = ({ messageId, deletedAt }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, isDeleted: true, deletedAt }
          : msg
      ))
    }

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, reactions }
          : msg
      ))
    }

    const handleMessageRead = ({ conversationId: readConversationId, userId }) => {
      if (readConversationId === conversationId) {
        setMessages(prev => prev.map(msg => {
          if (!msg.readBy) msg.readBy = []
          
          const existingRead = msg.readBy.find(r => r.user === userId)
          if (!existingRead) {
            msg.readBy.push({ user: userId, readAt: new Date().toISOString() })
          }
          
          return msg
        }))
      }
    }

    addEventListener(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage)
    addEventListener(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited)
    addEventListener(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted)
    addEventListener(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated)
    addEventListener(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead)

    return () => {
      removeEventListener(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage)
      removeEventListener(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited)
      removeEventListener(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted)
      removeEventListener(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated)
      removeEventListener(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead)
    }
  }, [conversationId, isConnected, addEventListener, removeEventListener])

  // Debounced typing indicators
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isTypingRef.current && conversationId) {
        emitTypingStop(conversationId)
        isTypingRef.current = false
      }
    }, 1000),
    [conversationId, emitTypingStop]
  )

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

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitTypingStop(conversationId)
        isTypingRef.current = false
      }
    }, 3000)

    // Also use debounced version
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

  // Socket message operations
  const sendSocketMessage = useCallback((messageData) => {
    if (!conversationId || !isConnected) return

    sendMessage({
      ...messageData,
      conversationId
    })
  }, [conversationId, isConnected, sendMessage])

  const editSocketMessage = useCallback((messageId, newContent) => {
    if (!isConnected) return
    editMessage(messageId, newContent)
  }, [isConnected, editMessage])

  const deleteSocketMessage = useCallback((messageId) => {
    if (!isConnected) return
    deleteMessage(messageId)
  }, [isConnected, deleteMessage])

  const addSocketReaction = useCallback((messageId, emoji) => {
    if (!isConnected) return
    addReaction(messageId, emoji)
  }, [isConnected, addReaction])

  const removeSocketReaction = useCallback((messageId, emoji) => {
    if (!isConnected) return
    removeReaction(messageId, emoji)
  }, [isConnected, removeReaction])

  const markSocketMessagesRead = useCallback((messageIds) => {
    if (!conversationId || !isConnected || !messageIds.length) return
    markMessagesRead(messageIds, conversationId)
  }, [conversationId, isConnected, markMessagesRead])

  // Get typing users for this conversation
  const typingUsers = getTypingUsers(conversationId)

  return {
    // State
    messages,
    isJoined,
    isConnected,
    typingUsers,

    // Message operations
    sendMessage: sendSocketMessage,
    editMessage: editSocketMessage,
    deleteMessage: deleteSocketMessage,
    addReaction: addSocketReaction,
    removeReaction: removeSocketReaction,
    markMessagesRead: markSocketMessagesRead,

    // Typing indicators
    startTyping: handleTypingStart,
    stopTyping: handleTypingStop,

    // Utilities
    setMessages,
    clearMessages: () => setMessages([])
  }
}

/**
 * Hook for managing group-specific socket events
 */
export const useGroupSocket = (groupId) => {
  const {
    isConnected,
    addEventListener,
    removeEventListener,
    joinGroup,
    leaveGroup
  } = useSocket()

  const [participants, setParticipants] = useState([])
  const [isJoined, setIsJoined] = useState(false)

  // Join group when component mounts
  useEffect(() => {
    if (!groupId || !isConnected) return

    joinGroup(groupId)

    const handleUserJoinedGroup = ({ userId, user, groupId: joinedGroupId }) => {
      if (joinedGroupId === groupId) {
        setParticipants(prev => {
          const exists = prev.some(p => p.userId === userId)
          if (exists) return prev
          
          return [...prev, { userId, user }]
        })
      }
    }

    const handleUserLeftGroup = ({ userId, groupId: leftGroupId }) => {
      if (leftGroupId === groupId) {
        setParticipants(prev => prev.filter(p => p.userId !== userId))
      }
    }

    addEventListener(SOCKET_EVENTS.USER_JOINED_GROUP, handleUserJoinedGroup)
    addEventListener(SOCKET_EVENTS.USER_LEFT_GROUP, handleUserLeftGroup)

    return () => {
      removeEventListener(SOCKET_EVENTS.USER_JOINED_GROUP, handleUserJoinedGroup)
      removeEventListener(SOCKET_EVENTS.USER_LEFT_GROUP, handleUserLeftGroup)
      
      if (isJoined) {
        leaveGroup(groupId)
        setIsJoined(false)
      }
    }
  }, [groupId, isConnected, joinGroup, leaveGroup, addEventListener, removeEventListener, isJoined])

  return {
    participants,
    isJoined,
    isConnected
  }
}

/**
 * Hook for handling socket errors and reconnection
 */
export const useSocketError = () => {
  const { connectionError, connectionStatus, reconnectAttempts, connect } = useSocket()
  const [lastError, setLastError] = useState(null)
  const [errorHistory, setErrorHistory] = useState([])

  useEffect(() => {
    if (connectionError && connectionError !== lastError) {
      setLastError(connectionError)
      setErrorHistory(prev => [
        ...prev.slice(-9), // Keep last 10 errors
        {
          error: connectionError,
          timestamp: new Date().toISOString(),
          reconnectAttempts
        }
      ])
    }
  }, [connectionError, lastError, reconnectAttempts])

  const retry = useCallback(() => {
    connect()
  }, [connect])

  const clearErrors = useCallback(() => {
    setLastError(null)
    setErrorHistory([])
  }, [])

  return {
    error: connectionError,
    status: connectionStatus,
    attempts: reconnectAttempts,
    history: errorHistory,
    retry,
    clearErrors,
    hasError: !!connectionError
  }
}

/**
 * Hook for socket connection statistics
 */
export const useSocketStats = () => {
  const { isConnected, onlineUsers, reconnectAttempts } = useSocket()
  const [connectionUptime, setConnectionUptime] = useState(0)
  const [totalReconnects, setTotalReconnects] = useState(0)
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

  // Track total reconnects
  useEffect(() => {
    setTotalReconnects(reconnectAttempts)
  }, [reconnectAttempts])

  return {
    isConnected,
    onlineUsersCount: onlineUsers.length,
    connectionUptime,
    totalReconnects,
    uptimeFormatted: connectionUptime > 0 
      ? `${Math.floor(connectionUptime / 60000)}m ${Math.floor((connectionUptime % 60000) / 1000)}s`
      : '0s'
  }
}

export default useSocket
