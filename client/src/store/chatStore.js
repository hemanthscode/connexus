/**
 * Chat State Management - OPTIMIZED GROUP FUNCTIONALITY
 * Fixed all group operations with proper state coordination
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import socketService from '../services/socket';
import { chatService } from '../services/chat';
import { SOCKET_EVENTS } from '../utils/constants';
import { formatError } from '../utils/formatters';
import toast from 'react-hot-toast';

const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // Core State
    conversations: [],
    messages: new Map(),
    activeConversationId: null,
    currentUser: null,
    isLoading: false,
    error: null,

    // UI State
    unreadCounts: new Map(),
    temporaryConversation: null,
    messageEditingId: null,
    replyToMessage: null,
    searchResults: [],
    pendingMessages: new Map(),

    // Internal State
    _eventsSetup: false,
    _messageLoadingErrors: new Set(),

    // ============== Helpers ==============
    _createNewMap: (originalMap, key, value) => {
      const newMap = new Map(originalMap);
      newMap.set(key, value);
      return newMap;
    },

    _updateMessages: (conversationId, updater) => {
      const { messages } = get();
      const currentMessages = messages.get(conversationId) || [];
      const updatedMessages = updater(currentMessages);
      
      set({ 
        messages: get()._createNewMap(messages, conversationId, updatedMessages)
      });
    },

    _updateUnreadCount: (conversationId, count) => {
      const { unreadCounts } = get();
      set({ 
        unreadCounts: get()._createNewMap(unreadCounts, conversationId, count)
      });
    },

    // ENHANCED: Remove conversation completely from state
    _removeConversation: (conversationId) => {
      set(state => {
        const conversations = state.conversations.filter(c => c._id !== conversationId);
        
        // Clean up messages
        const messages = new Map(state.messages);
        messages.delete(conversationId);
        
        // Clean up unread counts
        const unreadCounts = new Map(state.unreadCounts);
        unreadCounts.delete(conversationId);
        
        // Clean up active conversation if it's the deleted one
        const activeConversationId = state.activeConversationId === conversationId 
          ? null 
          : state.activeConversationId;
        
        return {
          conversations,
          messages,
          unreadCounts,
          activeConversationId
        };
      });
    },

    // ============== Actions ==============
    setCurrentUser: (user) => {
      set({ currentUser: user });
    },

    setActiveConversation: (conversationId) => {
      const { activeConversationId } = get();
      
      if (activeConversationId === conversationId) return;
      
      if (activeConversationId) {
        socketService.leaveConversation(activeConversationId);
      }
      
      set({ 
        activeConversationId: conversationId,
        temporaryConversation: null
      });
      
      if (conversationId) {
        get()._updateUnreadCount(conversationId, 0);
        
        setTimeout(() => {
          socketService.joinConversation(conversationId);
          get().markConversationAsRead(conversationId);
        }, 100);
      }
    },

    setTemporaryConversation: (targetUser) => {
      const { activeConversationId, currentUser } = get();
      
      if (activeConversationId) {
        socketService.leaveConversation(activeConversationId);
      }

      const tempConversation = {
        _id: `temp_${targetUser._id}`,
        type: 'direct',
        participants: [
          { user: currentUser, role: 'member' },
          { user: targetUser, role: 'member' }
        ],
        isTemporary: true
      };

      get()._updateMessages(`temp_${targetUser._id}`, () => []);

      set({
        activeConversationId: null,
        temporaryConversation: tempConversation,
      });
    },

    // ============== Data Loading ==============
    loadConversations: async () => {
      const { isLoading, conversations } = get();
      if (isLoading || conversations.length > 0) return;

      set({ isLoading: true });
      
      try {
        const response = await chatService.getConversations();
        const conversations = response.data.data || [];
        
        const unreadCounts = new Map();
        conversations.forEach(conv => {
          unreadCounts.set(conv._id, conv.unreadCount || 0);
        });
        
        set({ conversations: [...conversations], unreadCounts, isLoading: false });
        
      } catch (error) {
        set({ 
          error: formatError(error),
          isLoading: false 
        });
      }
    },

    loadMessages: async (conversationId, page = 1) => {
      if (conversationId?.startsWith('temp_')) {
        return Promise.resolve();
      }

      const { _messageLoadingErrors } = get();
      if (_messageLoadingErrors.has(conversationId)) {
        return Promise.resolve();
      }

      const { messages } = get();
      const existingMessages = messages.get(conversationId);
      
      if (page === 1 && existingMessages?.length > 0) return Promise.resolve();

      set({ isLoading: page === 1 });
      
      try {
        const response = await chatService.getMessages(conversationId, { page, limit: 50 });
        const newMessages = response.data.data || [];
        
        get()._updateMessages(conversationId, (existing) => {
          const sorted = newMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return page === 1 ? sorted : [...sorted, ...existing];
        });

        setTimeout(() => get().markConversationAsRead(conversationId), 500);
        
      } catch (error) {
        console.error('Load messages failed:', error);
        
        set(state => ({
          _messageLoadingErrors: new Set([...state._messageLoadingErrors, conversationId])
        }));
        
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          console.warn(`Messages not available for conversation ${conversationId}, continuing without messages`);
        }
      } finally {
        set({ isLoading: false });
      }
    },

    // ============== Message Operations (Keep existing) ==============
    sendMessage: async (conversationId, content, type = 'text', replyTo = null) => {
      if (!content?.trim()) return;

      const { currentUser, temporaryConversation, replyToMessage } = get();
      if (!currentUser) return;

      let actualConversationId = conversationId;

      if (conversationId?.startsWith('temp_')) {
        const targetUser = temporaryConversation?.participants.find(
          p => p.user._id !== currentUser._id
        )?.user;

        if (!targetUser) return;

        try {
          const response = await chatService.createDirectConversation({ 
            participantId: targetUser._id 
          });
          
          const realConversation = response.data.data;
          actualConversationId = realConversation._id;

          set(state => ({
            conversations: [realConversation, ...state.conversations],
            activeConversationId: actualConversationId,
            temporaryConversation: null
          }));

          get()._updateUnreadCount(realConversation._id, 0);
          setTimeout(() => socketService.joinConversation(actualConversationId), 100);
          
        } catch (error) {
          toast.error('Failed to start conversation');
          return;
        }
      }

      let optimisticReplyTo = null;
      if (replyTo || replyToMessage) {
        const replyMsg = replyToMessage || replyTo;
        optimisticReplyTo = {
          _id: replyMsg._id,
          content: replyMsg.content,
          sender: {
            _id: replyMsg.sender?._id || replyMsg.sender,
            name: replyMsg.sender?.name || 'Unknown',
            email: replyMsg.sender?.email || '',
            avatar: replyMsg.sender?.avatar || null
          },
          createdAt: replyMsg.createdAt,
          type: replyMsg.type || 'text'
        };
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const tempMessage = {
        _id: tempId,
        content: content.trim(),
        type,
        replyTo: optimisticReplyTo,
        sender: currentUser,
        conversation: actualConversationId,
        createdAt: new Date().toISOString(),
        status: 'sending',
        isOptimistic: true,
        reactions: []
      };

      get()._updateMessages(actualConversationId, (messages) => [...messages, tempMessage]);
      
      const { pendingMessages } = get();
      set({ 
        pendingMessages: get()._createNewMap(pendingMessages, tempId, tempMessage),
        replyToMessage: null 
      });

      socketService.sendMessage({
        conversationId: actualConversationId,
        content: content.trim(),
        type,
        replyTo: replyTo?._id || replyToMessage?._id || null,
        tempId,
      });
    },

    markConversationAsRead: async (conversationId) => {
      if (!conversationId?.startsWith('temp')) {
        const { messages, currentUser } = get();
        const conversationMessages = messages.get(conversationId) || [];
        
        get()._updateUnreadCount(conversationId, 0);
        
        const unreadMessages = conversationMessages.filter(msg => 
          msg.sender?._id !== currentUser?._id &&
          !msg.readBy?.some(r => r.user === currentUser?._id)
        );

        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(m => m._id);
          socketService.markMessagesRead(messageIds, conversationId);
          
          try {
            await chatService.markConversationAsRead(conversationId);
          } catch (error) {
            console.error('Failed to mark as read:', error);
          }
        }
      }
    },

    editMessage: async (messageId, newContent) => {
      if (!newContent?.trim()) return;

      try {
        socketService.editMessage(messageId, newContent.trim());
        await chatService.editMessage({ messageId, newContent: newContent.trim() });
      } catch (error) {
        toast.error('Failed to edit message');
      }
    },

    deleteMessage: async (messageId) => {
      try {
        socketService.deleteMessage(messageId);
        await chatService.deleteMessage(messageId);
      } catch (error) {
        toast.error('Failed to delete message');
      }
    },

    toggleReaction: async (messageId, emoji) => {
      const { currentUser } = get();
      if (!currentUser) return;

      const { messages } = get();
      const updatedMessages = new Map();
      
      messages.forEach((msgs, convId) => {
        const updated = msgs.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            const existingIndex = reactions.findIndex(r => 
              (r.user?._id || r.user) === currentUser._id && r.emoji === emoji
            );

            const newReactions = existingIndex !== -1 
              ? reactions.filter((_, i) => i !== existingIndex)
              : [...reactions, {
                  emoji,
                  user: currentUser._id,
                  userDetails: currentUser,
                  reactedAt: new Date().toISOString()
                }];

            return { ...msg, reactions: newReactions };
          }
          return msg;
        });
        updatedMessages.set(convId, updated);
      });

      set({ messages: updatedMessages });

      const hasReacted = messages.get(get().activeConversationId)
        ?.find(m => m._id === messageId)
        ?.reactions?.some(r => (r.user?._id || r.user) === currentUser._id && r.emoji === emoji);

      if (hasReacted) {
        socketService.removeReaction(messageId, emoji);
      } else {
        socketService.addReaction(messageId, emoji);
      }
    },

    searchUsers: async (query) => {
      if (!query || query.length < 2) {
        set({ searchResults: [] });
        return;
      }

      try {
        const response = await chatService.searchUsers({ q: query });
        set({ searchResults: response.data.data || [] });
      } catch (error) {
        set({ searchResults: [] });
      }
    },

    // ============== ENHANCED GROUP METHODS ==============
    createGroup: async (groupData) => {
      if (!groupData.name?.trim()) {
        throw new Error('Group name is required');
      }

      set({ isLoading: true });
      
      try {
        const response = await chatService.createGroup({
          name: groupData.name.trim(),
          description: groupData.description?.trim() || '',
          participants: groupData.participants || []
        });
        
        const newGroup = response.data.data;
        
        // Add to conversations list at the top
        set(state => ({
          conversations: [newGroup, ...state.conversations],
          isLoading: false
        }));
        
        // Initialize empty messages and unread count
        get()._updateMessages(newGroup._id, () => []);
        get()._updateUnreadCount(newGroup._id, 0);
        
        // Clear any loading errors
        set(state => {
          const newErrors = new Set(state._messageLoadingErrors);
          newErrors.delete(newGroup._id);
          return { _messageLoadingErrors: newErrors };
        });
        
        // Emit socket event for real-time updates
        socketService.emit('group_created', { group: newGroup });
        
        return newGroup;
      } catch (error) {
        set({ isLoading: false });
        throw new Error(formatError(error));
      }
    },

    updateGroup: async (groupId, updateData) => {
      try {
        const response = await chatService.updateGroup(groupId, updateData);
        const updatedGroup = response.data.data;
        
        // Update in conversations list
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv._id === groupId ? { ...conv, ...updatedGroup } : conv
          )
        }));
        
        // Emit socket event for real-time updates
        socketService.emit('group_updated', { groupId, updateData: updatedGroup });
        
        return updatedGroup;
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    updateGroupInfo: async (groupId, info) => {
      try {
        const response = await chatService.updateGroup(groupId, info);
        const updatedGroup = response.data.data;
        
        // Update conversation with new info
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv._id === groupId ? { ...conv, ...updatedGroup } : conv
          )
        }));
        
        // Emit socket event for all participants
        socketService.emit('group_info_updated', { 
          groupId, 
          info: { name: info.name, description: info.description }
        });
        
        return updatedGroup;
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    // FIXED: Enhanced add participants with proper state updates
    addGroupParticipants: async (groupId, participants) => {
      try {
        console.log('Adding participants to group:', { groupId, participants });
        
        const response = await chatService.addGroupParticipants(groupId, participants);
        const updatedGroup = response.data.data;
        
        console.log('Participants added successfully:', updatedGroup);
        
        // Update conversation with new participants
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv._id === groupId ? { ...conv, ...updatedGroup } : conv
          )
        }));
        
        // Emit socket event for real-time updates to all participants
        socketService.emit('participants_added', { 
          groupId, 
          participants: updatedGroup.participants,
          addedParticipants: participants
        });
        
        return updatedGroup;
      } catch (error) {
        console.error('Failed to add participants:', error);
        throw new Error(formatError(error));
      }
    },

    // ENHANCED: Remove participant with proper cleanup
    removeGroupParticipant: async (groupId, participantId) => {
      try {
        await chatService.removeGroupParticipant(groupId, participantId);
        
        // Update local state
        set(state => ({
          conversations: state.conversations.map(conv => {
            if (conv._id === groupId) {
              return {
                ...conv,
                participants: conv.participants?.filter(p => p.user._id !== participantId) || []
              };
            }
            return conv;
          })
        }));
        
        // If current user was removed, remove from their conversation list
        const { currentUser } = get();
        if (participantId === currentUser?._id) {
          get()._removeConversation(groupId);
          
          // Leave socket room
          socketService.leaveConversation(groupId);
        }
        
        // Emit socket events
        socketService.emit('participant_removed', { groupId, participantId });
        
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    // ENHANCED: Role change with real-time updates
    changeParticipantRole: async (groupId, participantId, role) => {
      try {
        await chatService.changeParticipantRole(groupId, participantId, role);
        
        // Update local state
        set(state => ({
          conversations: state.conversations.map(conv => {
            if (conv._id === groupId) {
              return {
                ...conv,
                participants: conv.participants?.map(p => 
                  p.user._id === participantId ? { ...p, role } : p
                ) || []
              };
            }
            return conv;
          })
        }));
        
        // Emit socket event for real-time updates
        socketService.emit('participant_role_changed', { groupId, participantId, role });
        
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    // ENHANCED: Leave group with complete cleanup
    leaveGroup: async (groupId) => {
      try {
        await chatService.leaveGroup(groupId);
        
        // Complete cleanup from state
        get()._removeConversation(groupId);
        
        // Leave socket room
        socketService.leaveConversation(groupId);
        
        // Emit socket event to notify other participants
        socketService.emit('user_left_group', { groupId, userId: get().currentUser?._id });
        
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    // ENHANCED: Delete group with complete cleanup for all members
    deleteGroup: async (groupId) => {
      try {
        // First mark as deleted on server
        await chatService.updateGroup(groupId, { deleted: true });
        
        // Remove from local state
        get()._removeConversation(groupId);
        
        // Leave socket room
        socketService.leaveConversation(groupId);
        
        // CRITICAL: Emit socket event to remove group from ALL participants' lists
        socketService.emit('group_deleted', { groupId });
        
      } catch (error) {
        throw new Error(formatError(error));
      }
    },

    updateConversation: (conversationId, updatedData) => {
      set(state => ({
        conversations: state.conversations.map(conv => 
          conv._id === conversationId ? { ...conv, ...updatedData } : conv
        )
      }));
    },

    // ============== ENHANCED Socket Events Setup ==============
    setupSocketEvents: () => {
      const { _eventsSetup } = get();
      if (_eventsSetup) return;

      set({ _eventsSetup: true });

      const messageEvents = {
        [SOCKET_EVENTS.NEW_MESSAGE]: ({ message, conversationId }) => {
          get()._updateMessages(conversationId, (messages) => {
            if (messages.some(m => m._id === message._id)) return messages;
            return [...messages, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          });

          const { activeConversationId, currentUser } = get();
          const isOwnMessage = message.sender?._id === currentUser?._id;
          const isActiveConversation = activeConversationId === conversationId;

          if (!isOwnMessage) {
            if (isActiveConversation) {
              get()._updateUnreadCount(conversationId, 0);
              setTimeout(() => {
                socketService.markMessagesRead([message._id], conversationId);
              }, 1000);
            } else {
              const { unreadCounts } = get();
              const currentCount = unreadCounts.get(conversationId) || 0;
              get()._updateUnreadCount(conversationId, currentCount + 1);
            }
          }

          get().updateConversationLastMessage(conversationId, message);
        },

        [SOCKET_EVENTS.MESSAGE_SENT]: ({ message, tempId, conversationId }) => {
          get()._updateMessages(conversationId, (messages) =>
            messages.map(m => {
              if (m._id === tempId) {
                const preservedReplyTo = m.replyTo && (!message.replyTo?.sender || !message.replyTo.sender.name) 
                  ? m.replyTo 
                  : message.replyTo;
                
                return { 
                  ...message, 
                  replyTo: preservedReplyTo,
                  isOptimistic: false 
                };
              }
              return m;
            })
          );

          const { pendingMessages } = get();
          const newPending = new Map(pendingMessages);
          newPending.delete(tempId);
          set({ pendingMessages: newPending });

          get().updateConversationLastMessage(conversationId, message);
        },

        [SOCKET_EVENTS.MESSAGE_READ]: ({ conversationId, userId }) => {
          get()._updateMessages(conversationId, (messages) =>
            messages.map(msg => {
              const readBy = msg.readBy || [];
              if (!readBy.find(r => r.user === userId)) {
                return { ...msg, readBy: [...readBy, { user: userId, readAt: new Date() }] };
              }
              return msg;
            })
          );

          if (userId === get().currentUser?._id) {
            get()._updateUnreadCount(conversationId, 0);
          }
        },

        [SOCKET_EVENTS.REACTION_UPDATED]: ({ messageId, reactions }) => {
          const { messages } = get();
          const updatedMessages = new Map();
          
          messages.forEach((msgs, convId) => {
            const updated = msgs.map(msg => 
              msg._id === messageId ? { ...msg, reactions: reactions || [] } : msg
            );
            updatedMessages.set(convId, updated);
          });
          
          set({ messages: updatedMessages });
        },

        [SOCKET_EVENTS.MESSAGE_EDITED]: ({ messageId, newContent, editedAt }) => {
          const { messages } = get();
          const updatedMessages = new Map();
          
          messages.forEach((msgs, convId) => {
            const updated = msgs.map(msg =>
              msg._id === messageId 
                ? { ...msg, content: newContent, editedAt, isEdited: true }
                : msg
            );
            updatedMessages.set(convId, updated);
          });
          
          set({ messages: updatedMessages, messageEditingId: null });
        },

        [SOCKET_EVENTS.MESSAGE_DELETED]: ({ messageId }) => {
          const { messages } = get();
          const updatedMessages = new Map();
          
          messages.forEach((msgs, convId) => {
            const updated = msgs.map(msg =>
              msg._id === messageId 
                ? { ...msg, isDeleted: true, content: 'This message was deleted' }
                : msg
            );
            updatedMessages.set(convId, updated);
          });
          
          set({ messages: updatedMessages });
        },

        // ENHANCED GROUP SOCKET EVENTS
        [SOCKET_EVENTS.USER_JOINED_GROUP]: ({ groupId, user, participants }) => {
          set(state => ({
            conversations: state.conversations.map(conv => {
              if (conv._id === groupId) {
                // Use updated participants from server if available
                const newParticipants = participants || [...(conv.participants || [])];
                if (!participants && !newParticipants.find(p => p.user._id === user._id)) {
                  newParticipants.push({ user, role: 'member' });
                }
                return { ...conv, participants: newParticipants };
              }
              return conv;
            })
          }));
          
          // Show notification if not current user
          const { currentUser } = get();
          if (user._id !== currentUser?._id) {
            toast.success(`${user.name} joined the group`);
          }
        },

        [SOCKET_EVENTS.USER_LEFT_GROUP]: ({ groupId, userId, userName }) => {
          set(state => ({
            conversations: state.conversations.map(conv => {
              if (conv._id === groupId) {
                return {
                  ...conv,
                  participants: conv.participants?.filter(p => p.user._id !== userId) || []
                };
              }
              return conv;
            })
          }));
          
          // Show notification
          toast.info(`${userName || 'Someone'} left the group`);
        },

        // NEW: Group deleted event - removes group from all participants
        'group_deleted': ({ groupId }) => {
          const { currentUser } = get();
          get()._removeConversation(groupId);
          
          // Show notification
          toast.error('Group was deleted by admin');
        },

        // NEW: Group info updated
        'group_info_updated': ({ groupId, info }) => {
          set(state => ({
            conversations: state.conversations.map(conv => 
              conv._id === groupId ? { ...conv, ...info } : conv
            )
          }));
        },

        // NEW: Participant role changed
        'participant_role_changed': ({ groupId, participantId, role }) => {
          set(state => ({
            conversations: state.conversations.map(conv => {
              if (conv._id === groupId) {
                return {
                  ...conv,
                  participants: conv.participants?.map(p => 
                    p.user._id === participantId ? { ...p, role } : p
                  ) || []
                };
              }
              return conv;
            })
          }));
        },

        // NEW: Participant removed
        'participant_removed': ({ groupId, participantId }) => {
          const { currentUser } = get();
          
          // If current user was removed, remove group from their list
          if (participantId === currentUser?._id) {
            get()._removeConversation(groupId);
            toast.error('You were removed from the group');
            return;
          }
          
          // Otherwise just update participants list
          set(state => ({
            conversations: state.conversations.map(conv => {
              if (conv._id === groupId) {
                return {
                  ...conv,
                  participants: conv.participants?.filter(p => p.user._id !== participantId) || []
                };
              }
              return conv;
            })
          }));
        },
      };

      Object.entries(messageEvents).forEach(([event, handler]) => {
        socketService.on(event, handler);
      });
    },

    // ============== Utilities ==============
    updateConversationLastMessage: (conversationId, message) => {
      const { conversations } = get();
      const updated = conversations.map(conv => {
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

    getUnreadCount: (conversationId) => {
      const { unreadCounts } = get();
      return unreadCounts.get(conversationId) || 0;
    },

    getCurrentConversation: () => {
      const { temporaryConversation, activeConversationId, conversations } = get();
      
      if (temporaryConversation) return temporaryConversation;
      if (activeConversationId) {
        return conversations.find(c => c._id === activeConversationId);
      }
      return null;
    },

    getCurrentConversationId: () => {
      const { temporaryConversation, activeConversationId } = get();
      return temporaryConversation?._id || activeConversationId;
    },

    setMessageEditing: (messageId) => set({ messageEditingId: messageId }),
    setReplyToMessage: (message) => set({ replyToMessage: message }),
    clearReplyToMessage: () => set({ replyToMessage: null }),

    cleanup: () => {
      const chatEvents = [
        SOCKET_EVENTS.NEW_MESSAGE,
        SOCKET_EVENTS.MESSAGE_SENT,
        SOCKET_EVENTS.MESSAGE_EDITED,
        SOCKET_EVENTS.MESSAGE_DELETED,
        SOCKET_EVENTS.MESSAGE_READ,
        SOCKET_EVENTS.REACTION_UPDATED,
        SOCKET_EVENTS.USER_JOINED_GROUP,
        SOCKET_EVENTS.USER_LEFT_GROUP,
        'group_deleted',
        'group_info_updated',
        'participant_role_changed',
        'participant_removed',
      ];

      chatEvents.forEach(event => socketService.off(event));
      
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
        _messageLoadingErrors: new Set(),
        isLoading: false,
        error: null,
      });
    },
  }))
);

export default useChatStore;
