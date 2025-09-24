import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import chatService from '@/services/chatService.js'
import { DEBUG, MESSAGE_STATUS } from '@/utils/constants.js'

// Initial state
const initialState = {
  // Conversations
  conversations: [],
  activeConversationId: null,
  conversationsLoading: false,
  conversationsError: null,
  conversationsLastFetch: null,
  
  // Messages - using objects instead of Maps for persistence
  messagesByConversation: {},
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: {},
  messagesPagination: {},
  
  // Draft messages
  draftMessages: {},
  
  // Search
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  
  // UI state
  selectedMessages: [],
  replyToMessage: null,
  editingMessage: null,
  
  // Cache
  usersCache: {},
  lastActivity: null,
}

// Create chat store
const useChatStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        actions: {
          /**
           * Load conversations
           */
          loadConversations: async (force = false) => {
            const state = get()
            
            // Don't reload if already loading or recently fetched
            if (state.conversationsLoading) return
            if (!force && state.conversationsLastFetch) {
              const timeSinceLastFetch = Date.now() - state.conversationsLastFetch
              if (timeSinceLastFetch < 30000) return // 30 seconds cache
            }

            set({
              conversationsLoading: true,
              conversationsError: null
            })

            try {
              const result = await chatService.getConversations()
              
              set({
                conversations: result.data || [],
                conversationsLoading: false,
                conversationsLastFetch: Date.now(),
                lastActivity: Date.now()
              })

              if (DEBUG.ENABLED) {
                console.log('Conversations loaded:', result.data?.length || 0)
              }

              return { success: true, data: result.data }
            } catch (error) {
              console.error('Failed to load conversations:', error)
              
              set({
                conversationsError: error.message || 'Failed to load conversations',
                conversationsLoading: false
              })

              return { success: false, error: error.message }
            }
          },

          /**
           * Load messages for conversation
           */
          loadMessages: async (conversationId, page = 1, limit = 50) => {
            if (!conversationId) return

            set({
              messagesLoading: true,
              messagesError: null
            })

            try {
              const result = await chatService.getMessages(conversationId, page, limit)
              const messages = result.data || []

              const currentState = get()
              const existingMessages = currentState.messagesByConversation[conversationId] || []
              
              let updatedMessages
              if (page === 1) {
                // Replace messages for first page
                updatedMessages = messages
              } else {
                // Append messages for pagination
                const combined = [...messages, ...existingMessages]
                // Remove duplicates based on message ID
                updatedMessages = combined.filter((msg, index, arr) => 
                  arr.findIndex(m => m._id === msg._id) === index
                )
              }

              set({
                messagesByConversation: {
                  ...currentState.messagesByConversation,
                  [conversationId]: updatedMessages
                },
                messagesPagination: {
                  ...currentState.messagesPagination,
                  [conversationId]: { page, hasMore: messages.length === limit }
                },
                hasMoreMessages: {
                  ...currentState.hasMoreMessages,
                  [conversationId]: messages.length === limit
                },
                messagesLoading: false,
                lastActivity: Date.now()
              })

              return { success: true, data: messages }
            } catch (error) {
              console.error('Failed to load messages:', error)
              
              set({
                messagesError: error.message || 'Failed to load messages',
                messagesLoading: false
              })

              return { success: false, error: error.message }
            }
          },

          /**
           * Send message
           */
          sendMessage: async (messageData) => {
            const { conversationId, content, type = 'text', replyTo = null, attachments = [] } = messageData
            
            if (!conversationId || !content.trim()) return

            const currentState = get()

            // Create optimistic message
            const optimisticMessage = {
              _id: `optimistic_${Date.now()}`,
              content: content.trim(),
              sender: currentState.usersCache.currentUser || {},
              conversation: conversationId,
              type,
              replyTo,
              attachments,
              status: MESSAGE_STATUS.SENDING,
              createdAt: new Date().toISOString(),
              reactions: [],
              readBy: [],
              isOptimistic: true
            }

            // Add optimistic message immediately
            const existingMessages = currentState.messagesByConversation[conversationId] || []
            const updatedMessages = [...existingMessages, optimisticMessage]

            // Update conversation's last message
            const updatedConversations = currentState.conversations.map(conversation => {
              if (conversation._id === conversationId) {
                return {
                  ...conversation,
                  lastMessage: {
                    content: content.trim(),
                    timestamp: optimisticMessage.createdAt,
                    sender: optimisticMessage.sender
                  }
                }
              }
              return conversation
            })

            set({
              messagesByConversation: {
                ...currentState.messagesByConversation,
                [conversationId]: updatedMessages
              },
              conversations: updatedConversations,
              draftMessages: {
                ...currentState.draftMessages,
                [conversationId]: undefined
              }
            })

            try {
              const result = await chatService.sendMessage(messageData)
              const realMessage = result.data

              // Replace optimistic message with real message
              const currentMessages = get().messagesByConversation[conversationId] || []
              const messageIndex = currentMessages.findIndex(m => m._id === optimisticMessage._id)
              
              if (messageIndex !== -1) {
                const finalMessages = [...currentMessages]
                finalMessages[messageIndex] = {
                  ...realMessage,
                  status: MESSAGE_STATUS.SENT
                }

                set({
                  messagesByConversation: {
                    ...get().messagesByConversation,
                    [conversationId]: finalMessages
                  }
                })
              }

              return { success: true, data: realMessage }
            } catch (error) {
              console.error('Failed to send message:', error)
              
              // Update optimistic message to show error
              const currentMessages = get().messagesByConversation[conversationId] || []
              const messageIndex = currentMessages.findIndex(m => m._id === optimisticMessage._id)
              
              if (messageIndex !== -1) {
                const finalMessages = [...currentMessages]
                finalMessages[messageIndex] = {
                  ...finalMessages[messageIndex],
                  status: MESSAGE_STATUS.FAILED,
                  error: error.message
                }

                set({
                  messagesByConversation: {
                    ...get().messagesByConversation,
                    [conversationId]: finalMessages
                  }
                })
              }

              return { success: false, error: error.message }
            }
          },

          /**
           * Set active conversation
           */
          setActiveConversation: (conversationId) => {
            set({
              activeConversationId: conversationId,
              selectedMessages: [],
              replyToMessage: null,
              editingMessage: null
            })
          },

          /**
           * Save draft message
           */
          saveDraftMessage: (conversationId, content) => {
            const currentState = get()
            const updatedDrafts = { ...currentState.draftMessages }
            
            if (content.trim()) {
              updatedDrafts[conversationId] = {
                content: content.trim(),
                timestamp: Date.now()
              }
            } else {
              delete updatedDrafts[conversationId]
            }

            set({ draftMessages: updatedDrafts })
          },

          /**
           * Get draft message
           */
          getDraftMessage: (conversationId) => {
            const state = get()
            const draft = state.draftMessages[conversationId]
            
            // Check if draft is not too old (24 hours)
            if (draft && Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
              get().actions.clearDraftMessage(conversationId)
              return null
            }
            
            return draft?.content || ''
          },

          /**
           * Clear draft message
           */
          clearDraftMessage: (conversationId) => {
            const currentState = get()
            const updatedDrafts = { ...currentState.draftMessages }
            delete updatedDrafts[conversationId]
            set({ draftMessages: updatedDrafts })
          },

          /**
           * Set reply to message
           */
          setReplyToMessage: (message) => {
            set({ replyToMessage: message })
          },

          /**
           * Add user to cache - MISSING FUNCTION ADDED
           */
          addUserToCache: (user) => {
            const currentState = get()
            const userId = user._id || user.userId
            set({
              usersCache: {
                ...currentState.usersCache,
                [userId]: user,
                // Also store as currentUser if it's the main user
                ...(user.userId ? { currentUser: user } : {})
              }
            })
          },

          /**
           * Update conversation - MISSING FUNCTION ADDED
           */
          updateConversation: (conversationId, updates) => {
            const currentState = get()
            const updatedConversations = currentState.conversations.map(conversation => {
              if (conversation._id === conversationId) {
                return { ...conversation, ...updates }
              }
              return conversation
            })
            
            set({ conversations: updatedConversations })
          },

          /**
           * Add new message from socket - MISSING FUNCTION ADDED
           */
          addSocketMessage: (message) => {
            const currentState = get()
            const conversationId = message.conversation

            const existingMessages = currentState.messagesByConversation[conversationId] || []
            
            // Check if message already exists
            const messageExists = existingMessages.find(m => m._id === message._id)
            if (messageExists) return

            // Add new message
            const updatedMessages = [...existingMessages, message]

            // Update conversation's last message
            const updatedConversations = currentState.conversations.map(conversation => {
              if (conversation._id === conversationId) {
                const updatedConversation = {
                  ...conversation,
                  lastMessage: {
                    content: message.content,
                    timestamp: message.createdAt,
                    sender: message.sender
                  }
                }
                
                // Increment unread count if not active conversation
                if (conversationId !== currentState.activeConversationId) {
                  updatedConversation.unreadCount = (conversation.unreadCount || 0) + 1
                }
                
                return updatedConversation
              }
              return conversation
            })

            set({
              messagesByConversation: {
                ...currentState.messagesByConversation,
                [conversationId]: updatedMessages
              },
              conversations: updatedConversations
            })
          },

          /**
           * Mark conversation as read - MISSING FUNCTION ADDED
           */
          markAsRead: async (conversationId) => {
            try {
              // Call API to mark as read (placeholder)
              // await chatService.markAsRead(conversationId)
              
              const currentState = get()
              
              // Update conversation unread count
              const updatedConversations = currentState.conversations.map(conversation => {
                if (conversation._id === conversationId) {
                  return { ...conversation, unreadCount: 0 }
                }
                return conversation
              })
              
              set({ conversations: updatedConversations })
              
            } catch (error) {
              console.error('Failed to mark as read:', error)
            }
          },

          /**
           * Create direct conversation - MISSING FUNCTION ADDED
           */
          createDirectConversation: async (participantId) => {
            try {
              const result = await chatService.createDirectConversation(participantId)
              
              if (result.success) {
                const currentState = get()
                // Add to conversations if not exists
                const conversationExists = currentState.conversations.find(c => c._id === result.data._id)
                if (!conversationExists) {
                  set({
                    conversations: [result.data, ...currentState.conversations]
                  })
                }
              }
              
              return result
            } catch (error) {
              console.error('Failed to create direct conversation:', error)
              return { success: false, error: error.message }
            }
          },

          /**
           * Create group - MISSING FUNCTION ADDED
           */
          createGroup: async (groupData) => {
            try {
              const result = await chatService.createGroup(groupData)
              
              if (result.success) {
                const currentState = get()
                set({
                  conversations: [result.data, ...currentState.conversations]
                })
              }
              
              return result
            } catch (error) {
              console.error('Failed to create group:', error)
              return { success: false, error: error.message }
            }
          },

          /**
           * Clear all data
           */
          clearAll: () => {
            set(initialState)
          },
        },

        // Computed values (selectors)
        computed: {
          /**
           * Get active conversation
           */
          getActiveConversation: () => {
            const state = get()
            return state.conversations.find(c => c._id === state.activeConversationId) || null
          },

          /**
           * Get messages for conversation
           */
          getMessagesForConversation: (conversationId) => {
            const state = get()
            return state.messagesByConversation[conversationId] || []
          },

          /**
           * Get conversation by ID
           */
          getConversationById: (conversationId) => {
            const state = get()
            return state.conversations.find(c => c._id === conversationId) || null
          },
        },
      }),
      {
        name: 'chat-store',
        // Disable encryption for now
        storage: {
          getItem: (name) => {
            try {
              const item = localStorage.getItem(name)
              return item
            } catch (error) {
              console.warn('Failed to get chat store data:', error)
              return null
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, value)
            } catch (error) {
              console.warn('Failed to set chat store data:', error)
            }
          },
          removeItem: (name) => {
            localStorage.removeItem(name)
          },
        },
        // Only persist certain fields
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          draftMessages: state.draftMessages,
          searchQuery: state.searchQuery,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    {
      name: 'chat-store',
      enabled: DEBUG.ENABLED,
    }
  )
)

// Export selectors
export const useChat = () => useChatStore()
export const useChatActions = () => useChatStore(state => state.actions)
export const useChatComputed = () => useChatStore(state => state.computed)

// Export individual selectors
export const useConversations = () => useChatStore(state => state.conversations)
export const useActiveConversationId = () => useChatStore(state => state.activeConversationId)
// export const useMessages = (conversationId) => useChatStore(state => 
//   state.messagesByConversation[conversationId] || []
// )

// Named export
export { useChatStore }

export default useChatStore
