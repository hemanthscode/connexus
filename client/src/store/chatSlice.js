import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import chatService from '@/services/chatService.js'
import { DEBUG, MESSAGE_STATUS } from '@/utils/constants.js'

// Initial state
const initialState = {
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  draftMessages: {},
  conversationsLoading: false,
  messagesLoading: false,
  error: null,
  hasMoreMessages: {},
  lastActivity: null,
  usersCache: {},
  selectedMessages: [],
  replyToMessage: null,
  editingMessage: null,
}

// Helpers
const createOptimisticMessage = (content, conversationId, sender, type = 'text') => ({
  _id: `optimistic_${Date.now()}`,
  content: content.trim(),
  sender,
  conversation: conversationId,
  type,
  status: MESSAGE_STATUS.SENDING,
  createdAt: new Date().toISOString(),
  reactions: [],
  readBy: [],
  isOptimistic: true
})

const useChatStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Core actions
        loadConversations: async (force = false) => {
          const { conversationsLoading, lastActivity } = get()
          
          if (conversationsLoading) return
          if (!force && lastActivity && Date.now() - lastActivity < 30000) return

          set({ conversationsLoading: true, error: null })

          try {
            const result = await chatService.getConversations()
            
            set({
              conversations: result.data || [],
              conversationsLoading: false,
              lastActivity: Date.now()
            })

            return { success: true, data: result.data }
          } catch (error) {
            set({
              error: error.message || 'Failed to load conversations',
              conversationsLoading: false
            })
            return { success: false, error: error.message }
          }
        },

        loadMessages: async (conversationId, page = 1, limit = 50) => {
          if (!conversationId) return

          set({ messagesLoading: true, error: null })

          try {
            const result = await chatService.getMessages(conversationId, page, limit)
            const messages = result.data || []

            const { messagesByConversation } = get()
            const existingMessages = messagesByConversation[conversationId] || []

            let updatedMessages
            if (page === 1) {
              updatedMessages = messages
            } else {
              const combined = [...messages, ...existingMessages]
              updatedMessages = combined.filter((msg, index, arr) => 
                arr.findIndex(m => m._id === msg._id) === index
              )
            }

            set({
              messagesByConversation: {
                ...messagesByConversation,
                [conversationId]: updatedMessages
              },
              hasMoreMessages: {
                ...get().hasMoreMessages,
                [conversationId]: messages.length === limit
              },
              messagesLoading: false,
              lastActivity: Date.now()
            })

            return { success: true, data: messages }
          } catch (error) {
            set({
              error: error.message || 'Failed to load messages',
              messagesLoading: false
            })
            return { success: false, error: error.message }
          }
        },

        sendMessage: async ({ conversationId, content, type = 'text', replyTo = null, attachments = [] }) => {
          if (!conversationId || !content.trim()) return

          const { messagesByConversation, conversations, usersCache } = get()
          const currentUser = usersCache.currentUser || {}

          // Create and add optimistic message
          const optimisticMessage = createOptimisticMessage(content, conversationId, currentUser, type)
          const existingMessages = messagesByConversation[conversationId] || []
          const updatedMessages = [...existingMessages, optimisticMessage]

          // Update conversations with last message
          const updatedConversations = conversations.map(conv => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: {
                  content: content.trim(),
                  timestamp: optimisticMessage.createdAt,
                  sender: currentUser
                }
              }
            }
            return conv
          })

          set({
            messagesByConversation: {
              ...messagesByConversation,
              [conversationId]: updatedMessages
            },
            conversations: updatedConversations,
            draftMessages: {
              ...get().draftMessages,
              [conversationId]: undefined
            }
          })

          try {
            const result = await chatService.sendMessage({
              conversationId, content, type, replyTo, attachments
            })

            // Replace optimistic with real message
            const currentMessages = get().messagesByConversation[conversationId] || []
            const messageIndex = currentMessages.findIndex(m => m._id === optimisticMessage._id)
            
            if (messageIndex !== -1) {
              const finalMessages = [...currentMessages]
              finalMessages[messageIndex] = {
                ...result.data,
                status: MESSAGE_STATUS.SENT
              }

              set({
                messagesByConversation: {
                  ...get().messagesByConversation,
                  [conversationId]: finalMessages
                }
              })
            }

            return { success: true, data: result.data }
          } catch (error) {
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

        // UI actions
        setActiveConversation: (conversationId) => {
          set({
            activeConversationId: conversationId,
            selectedMessages: [],
            replyToMessage: null,
            editingMessage: null
          })
        },

        saveDraftMessage: (conversationId, content) => {
          const { draftMessages } = get()
          const updatedDrafts = { ...draftMessages }
          
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

        getDraftMessage: (conversationId) => {
          const draft = get().draftMessages[conversationId]
          
          // Check if draft is expired (24 hours)
          if (draft && Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
            get().clearDraftMessage(conversationId)
            return ''
          }
          
          return draft?.content || ''
        },

        clearDraftMessage: (conversationId) => {
          const { draftMessages } = get()
          const updatedDrafts = { ...draftMessages }
          delete updatedDrafts[conversationId]
          set({ draftMessages: updatedDrafts })
        },

        setReplyToMessage: (message) => {
          set({ replyToMessage: message })
        },

        // Socket integration
        addUserToCache: (user) => {
          const { usersCache } = get()
          const userId = user._id || user.userId
          set({
            usersCache: {
              ...usersCache,
              [userId]: user,
              ...(user.userId ? { currentUser: user } : {})
            }
          })
        },

        addSocketMessage: (message) => {
          const { messagesByConversation, conversations, activeConversationId } = get()
          const conversationId = message.conversation

          const existingMessages = messagesByConversation[conversationId] || []
          
          // Check if message already exists
          if (existingMessages.find(m => m._id === message._id)) return

          // Add new message
          const updatedMessages = [...existingMessages, message]

          // Update conversation's last message and unread count
          const updatedConversations = conversations.map(conv => {
            if (conv._id === conversationId) {
              const updatedConv = {
                ...conv,
                lastMessage: {
                  content: message.content,
                  timestamp: message.createdAt,
                  sender: message.sender
                }
              }
              
              // Increment unread if not active conversation
              if (conversationId !== activeConversationId) {
                updatedConv.unreadCount = (conv.unreadCount || 0) + 1
              }
              
              return updatedConv
            }
            return conv
          })

          set({
            messagesByConversation: {
              ...messagesByConversation,
              [conversationId]: updatedMessages
            },
            conversations: updatedConversations
          })
        },

        markAsRead: async (conversationId) => {
          try {
            const { conversations } = get()
            
            const updatedConversations = conversations.map(conv => {
              if (conv._id === conversationId) {
                return { ...conv, unreadCount: 0 }
              }
              return conv
            })
            
            set({ conversations: updatedConversations })
          } catch (error) {
            console.error('Failed to mark as read:', error)
          }
        },

        // Conversation management
        createDirectConversation: async (participantId) => {
          try {
            const result = await chatService.createDirectConversation(participantId)
            
            if (result.success) {
              const { conversations } = get()
              const exists = conversations.find(c => c._id === result.data._id)
              if (!exists) {
                set({
                  conversations: [result.data, ...conversations]
                })
              }
            }
            
            return result
          } catch (error) {
            return { success: false, error: error.message }
          }
        },

        createGroup: async (groupData) => {
          try {
            const result = await chatService.createGroup(groupData)
            
            if (result.success) {
              const { conversations } = get()
              set({
                conversations: [result.data, ...conversations]
              })
            }
            
            return result
          } catch (error) {
            return { success: false, error: error.message }
          }
        },

        clearAll: () => {
          set(initialState)
        },

        // Selectors
        getActiveConversation: () => {
          const { conversations, activeConversationId } = get()
          return conversations.find(c => c._id === activeConversationId) || null
        },

        getMessagesForConversation: (conversationId) => {
          return get().messagesByConversation[conversationId] || []
        },

        getConversationById: (conversationId) => {
          return get().conversations.find(c => c._id === conversationId) || null
        },
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          draftMessages: state.draftMessages,
          lastActivity: state.lastActivity,
        }),
      }
    ),
    { name: 'chat-store', enabled: DEBUG.ENABLED }
  )
)

// Selectors
export const useChat = () => useChatStore()
export const useConversations = () => useChatStore(state => state.conversations)
export const useActiveConversationId = () => useChatStore(state => state.activeConversationId)

export default useChatStore
