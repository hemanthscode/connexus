import { create } from 'zustand';
import socketService from '../services/socket';
import { chatService } from '../services/chat';
import toast from 'react-hot-toast';

const useChatStore = create((set, get) => ({
  // Data State
  conversations: [],
  messages: new Map(),
  activeConversationId: null,
  isLoading: false,
  error: null,
  currentUser: null,

  // UI State
  messageEditingId: null,
  replyToMessage: null,
  searchQuery: '',
  searchResults: [],

  // Optimistic Updates
  pendingMessages: new Map(),

  // Event setup flag
  _eventsSetup: false,

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
    
    set({ activeConversationId: conversationId });
    
    if (conversationId) {
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        setTimeout(() => {
          socketService.joinConversation(conversationId);
          socketService.requestConversationInfo(conversationId);
        }, 100);
      }
    }
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
      
      set({ 
        conversations,
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
    if (!conversationId) return;

    const state = get();
    const existingMessages = state.messages.get(conversationId);
    
    if (page === 1 && existingMessages && existingMessages.length > 0) {
      return;
    }

    set({ isLoading: page === 1 });
    try {
      const response = await chatService.getMessages(conversationId, { page, limit: 50 });
      const newMessages = response.data.data || [];
      
      // Sort messages by creation time (oldest first)
      const sortedNewMessages = newMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      let updatedMessages;
      if (page === 1) {
        updatedMessages = sortedNewMessages;
      } else {
        const existingMessages = state.messages.get(conversationId) || [];
        updatedMessages = [...sortedNewMessages, ...existingMessages];
      }
      
      const messagesMap = new Map(state.messages);
      messagesMap.set(conversationId, updatedMessages);
      
      set({ 
        messages: messagesMap,
        isLoading: false 
      });
      
      if (sortedNewMessages.length > 0) {
        const messageIds = sortedNewMessages.map(m => m._id);
        socketService.markMessagesRead(messageIds, conversationId);
      }
      
    } catch (error) {
      console.error('Load messages failed:', error);
      set({ isLoading: false });
    }
  },

  // FIXED: Send message ONLY via socket (no API call)
  sendMessage: async (conversationId, content, type = 'text', replyTo = null) => {
    if (!conversationId || !content.trim()) return;

    const state = get();
    if (!state.currentUser) {
      console.error('No current user found');
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      _id: tempId,
      content: content.trim(),
      type,
      replyTo,
      sender: state.currentUser,
      conversation: conversationId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true,
    };

    // Add optimistic message at the end (newest)
    const conversationMessages = state.messages.get(conversationId) || [];
    const messagesMap = new Map(state.messages);
    messagesMap.set(conversationId, [...conversationMessages, tempMessage]);
    
    const pendingMap = new Map(state.pendingMessages);
    pendingMap.set(tempId, tempMessage);
    
    set({ 
      messages: messagesMap,
      pendingMessages: pendingMap,
      replyToMessage: null 
    });

    // FIXED: Send ONLY via socket - backend handles DB save and broadcast
    socketService.sendMessage({
      conversationId,
      content: content.trim(),
      type,
      replyTo,
      tempId, // Include tempId for matching optimistic updates
    });

    // REMOVED: No API call - this was causing duplicates!
  },

  removeOptimisticMessage: (tempId) => {
    const state = get();
    const updatedMessages = new Map();
    
    state.messages.forEach((messages, conversationId) => {
      const filtered = messages.filter(m => m._id !== tempId);
      updatedMessages.set(conversationId, filtered);
    });
    
    const pendingMap = new Map(state.pendingMessages);
    pendingMap.delete(tempId);
    
    set({ 
      messages: updatedMessages,
      pendingMessages: pendingMap 
    });
  },

  setupSocketEvents: () => {
    const state = get();
    
    if (state._eventsSetup) {
      return;
    }

    console.log('🔌 Setting up chat socket events...');
    set({ _eventsSetup: true });

    // Handle messages from OTHER users only
    socketService.on('new_message', (data) => {
      try {
        const { message, conversationId } = data;
        const state = get();
        
        const conversationMessages = state.messages.get(conversationId) || [];
        
        // Check for exact duplicate by ID
        const isDuplicate = conversationMessages.some(m => m._id === message._id);
        if (isDuplicate) {
          console.log('🚫 Duplicate message detected, ignoring');
          return;
        }
        
        // Add new message in correct chronological position
        const updatedMessages = [...conversationMessages, message].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        const messagesMap = new Map(state.messages);
        messagesMap.set(conversationId, updatedMessages);
        
        set({ messages: messagesMap });
        get().updateConversationLastMessage(conversationId, message);
        
      } catch (error) {
        console.error('Error handling new_message event:', error);
      }
    });

    // FIXED: Handle confirmation from server for our own messages
    socketService.on('message_sent', (data) => {
      try {
        const { message, tempId, conversationId } = data;
        const state = get();
        
        const conversationMessages = state.messages.get(conversationId) || [];
        
        // Replace optimistic message with real one
        const updatedMessages = conversationMessages.map(m => 
          m._id === tempId ? message : m
        );
        
        const messagesMap = new Map(state.messages);
        messagesMap.set(conversationId, updatedMessages);
        
        // Remove from pending
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

    socketService.on('message_edited', (data) => {
      try {
        const { messageId, newContent, editedAt } = data;
        const state = get();
        
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

    socketService.on('message_read', (data) => {
      try {
        const { conversationId, userId } = data;
        const state = get();
        
        const conversationMessages = state.messages.get(conversationId) || [];
        const updated = conversationMessages.map(msg => {
          const readBy = msg.readBy || [];
          if (!readBy.find(r => r.user === userId)) {
            readBy.push({ user: userId, readAt: new Date() });
          }
          return { ...msg, readBy };
        });
        
        const messagesMap = new Map(state.messages);
        messagesMap.set(conversationId, updated);
        set({ messages: messagesMap });
      } catch (error) {
        console.error('Error handling message_read event:', error);
      }
    });

    socketService.on('reaction_updated', (data) => {
      try {
        const { messageId, reactions } = data;
        const state = get();
        
        const updatedMessages = new Map();
        state.messages.forEach((messages, conversationId) => {
          const updated = messages.map(msg => 
            msg._id === messageId 
              ? { ...msg, reactions }
              : msg
          );
          updatedMessages.set(conversationId, updated);
        });
        
        set({ messages: updatedMessages });
      } catch (error) {
        console.error('Error handling reaction_updated event:', error);
      }
    });

    socketService.on('conversation_info', (data) => {
      try {
        const { conversation } = data;
        const state = get();
        
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

  toggleReaction: async (messageId, emoji) => {
    try {
      const state = get();
      const currentUser = state.currentUser;
      
      if (!currentUser) {
        console.error('No current user found');
        return;
      }

      let hasReacted = false;
      
      state.messages.forEach((messages) => {
        const message = messages.find(m => m._id === messageId);
        if (message?.reactions) {
          hasReacted = message.reactions.some(r => 
            r.user === currentUser._id && r.emoji === emoji
          );
        }
      });
      
      if (hasReacted) {
        socketService.removeReaction(messageId, emoji);
      } else {
        socketService.addReaction(messageId, emoji);
      }
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
        searchResults: response.data.data || [],
        searchQuery: query 
      });
    } catch (error) {
      console.error('Search users failed:', error);
      set({ searchResults: [] });
    }
  },

  createDirectConversation: async (participantId) => {
    try {
      const response = await chatService.createDirectConversation({ participantId });
      const conversation = response.data.data;
      
      const state = get();
      const existingConv = state.conversations.find(c => c._id === conversation._id);
      
      if (!existingConv) {
        const updated = [conversation, ...state.conversations];
        set({ conversations: updated });
      }
      
      get().setActiveConversation(conversation._id);
      
      return conversation;
    } catch (error) {
      console.error('Create direct conversation failed:', error);
      toast.error('Failed to start conversation');
      throw error;
    }
  },

  // UI Actions
  setMessageEditing: (messageId) => {
    set({ messageEditingId: messageId });
  },

  setReplyToMessage: (message) => {
    set({ replyToMessage: message });
  },

  clearReplyToMessage: () => {
    set({ replyToMessage: null });
  },

  // Cleanup
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
      searchResults: [],
      messageEditingId: null,
      replyToMessage: null,
      currentUser: null,
      _eventsSetup: false,
      isLoading: false,
      error: null,
    });
  },
}));

export default useChatStore;
