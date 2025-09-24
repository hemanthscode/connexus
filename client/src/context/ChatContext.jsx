import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useChatStore, useChatActions, useChatComputed } from '@/store/chatSlice.js'
import { useSocket } from '@/hooks/useSocket.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { SOCKET_EVENTS, DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Create context
const ChatContext = createContext(null)

// Custom hook to use chat context
export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

// Chat provider component
export const ChatProvider = ({ children }) => {
  const chatStore = useChatStore()
  const chatActions = useChatActions()
  const chatComputed = useChatComputed()
  
  const { 
    isConnected, 
    addEventListener, 
    removeEventListener,
    joinConversation,
    leaveConversation 
  } = useSocket()
  
  const { user } = useAuth()
  const toast = useToast()
  
  // Local state
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState(null)
  
  // Refs for cleanup
  const socketListenersRef = useRef(new Set())
  const currentConversationRef = useRef(null)

  // Initialize chat data
  useEffect(() => {
    const initialize = async () => {
      if (!user || isInitialized) return

      try {
        // Add current user to cache
        chatActions.addUserToCache({ ...user, userId: user._id })
        
        // Load conversations
        await chatActions.loadConversations()
        
        setIsInitialized(true)

        if (DEBUG.ENABLED) {
          console.log('Chat context initialized')
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        toast.error('Failed to load conversations')
      }
    }

    initialize()
  }, [user, isInitialized, chatActions, toast])

  // Handle socket events for real-time updates
  useEffect(() => {
    if (!isConnected || !isInitialized) return

    // New message handler
    const handleNewMessage = ({ message, conversationId }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Received new message:', message)
      }

      // Add message to store
      chatActions.addSocketMessage(message)
      
      // Show notification if not in active conversation
      if (conversationId !== chatStore.activeConversationId) {
        const conversation = chatComputed.getConversationById(conversationId)
        const conversationName = conversation?.name || 'Unknown'
        
        toast.info(`New message in ${conversationName}`, {
          duration: 3000,
          onClick: () => {
            chatActions.setActiveConversation(conversationId)
          }
        })
      }
    }

    // Message edited handler
    const handleMessageEdited = ({ messageId, newContent, editedAt }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Message edited:', messageId)
      }

      // Update message in store - FIXED: Use object syntax instead of Map methods
      Object.keys(chatStore.messagesByConversation).forEach(conversationId => {
        const messages = chatStore.messagesByConversation[conversationId]
        const messageIndex = messages.findIndex(m => m._id === messageId)
        if (messageIndex !== -1) {
          const updatedMessages = [...messages]
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: newContent,
            editedAt
          }
          // Use the store action to update instead of direct mutation
          chatActions.updateConversation(conversationId, {
            messages: updatedMessages
          })
        }
      })
    }

    // Message deleted handler
    const handleMessageDeleted = ({ messageId, deletedAt }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Message deleted:', messageId)
      }

      // Update message in store - FIXED: Use object syntax instead of Map methods
      Object.keys(chatStore.messagesByConversation).forEach(conversationId => {
        const messages = chatStore.messagesByConversation[conversationId]
        const messageIndex = messages.findIndex(m => m._id === messageId)
        if (messageIndex !== -1) {
          const updatedMessages = [...messages]
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            isDeleted: true,
            deletedAt,
            content: 'This message was deleted'
          }
          // Use the store action to update instead of direct mutation
          chatActions.updateConversation(conversationId, {
            messages: updatedMessages
          })
        }
      })
    }

    // Reaction updated handler
    const handleReactionUpdated = ({ messageId, reactions }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Reaction updated:', messageId)
      }

      // Update reactions in store - FIXED: Use object syntax instead of Map methods
      Object.keys(chatStore.messagesByConversation).forEach(conversationId => {
        const messages = chatStore.messagesByConversation[conversationId]
        const messageIndex = messages.findIndex(m => m._id === messageId)
        if (messageIndex !== -1) {
          const updatedMessages = [...messages]
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            reactions
          }
          // Use the store action to update instead of direct mutation
          chatActions.updateConversation(conversationId, {
            messages: updatedMessages
          })
        }
      })
    }

    // Message read handler
    const handleMessageRead = ({ conversationId, userId }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('Messages read in conversation:', conversationId)
      }

      // Update read status in store - FIXED: Use object syntax instead of Map methods
      const messages = chatStore.messagesByConversation[conversationId]
      if (messages) {
        const updatedMessages = messages.map(message => {
          if (!message.readBy) message.readBy = []
          
          const existingRead = message.readBy.find(r => r.user === userId)
          if (!existingRead) {
            message.readBy.push({
              user: userId,
              readAt: new Date().toISOString()
            })
          }
          
          return message
        })
        
        // Use the store action to update instead of direct mutation
        chatActions.updateConversation(conversationId, {
          messages: updatedMessages
        })
      }
    }

    // User joined group handler
    const handleUserJoinedGroup = ({ userId, user: userData, groupId }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('User joined group:', userId, groupId)
      }

      // Update conversation participants
      const conversation = chatComputed.getConversationById(groupId)
      if (conversation && conversation.type === 'group') {
        const updatedParticipants = [...(conversation.participants || [])]
        const exists = updatedParticipants.find(p => p.user._id === userId)
        
        if (!exists) {
          updatedParticipants.push({
            user: userData,
            joinedAt: new Date().toISOString(),
            role: 'member'
          })
          
          chatActions.updateConversation(groupId, {
            participants: updatedParticipants
          })
        }
      }
    }

    // User left group handler
    const handleUserLeftGroup = ({ userId, groupId }) => {
      if (DEBUG.SOCKET_LOGS) {
        console.log('User left group:', userId, groupId)
      }

      // Update conversation participants
      const conversation = chatComputed.getConversationById(groupId)
      if (conversation && conversation.type === 'group') {
        const updatedParticipants = (conversation.participants || [])
          .filter(p => p.user._id !== userId)
        
        chatActions.updateConversation(groupId, {
          participants: updatedParticipants
        })
      }
    }

    // Register event listeners
    const listeners = [
      { event: SOCKET_EVENTS.NEW_MESSAGE, handler: handleNewMessage },
      { event: SOCKET_EVENTS.MESSAGE_EDITED, handler: handleMessageEdited },
      { event: SOCKET_EVENTS.MESSAGE_DELETED, handler: handleMessageDeleted },
      { event: SOCKET_EVENTS.REACTION_UPDATED, handler: handleReactionUpdated },
      { event: SOCKET_EVENTS.MESSAGE_READ, handler: handleMessageRead },
      { event: SOCKET_EVENTS.USER_JOINED_GROUP, handler: handleUserJoinedGroup },
      { event: SOCKET_EVENTS.USER_LEFT_GROUP, handler: handleUserLeftGroup },
    ]

    listeners.forEach(({ event, handler }) => {
      addEventListener(event, handler)
      socketListenersRef.current.add({ event, handler })
    })

    return () => {
      // Cleanup event listeners
      socketListenersRef.current.forEach(({ event, handler }) => {
        removeEventListener(event, handler)
      })
      socketListenersRef.current.clear()
    }
  }, [isConnected, isInitialized, chatActions, chatComputed, chatStore, addEventListener, removeEventListener, toast])

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
        
        // Load messages if not already loaded - FIXED: Use object syntax instead of Map methods
        const messages = chatStore.messagesByConversation[activeConversationId]
        if (!messages || messages.length === 0) {
          chatActions.loadMessages(activeConversationId)
        }
        
        // Mark conversation as read
        setTimeout(() => {
          chatActions.markAsRead(activeConversationId)
        }, 1000)
      }
      
      setCurrentConversationId(activeConversationId)
      currentConversationRef.current = activeConversationId
    }
  }, [chatStore.activeConversationId, currentConversationId, isConnected, joinConversation, leaveConversation, chatActions, chatStore.messagesByConversation])

  // Periodic conversation refresh
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      // Refresh conversations every 5 minutes
      chatActions.loadConversations(false)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isInitialized, chatActions])

  // Enhanced chat operations
  const enhancedActions = {
    ...chatActions,
    
    /**
     * Send message with enhanced features
     */
    sendMessage: useCallback(async (messageData) => {
      const result = await chatActions.sendMessage(messageData)
      
      if (result.success) {
        // Clear reply state after sending
        chatActions.setReplyToMessage(null)
        
        // Auto-scroll to bottom (handled by UI components)
        // Mark conversation as read
        setTimeout(() => {
          chatActions.markAsRead(messageData.conversationId)
        }, 500)
      }
      
      return result
    }, [chatActions]),
    
    /**
     * Create conversation and set as active
     */
    createAndSetActive: useCallback(async (type, data) => {
      let result
      
      if (type === 'direct') {
        result = await chatActions.createDirectConversation(data.participantId)
      } else if (type === 'group') {
        result = await chatActions.createGroup(data)
      }
      
      if (result?.success) {
        chatActions.setActiveConversation(result.data._id)
      }
      
      return result
    }, [chatActions]),
    
    /**
     * Load more messages (pagination)
     */
    loadMoreMessages: useCallback(async (conversationId) => {
      // FIXED: Use object syntax instead of Map methods
      const pagination = chatStore.messagesPagination[conversationId]
      const nextPage = pagination ? pagination.page + 1 : 2
      
      return await chatActions.loadMessages(conversationId, nextPage)
    }, [chatActions, chatStore.messagesPagination]),
  }

  // Context value
  const contextValue = {
    // State
    ...chatStore,
    isInitialized,
    currentConversationId,
    
    // Actions
    ...enhancedActions,
    
    // Computed
    ...chatComputed,
    
    // Connection status
    isConnected,
    
    // Utilities
    formatConversationName: useCallback((conversation, currentUserId) => {
      if (conversation.type === 'group') {
        return conversation.name || 'Unnamed Group'
      }
      
      const otherParticipant = conversation.participants?.find(
        p => p.user._id !== currentUserId
      )
      
      return otherParticipant?.user?.name || 'Unknown User'
    }, []),
    
    getUnreadMessagesCount: useCallback((conversationId) => {
      const conversation = chatComputed.getConversationById(conversationId)
      return conversation?.unreadCount || 0
    }, [chatComputed]),
    
    isConversationActive: useCallback((conversationId) => {
      return chatStore.activeConversationId === conversationId
    }, [chatStore.activeConversationId]),
  }

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

// Export context for direct access if needed
export { ChatContext }

// Default export
export default ChatProvider
