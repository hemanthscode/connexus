import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import socketService from '../services/socket';
import { chatService } from '../services/chat';
import toast from 'react-hot-toast';

const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // Data State
    conversations: [],
    messages: new Map(),
    activeConversationId: null,
    isLoading: false,
    error: null,
    currentUser: null,

    // FIXED: Add unread counts tracking
    unreadCounts: new Map(),
    temporaryConversation: null,

    // UI State
    messageEditingId: null,
    replyToMessage: null,
    searchQuery: '',
    searchResults: [],

    // Optimistic Updates
    pendingMessages: new Map(),

    // Event setup flag
    _eventsSetup: false,

    // Force re-render counter to trigger updates
    _updateCounter: 0,

    // Helper to force re-render
    _forceUpdate: () => {
      set(state => ({ _updateCounter: state._updateCounter + 1 }));
    },

    // Actions
    setCurrentUser: (user) => {
      console.log('👤 Setting current user:', user?.name);
      set({ currentUser: user });
    },

    setActiveConversation: (conversationId) => {
      const state = get();
      const prevId = state.activeConversationId;
      
      if (prevId === conversationId) {
        return;
      }
      
      if (prevId && prevId !== conversationId) {
        socketService.leaveConversation(prevId);
      }
      
      set({ 
        activeConversationId: conversationId,
        temporaryConversation: null
      });
      
      if (conversationId) {
        const unreadCounts = new Map(state.unreadCounts);
        unreadCounts.set(conversationId, 0);
        set({ unreadCounts });
        
        const conversation = state.conversations.find(c => c._id === conversationId);
        
        if (conversation) {
          setTimeout(() => {
            socketService.joinConversation(conversationId);
            socketService.requestConversationInfo(conversationId);
            get().markConversationAsRead(conversationId);
          }, 100);
        }
      }
    },

    setTemporaryConversation: (targetUser) => {
      const state = get();
      
      if (state.activeConversationId) {
        socketService.leaveConversation(state.activeConversationId);
      }

      const tempConversation = {
        _id: `temp_${targetUser._id}`,
        type: 'direct',
        participants: [
          { user: state.currentUser, role: 'member' },
          { user: targetUser, role: 'member' }
        ],
        lastMessage: null,
        isTemporary: true
      };

      // FIXED: Create new Map instance for messages
      const newMessages = new Map(state.messages);
      newMessages.set(`temp_${targetUser._id}`, []);

      set({
        activeConversationId: null,
        temporaryConversation: tempConversation,
        messages: newMessages
      });

      console.log('📝 Created temporary conversation with:', targetUser.name);
    },

    loadConversations: async () => {
      const state = get();
      if (state.isLoading || state.conversations.length > 0) {
        return;
      }

      set({ isLoading: true });
      try {
        const response = await chatService.getConversations();
        const conversations = response.data.data || [];
        
        const unreadCounts = new Map();
        conversations.forEach(conv => {
          unreadCounts.set(conv._id, conv.unreadCount || 0);
        });
        
        set({ 
          conversations: [...conversations], // FIXED: Ensure new array reference
          unreadCounts,
          isLoading: false 
        });
        
      } catch (error) {
        console.error('Load conversations failed:', error);
        set({ 
          error: error.response?.data?.message || 'Failed to load conversations',
          isLoading: false 
        });
      }
    },

    loadMessages: async (conversationId, page = 1) => {
      if (!conversationId || conversationId.startsWith('temp_')) return;

      const state = get();
      const existingMessages = state.messages.get(conversationId);
      
      if (page === 1 && existingMessages && existingMessages.length > 0) {
        return;
      }

      set({ isLoading: page === 1 });
      try {
        const response = await chatService.getMessages(conversationId, { page, limit: 50 });
        const newMessages = response.data.data || [];
        
        const sortedNewMessages = newMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        let updatedMessages;
        if (page === 1) {
          updatedMessages = [...sortedNewMessages]; // FIXED: New array
        } else {
          const existingMessages = state.messages.get(conversationId) || [];
          updatedMessages = [...sortedNewMessages, ...existingMessages]; // FIXED: New array
        }
        
        // FIXED: Create new Map instance
        const messagesMap = new Map(state.messages);
        messagesMap.set(conversationId, updatedMessages);
        
        set({ 
          messages: messagesMap,
          isLoading: false 
        });
        
        if (sortedNewMessages.length > 0 && state.activeConversationId === conversationId) {
          setTimeout(() => {
            get().markConversationAsRead(conversationId);
          }, 500);
        }
        
      } catch (error) {
        console.error('Load messages failed:', error);
        set({ isLoading: false });
      }
    },

    markConversationAsRead: async (conversationId) => {
      if (!conversationId || conversationId.startsWith('temp_')) return;

      const state = get();
      const messages = state.messages.get(conversationId) || [];
      const currentUser = state.currentUser;
      
      if (!currentUser) return;

      console.log(`📖 Marking conversation ${conversationId} as read...`);
      
      // FIXED: Create new Map instance
      const unreadCounts = new Map(state.unreadCounts);
      unreadCounts.set(conversationId, 0);
      set({ unreadCounts });
      
      const unreadMessages = messages.filter(message => {
        if (message.sender?._id === currentUser._id) return false;
        const readBy = message.readBy || [];
        return !readBy.some(r => r.user === currentUser._id);
      });

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(m => m._id);
        
        try {
          socketService.markMessagesRead(messageIds, conversationId);
          await chatService.markConversationAsRead(conversationId);
          console.log(`✅ Successfully marked ${unreadMessages.length} messages as read`);
        } catch (error) {
          console.error('❌ Failed to mark conversation as read:', error);
        }
      }
    },

    sendMessage: async (conversationId, content, type = 'text', replyTo = null) => {
      if (!content.trim()) return;

      const state = get();
      if (!state.currentUser) {
        console.error('No current user found');
        return;
      }

      let actualConversationId = conversationId;

      // Handle temporary conversations
      if (conversationId && conversationId.startsWith('temp_')) {
        console.log('📝 Creating real conversation from temporary one...');
        
        const tempConversation = state.temporaryConversation;
        if (!tempConversation) {
          console.error('No temporary conversation found');
          return;
        }

        const targetUser = tempConversation.participants.find(
          p => p.user._id !== state.currentUser._id
        )?.user;

        if (!targetUser) {
          console.error('No target user found in temporary conversation');
          return;
        }

        try {
          const response = await chatService.createDirectConversation({ participantId: targetUser._id });
          const realConversation = response.data.data;
          actualConversationId = realConversation._id;

          // FIXED: Create new arrays/maps
          const updatedConversations = [realConversation, ...state.conversations];
          const unreadCounts = new Map(state.unreadCounts);
          unreadCounts.set(realConversation._id, 0);

          set({
            conversations: updatedConversations,
            unreadCounts,
            activeConversationId: actualConversationId,
            temporaryConversation: null
          });

          setTimeout(() => {
            socketService.joinConversation(actualConversationId);
          }, 100);

          console.log('✅ Created real conversation:', actualConversationId);
          
        } catch (error) {
          console.error('Failed to create real conversation:', error);
          toast.error('Failed to start conversation');
          return;
        }
      }

      if (!actualConversationId || actualConversationId.startsWith('temp_')) {
        console.error('Invalid conversation ID for sending message');
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const tempMessage = {
        _id: tempId,
        content: content.trim(),
        type,
        replyTo,
        sender: state.currentUser,
        conversation: actualConversationId,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isOptimistic: true,
      };

      // FIXED: Create new arrays/maps
      const conversationMessages = state.messages.get(actualConversationId) || [];
      const messagesMap = new Map(state.messages);
      messagesMap.set(actualConversationId, [...conversationMessages, tempMessage]);
      
      const pendingMap = new Map(state.pendingMessages);
      pendingMap.set(tempId, tempMessage);
      
      set({ 
        messages: messagesMap,
        pendingMessages: pendingMap,
        replyToMessage: null 
      });

      socketService.sendMessage({
        conversationId: actualConversationId,
        content: content.trim(),
        type,
        replyTo,
        tempId,
      });
    },

    setupSocketEvents: () => {
      const state = get();
      
      if (state._eventsSetup) {
        return;
      }

      console.log('🔌 Setting up chat socket events...');
      set({ _eventsSetup: true });

      // FIXED: Handle new messages with proper state updates
      socketService.on('new_message', (data) => {
        try {
          const { message, conversationId } = data;
          const state = get();
          
          const conversationMessages = state.messages.get(conversationId) || [];
          
          const isDuplicate = conversationMessages.some(m => m._id === message._id);
          if (isDuplicate) {
            console.log('🚫 Duplicate message detected, ignoring');
            return;
          }
          
          // FIXED: Create new array
          const updatedMessages = [...conversationMessages, message].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          // FIXED: Create new Map
          const messagesMap = new Map(state.messages);
          messagesMap.set(conversationId, updatedMessages);
          
          // FIXED: Create new Map for unread counts
          const unreadCounts = new Map(state.unreadCounts);
          const isActiveConversation = state.activeConversationId === conversationId;
          const isOwnMessage = message.sender?._id === state.currentUser?._id;
          
          if (!isOwnMessage) {
            if (isActiveConversation) {
              unreadCounts.set(conversationId, 0);
              setTimeout(() => {
                socketService.markMessagesRead([message._id], conversationId);
              }, 1000);
            } else {
              const currentCount = unreadCounts.get(conversationId) || 0;
              unreadCounts.set(conversationId, currentCount + 1);
            }
          }
          
          set({ 
            messages: messagesMap,
            unreadCounts 
          });
          
          get().updateConversationLastMessage(conversationId, message);
          
        } catch (error) {
          console.error('Error handling new_message event:', error);
        }
      });

      socketService.on('message_sent', (data) => {
        try {
          const { message, tempId, conversationId } = data;
          const state = get();
          
          const conversationMessages = state.messages.get(conversationId) || [];
          // FIXED: Create new array
          const updatedMessages = conversationMessages.map(m => 
            m._id === tempId ? message : m
          );
          
          // FIXED: Create new Map
          const messagesMap = new Map(state.messages);
          messagesMap.set(conversationId, updatedMessages);
          
          const pendingMap = new Map(state.pendingMessages);
          pendingMap.delete(tempId);
          
          set({ 
            messages: messagesMap,
            pendingMessages: pendingMap
          });
          
          get().updateConversationLastMessage(conversationId, message);
          
        } catch (error) {
          console.error('Error handling message_sent event:', error);
        }
      });

      // FIXED: Handle message read events
      socketService.on('message_read', (data) => {
        try {
          const { conversationId, userId } = data;
          const state = get();
          
          console.log(`📖 Received message_read event for conversation ${conversationId} by user ${userId}`);
          
          const conversationMessages = state.messages.get(conversationId) || [];
          // FIXED: Create new array with updated readBy
          const updated = conversationMessages.map(msg => {
            const readBy = msg.readBy || [];
            if (!readBy.find(r => r.user === userId)) {
              return { ...msg, readBy: [...readBy, { user: userId, readAt: new Date() }] };
            }
            return msg;
          });
          
          // FIXED: Create new Map
          const messagesMap = new Map(state.messages);
          messagesMap.set(conversationId, updated);
          
          // FIXED: Create new Map for unread counts
          const unreadCounts = new Map(state.unreadCounts);
          if (userId === state.currentUser?._id) {
            console.log(`✅ Resetting unread count for conversation ${conversationId} to 0`);
            unreadCounts.set(conversationId, 0);
          }
          
          set({ 
            messages: messagesMap,
            unreadCounts 
          });
          
        } catch (error) {
          console.error('Error handling message_read event:', error);
        }
      });

      // ENHANCED: Better reaction updates from server with user details
      socketService.on('reaction_updated', (data) => {
        try {
          const { messageId, reactions } = data;
          const state = get();
          
          console.log('🎭 Received reaction update from server:', messageId, reactions?.length || 0, 'reactions');
          
          // ENHANCED: Process reactions with proper user details
          const processedReactions = (reactions || []).map(reaction => {
            // Handle different reaction data structures from server
            if (reaction.userDetails) {
              // Already has user details
              return reaction;
            } else if (reaction.user && typeof reaction.user === 'object') {
              // User is populated object
              return {
                ...reaction,
                userDetails: {
                  _id: reaction.user._id,
                  name: reaction.user.name,
                  email: reaction.user.email,
                  avatar: reaction.user.avatar
                }
              };
            } else {
              // User is just an ID - this shouldn't happen with our backend fixes, but handle it
              return {
                ...reaction,
                userDetails: {
                  _id: reaction.user,
                  name: 'Unknown User',
                  email: '',
                  avatar: null
                }
              };
            }
          });
          
          const updatedMessages = new Map();
          state.messages.forEach((messages, conversationId) => {
            const updated = messages.map(msg => 
              msg._id === messageId 
                ? { ...msg, reactions: processedReactions }
                : msg
            );
            updatedMessages.set(conversationId, updated);
          });
          
          set({ messages: updatedMessages });
          console.log('✅ Reaction state updated from server with user details');
          
        } catch (error) {
          console.error('Error handling reaction_updated event:', error);
        }
      });

      // FIXED: Handle message edited
      socketService.on('message_edited', (data) => {
        try {
          const { messageId, newContent, editedAt } = data;
          const state = get();
          
          // FIXED: Create new Map
          const updatedMessages = new Map();
          state.messages.forEach((messages, conversationId) => {
            const updated = messages.map(msg => 
              msg._id === messageId 
                ? { ...msg, content: newContent, editedAt, isEdited: true }
                : msg
            );
            updatedMessages.set(conversationId, updated);
          });
          
          set({ 
            messages: updatedMessages,
            messageEditingId: null 
          });
        } catch (error) {
          console.error('Error handling message_edited event:', error);
        }
      });

      socketService.on('message_deleted', (data) => {
        try {
          const { messageId } = data;
          const state = get();
          
          // FIXED: Create new Map
          const updatedMessages = new Map();
          state.messages.forEach((messages, conversationId) => {
            const updated = messages.map(msg => 
              msg._id === messageId 
                ? { ...msg, isDeleted: true, content: 'This message was deleted' }
                : msg
            );
            updatedMessages.set(conversationId, updated);
          });
          
          set({ messages: updatedMessages });
        } catch (error) {
          console.error('Error handling message_deleted event:', error);
        }
      });

      socketService.on('conversation_info', (data) => {
        try {
          const { conversation } = data;
          const state = get();
          
          // FIXED: Create new array
          const updated = state.conversations.map(conv =>
            conv._id === conversation._id ? { ...conv, ...conversation } : conv
          );
          
          set({ conversations: updated });
        } catch (error) {
          console.error('Error handling conversation_info event:', error);
        }
      });

      console.log('🔌 Chat socket events setup complete');
    },

    updateConversationLastMessage: (conversationId, message) => {
      const state = get();
      // FIXED: Create new array
      const updated = state.conversations.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              sender: message.sender,
              timestamp: message.createdAt,
            },
          };
        }
        return conv;
      });
      
      set({ conversations: updated });
    },

    editMessage: async (messageId, newContent) => {
      if (!newContent.trim()) return;

      try {
        socketService.editMessage(messageId, newContent.trim());
        await chatService.editMessage({ messageId, newContent: newContent.trim() });
      } catch (error) {
        console.error('Edit message failed:', error);
        toast.error('Failed to edit message');
      }
    },

    deleteMessage: async (messageId) => {
      try {
        socketService.deleteMessage(messageId);
        await chatService.deleteMessage(messageId);
      } catch (error) {
        console.error('Delete message failed:', error);
        toast.error('Failed to delete message');
      }
    },

    // ENHANCED: toggleReaction with better optimistic updates and user details
    toggleReaction: async (messageId, emoji) => {
      try {
        const state = get();
        const currentUser = state.currentUser;
        
        if (!currentUser) {
          console.error('No current user found');
          return;
        }

        console.log('🎭 Toggling reaction:', emoji, 'for message:', messageId);

        // OPTIMISTIC UPDATE: Immediately update UI
        let hasReacted = false;
        const updatedMessages = new Map();
        
        state.messages.forEach((messages, conversationId) => {
          const updated = messages.map(message => {
            if (message._id === messageId) {
              const reactions = message.reactions || [];
              const existingReactionIndex = reactions.findIndex(r => {
                // Handle both populated and non-populated user data
                const userId = r.user?._id || r.user;
                return userId === currentUser._id && r.emoji === emoji;
              });
              
              hasReacted = existingReactionIndex !== -1;
              
              let newReactions;
              if (hasReacted) {
                // Remove reaction
                newReactions = reactions.filter((_, index) => index !== existingReactionIndex);
                console.log('➖ Removing reaction optimistically');
              } else {
                // Add reaction with complete user details
                const newReaction = {
                  emoji,
                  user: currentUser._id,
                  userDetails: {
                    _id: currentUser._id,
                    name: currentUser.name,
                    email: currentUser.email,
                    avatar: currentUser.avatar
                  },
                  reactedAt: new Date().toISOString()
                };
                newReactions = [...reactions, newReaction];
                console.log('➕ Adding reaction optimistically with user details');
              }
              
              return { ...message, reactions: newReactions };
            }
            return message;
          });
          updatedMessages.set(conversationId, updated);
        });
        
        // Update state with optimistic changes
        set({ messages: updatedMessages });
        
        // Send to server
        if (hasReacted) {
          socketService.removeReaction(messageId, emoji);
        } else {
          socketService.addReaction(messageId, emoji);
        }
        
        console.log('✅ Reaction toggle completed with user details');
        
      } catch (error) {
        console.error('Toggle reaction failed:', error);
        toast.error('Failed to update reaction');
      }
    },

    searchUsers: async (query) => {
      if (!query || query.length < 2) {
        set({ searchResults: [] });
        return;
      }

      try {
        const response = await chatService.searchUsers({ q: query });
        set({ 
          searchResults: [...(response.data.data || [])], // FIXED: New array
          searchQuery: query 
        });
      } catch (error) {
        console.error('Search users failed:', error);
        set({ searchResults: [] });
      }
    },

    getUnreadCount: (conversationId) => {
      const state = get();
      return state.unreadCounts.get(conversationId) || 0;
    },

    getCurrentConversation: () => {
      const state = get();
      if (state.temporaryConversation) {
        return state.temporaryConversation;
      }
      if (state.activeConversationId) {
        return state.conversations.find(c => c._id === state.activeConversationId);
      }
      return null;
    },

    getCurrentConversationId: () => {
      const state = get();
      if (state.temporaryConversation) {
        return state.temporaryConversation._id;
      }
      return state.activeConversationId;
    },

    setMessageEditing: (messageId) => {
      set({ messageEditingId: messageId });
    },

    setReplyToMessage: (message) => {
      set({ replyToMessage: message });
    },

    clearReplyToMessage: () => {
      set({ replyToMessage: null });
    },

    cleanup: () => {
      console.log('🧹 Cleaning up chat store...');
      
      if (socketService && socketService.eventHandlers) {
        const chatEvents = [
          'new_message',
          'message_sent',
          'message_edited', 
          'message_deleted',
          'message_read',
          'reaction_updated',
          'conversation_info'
        ];
        
        chatEvents.forEach(event => {
          if (socketService.eventHandlers.has(event)) {
            socketService.eventHandlers.delete(event);
          }
        });
      }
      
      set({
        conversations: [],
        messages: new Map(),
        activeConversationId: null,
        pendingMessages: new Map(),
        unreadCounts: new Map(),
        temporaryConversation: null,
        searchResults: [],
        messageEditingId: null,
        replyToMessage: null,
        currentUser: null,
        _eventsSetup: false,
        isLoading: false,
        error: null,
        _updateCounter: 0,
      });
    },
  }))
);

export default useChatStore;
