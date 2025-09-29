import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import useChatStore from '@/store/chatSlice.js'
import { useSocket } from '@/hooks/useSocket.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

const ChatContext = createContext(null)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const chatStore = useChatStore()
  const { isConnected, addEventListener, removeEventListener, joinConversation, leaveConversation } = useSocket()
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()

  const [isInitialized, setIsInitialized] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(null)

  const socketListenersRef = useRef(new Set())
  const currentConversationRef = useRef(null)
  const initializationAttempted = useRef(false)

  // FIXED: Initialize chat data with proper store methods
  useEffect(() => {
    const initialize = async () => {
      // Prevent multiple initialization attempts
      if (!user || !isAuthenticated || isInitialized || initializationAttempted.current) {
        return
      }

      initializationAttempted.current = true

      try {
        if (DEBUG.ENABLED) console.log('💬 Initializing chat context...')

        // FIXED: Use the store's addUserToCache method instead of setState
        const existingUser = chatStore.userCache?.[user._id]
        if (!existingUser) {
          chatStore.addUserToCache({ ...user, userId: user._id })
        }

        // Load conversations
        await chatStore.loadConversations()
        
        setIsInitialized(true)

        if (DEBUG.ENABLED) console.log('💬 Chat context initialized')
      } catch (error) {
        console.error('Chat initialization failed:', error)
        toast.error('Failed to load conversations')
        initializationAttempted.current = false // Allow retry on error
      }
    }

    initialize()
  }, [user?._id, isAuthenticated, isInitialized])

  // Reset initialization when user changes
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setIsInitialized(false)
      initializationAttempted.current = false
      setCurrentConversationId(null)
    }
  }, [user?._id, isAuthenticated])

  // Socket event handlers
  useEffect(() => {
    if (!isConnected || !isInitialized) return

    const handlers = {
      [SOCKET_EVENTS.NEW_MESSAGE]: ({ message, conversationId }) => {
        if (DEBUG.SOCKET_LOGS) console.log('📨 Received new message:', message)
        
        chatStore.addSocketMessage(message)
        
        // Show notification if not in active conversation
        if (conversationId !== chatStore.activeConversationId) {
          const conversation = chatStore.getConversationById(conversationId)
          const conversationName = conversation?.name || 'Unknown'
          
          toast.info(`New message in ${conversationName}`, {
            duration: 3000,
            onClick: () => chatStore.setActiveConversation(conversationId)
          })
        }
      },

      [SOCKET_EVENTS.MESSAGE_EDITED]: ({ messageId, newContent, editedAt }) => {
        if (DEBUG.SOCKET_LOGS) console.log('✏️ Message edited:', messageId)
        // FIXED: Use a store method instead of setState
        chatStore.updateMessageInConversations?.(messageId, { content: newContent, editedAt })
      },

      [SOCKET_EVENTS.MESSAGE_DELETED]: ({ messageId, deletedAt }) => {
        if (DEBUG.SOCKET_LOGS) console.log('🗑️ Message deleted:', messageId)
        // FIXED: Use a store method instead of setState  
        chatStore.updateMessageInConversations?.(messageId, { 
          isDeleted: true, 
          deletedAt, 
          content: 'This message was deleted' 
        })
      },

      [SOCKET_EVENTS.REACTION_UPDATED]: ({ messageId, reactions }) => {
        if (DEBUG.SOCKET_LOGS) console.log('⚡ Reaction updated:', messageId)
        chatStore.updateMessageInConversations?.(messageId, { reactions })
      },

      [SOCKET_EVENTS.MESSAGE_READ]: ({ conversationId, userId }) => {
        if (DEBUG.SOCKET_LOGS) console.log('👁️ Messages read:', conversationId)
        chatStore.markMessagesAsReadByUser?.(conversationId, userId)
      },

      [SOCKET_EVENTS.USER_JOINED_GROUP]: ({ userId, user: userData, groupId }) => {
        chatStore.updateGroupParticipants?.(groupId, 'add', { 
          user: userData, 
          joinedAt: new Date().toISOString(), 
          role: 'member' 
        })
      },

      [SOCKET_EVENTS.USER_LEFT_GROUP]: ({ userId, groupId }) => {
        chatStore.updateGroupParticipants?.(groupId, 'remove', userId)
      },
    }

    // Register all event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      addEventListener(event, handler)
      socketListenersRef.current.add({ event, handler })
    })

    return () => {
      socketListenersRef.current.forEach(({ event, handler }) => {
        removeEventListener(event, handler)
      })
      socketListenersRef.current.clear()
    }
  }, [isConnected, isInitialized, chatStore, addEventListener, removeEventListener, toast])

  // Handle active conversation changes
  useEffect(() => {
    const activeConversationId = chatStore.activeConversationId
    
    if (activeConversationId !== currentConversationId) {
      // Leave previous conversation
      if (currentConversationRef.current && isConnected) {
        leaveConversation(currentConversationRef.current)
      }
      
      // Join new conversation
      if (activeConversationId && isConnected) {
        joinConversation(activeConversationId)
        
        // Load messages if not already loaded
        const messages = chatStore.messagesByConversation?.[activeConversationId]
        if (!messages || messages.length === 0) {
          chatStore.loadMessages(activeConversationId)
        }
        
        // Mark as read after a short delay
        setTimeout(() => {
          chatStore.markAsRead(activeConversationId)
        }, 1000)
      }
      
      setCurrentConversationId(activeConversationId)
      currentConversationRef.current = activeConversationId
    }
  }, [chatStore.activeConversationId, currentConversationId, isConnected, joinConversation, leaveConversation])

  // Enhanced chat operations
  const enhancedActions = useMemo(() => ({
    sendMessage: async (messageData) => {
      const result = await chatStore.sendMessage(messageData)
      
      if (result?.success) {
        // Clear reply state and mark as read
        chatStore.setReplyToMessage?.(null)
        setTimeout(() => {
          chatStore.markAsRead(messageData.conversationId)
        }, 500)
      }
      
      return result
    },

    createAndSetActive: async (type, data) => {
      const result = type === 'direct' 
        ? await chatStore.createDirectConversation(data.participantId)
        : await chatStore.createGroup(data)
      
      if (result?.success) {
        chatStore.setActiveConversation(result.data._id)
      }
      
      return result
    },

    loadMoreMessages: async (conversationId) => {
      const pagination = chatStore.messagesPagination?.[conversationId]
      const nextPage = pagination ? pagination.page + 1 : 2
      return await chatStore.loadMessages(conversationId, nextPage)
    },
  }), [chatStore])

  // Memoized context value with safe property access
  const contextValue = useMemo(() => ({
    // Store state (with fallbacks)
    conversations: chatStore.conversations || [],
    activeConversationId: chatStore.activeConversationId || null,
    messagesByConversation: chatStore.messagesByConversation || {},
    messagesLoading: chatStore.messagesLoading || false,
    messagesPagination: chatStore.messagesPagination || {},
    
    // Local state
    isInitialized,
    currentConversationId,
    isConnected,
    
    // Enhanced actions
    ...enhancedActions,
    
    // Store actions (with null checks)
    loadConversations: chatStore.loadConversations || (() => Promise.resolve()),
    loadMessages: chatStore.loadMessages || (() => Promise.resolve()),
    sendMessage: chatStore.sendMessage || (() => Promise.resolve({ success: false })),
    setActiveConversation: chatStore.setActiveConversation || (() => {}),
    getConversationById: chatStore.getConversationById || (() => null),
    getMessagesForConversation: chatStore.getMessagesForConversation || (() => []),
    markAsRead: chatStore.markAsRead || (() => {}),
    
    // Utilities
    formatConversationName: (conversation, currentUserId) => {
      if (conversation?.type === 'group') {
        return conversation.name || 'Unnamed Group'
      }
      
      const otherParticipant = conversation?.participants?.find(
        p => p.user?._id !== currentUserId
      )
      
      return otherParticipant?.user?.name || 'Unknown User'
    },

    getUnreadMessagesCount: (conversationId) => {
      const conversation = chatStore.getConversationById?.(conversationId)
      return conversation?.unreadCount || 0
    },

    isConversationActive: (conversationId) => {
      return chatStore.activeConversationId === conversationId
    },
  }), [
    chatStore,
    isInitialized,
    currentConversationId,
    isConnected,
    enhancedActions
  ])

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

export default ChatProvider
