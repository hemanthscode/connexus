import { create } from 'zustand';
import socketService from '../services/socket';

const useSocketStore = create((set, get) => ({
  // Connection State
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  socketId: null,
  reconnectAttempts: 0,

  // Online Users
  onlineUsers: [],
  userStatuses: new Map(),

  // Typing Indicators
  typingUsers: new Map(),

  connect: (token) => {
    const state = get();
    
    if (state.isConnecting || state.isConnected) {
      console.log('🔌 Socket already connecting/connected, skipping...');
      return;
    }

    console.log('🔌 Starting socket connection...');
    set({ 
      isConnecting: true, 
      connectionError: null 
    });
    
    try {
      socketService.connect(token);
      
      if (!socketService._storeListenersSetup) {
        console.log('🔌 Setting up store event listeners...');
        socketService._storeListenersSetup = true;
        
        socketService.on('socket_connected', () => {
          set({ 
            isConnected: true, 
            isConnecting: false,
            socketId: socketService.socket?.id || null,
            reconnectAttempts: 0,
            connectionError: null
          });
        });

        socketService.on('socket_disconnected', (reason) => {
          set({ 
            isConnected: false,
            connectionError: reason,
            socketId: null 
          });
        });

        socketService.on('socket_error', (error) => {
          set({ 
            connectionError: error.message || 'Connection error',
            isConnecting: false 
          });
        });

        socketService.on('current_online_users', (users) => {
          set({ onlineUsers: users || [] });
        });

        socketService.on('user_online', (data) => {
          const state = get();
          const updatedUsers = [...state.onlineUsers];
          const existingIndex = updatedUsers.findIndex(u => u.userId === data.userId);
          
          if (existingIndex === -1) {
            updatedUsers.push(data);
            set({ onlineUsers: updatedUsers });
          }
          
          const statuses = new Map(state.userStatuses);
          statuses.set(data.userId, { status: 'online', lastSeen: null });
          set({ userStatuses: statuses });
        });

        socketService.on('user_offline', (data) => {
          const state = get();
          const updatedUsers = state.onlineUsers.filter(u => u.userId !== data.userId);
          set({ onlineUsers: updatedUsers });
          
          const statuses = new Map(state.userStatuses);
          statuses.set(data.userId, { status: 'offline', lastSeen: data.lastSeen });
          set({ userStatuses: statuses });
        });

        socketService.on('user_status_updated', (data) => {
          const state = get();
          const statuses = new Map(state.userStatuses);
          statuses.set(data.userId, { 
            status: data.status, 
            lastSeen: data.lastSeen 
          });
          set({ userStatuses: statuses });
        });

        socketService.on('user_typing', (data) => {
          const state = get();
          const typing = new Map(state.typingUsers);
          const conversationTyping = typing.get(data.conversationId) || [];
          
          if (!conversationTyping.find(u => u._id === data.userId)) {
            conversationTyping.push(data.user);
            typing.set(data.conversationId, conversationTyping);
            set({ typingUsers: typing });
          }
        });

        socketService.on('user_stop_typing', (data) => {
          const state = get();
          const typing = new Map(state.typingUsers);
          const conversationTyping = (typing.get(data.conversationId) || [])
            .filter(u => u._id !== data.userId);
          
          if (conversationTyping.length === 0) {
            typing.delete(data.conversationId);
          } else {
            typing.set(data.conversationId, conversationTyping);
          }
          
          set({ typingUsers: typing });
        });
      }

    } catch (error) {
      console.error('Socket connection failed:', error);
      set({ 
        isConnecting: false, 
        connectionError: error.message 
      });
    }
  },

  disconnect: () => {
    console.log('🔌 Disconnecting socket from store...');
    socketService.disconnect();
    set({
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      socketId: null,
      onlineUsers: [],
      userStatuses: new Map(),
      typingUsers: new Map(),
    });
  },

  // Helper Methods
  isUserOnline: (userId) => {
    const state = get();
    return state.onlineUsers.some(u => u.userId === userId);
  },

  getUserStatus: (userId) => {
    const state = get();
    return state.userStatuses.get(userId) || { status: 'offline', lastSeen: null };
  },

  getTypingUsers: (conversationId) => {
    const state = get();
    return state.typingUsers.get(conversationId) || [];
  },

  // Socket Actions
  joinConversation: (conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.joinConversation(conversationId);
    }
  },

  leaveConversation: (conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.leaveConversation(conversationId);
    }
  },

  sendMessage: (messageData) => {
    const state = get();
    if (state.isConnected) {
      socketService.sendMessage(messageData);
    }
  },

  editMessage: (messageId, newContent) => {
    const state = get();
    if (state.isConnected) {
      socketService.editMessage(messageId, newContent);
    }
  },

  deleteMessage: (messageId) => {
    const state = get();
    if (state.isConnected) {
      socketService.deleteMessage(messageId);
    }
  },

  markMessagesRead: (messageIds, conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.markMessagesRead(messageIds, conversationId);
    }
  },

  startTyping: (conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.startTyping(conversationId);
    }
  },

  stopTyping: (conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.stopTyping(conversationId);
    }
  },

  addReaction: (messageId, emoji) => {
    const state = get();
    if (state.isConnected) {
      socketService.addReaction(messageId, emoji);
    }
  },

  removeReaction: (messageId, emoji) => {
    const state = get();
    if (state.isConnected) {
      socketService.removeReaction(messageId, emoji);
    }
  },

  updateUserStatus: (status) => {
    const state = get();
    if (state.isConnected) {
      socketService.updateStatus(status);
    }
  },

  requestConversationInfo: (conversationId) => {
    const state = get();
    if (state.isConnected) {
      socketService.requestConversationInfo(conversationId);
    }
  },
}));

export default useSocketStore;
