/**
 * Socket Connection State Management
 * Handles real-time connection and presence
 */

import { create } from 'zustand';
import socketService from '../services/socket';
import { SOCKET_EVENTS } from '../utils/constants';

const useSocketStore = create((set, get) => ({
  // Connection State
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  socketId: null,

  // Presence State
  onlineUsers: [],
  userStatuses: new Map(),
  typingUsers: new Map(),

  // ============== Connection Management ==============

  connect: (token) => {
    const { isConnecting, isConnected } = get();
    
    if (isConnecting || isConnected) return;

    set({ isConnecting: true, connectionError: null });
    
    try {
      socketService.connect(token);
      get()._setupEventListeners();
    } catch (error) {
      set({ isConnecting: false, connectionError: error.message });
    }
  },

  disconnect: () => {
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

  // ============== Event Handlers ==============

  _setupEventListeners: () => {
    if (socketService._storeListenersSetup) return;
    
    socketService._storeListenersSetup = true;

    const connectionHandlers = {
      socket_connected: () => {
        set({
          isConnected: true,
          isConnecting: false,
          socketId: socketService.socket?.id || null,
          connectionError: null
        });
      },

      socket_disconnected: (reason) => {
        set({
          isConnected: false,
          connectionError: reason,
          socketId: null
        });
      },

      socket_error: (error) => {
        set({
          connectionError: error.message || 'Connection error',
          isConnecting: false
        });
      }
    };

    const presenceHandlers = {
      [SOCKET_EVENTS.CURRENT_ONLINE_USERS]: (users) => {
        set({ onlineUsers: users || [] });
      },

      [SOCKET_EVENTS.USER_ONLINE]: (data) => {
        const { onlineUsers, userStatuses } = get();
        
        if (!onlineUsers.find(u => u.userId === data.userId)) {
          set({ onlineUsers: [...onlineUsers, data] });
        }
        
        const newStatuses = new Map(userStatuses);
        newStatuses.set(data.userId, { status: 'online', lastSeen: null });
        set({ userStatuses: newStatuses });
      },

      [SOCKET_EVENTS.USER_OFFLINE]: (data) => {
        const { onlineUsers, userStatuses } = get();
        
        set({ 
          onlineUsers: onlineUsers.filter(u => u.userId !== data.userId)
        });
        
        const newStatuses = new Map(userStatuses);
        newStatuses.set(data.userId, { status: 'offline', lastSeen: data.lastSeen });
        set({ userStatuses: newStatuses });
      },

      [SOCKET_EVENTS.USER_STATUS_UPDATED]: (data) => {
        const { userStatuses } = get();
        const newStatuses = new Map(userStatuses);
        newStatuses.set(data.userId, {
          status: data.status,
          lastSeen: data.lastSeen
        });
        set({ userStatuses: newStatuses });
      }
    };

    const typingHandlers = {
      [SOCKET_EVENTS.USER_TYPING]: (data) => {
        const { typingUsers } = get();
        const newTyping = new Map(typingUsers);
        const conversationTyping = newTyping.get(data.conversationId) || [];
        
        if (!conversationTyping.find(u => u._id === data.userId)) {
          conversationTyping.push(data.user);
          newTyping.set(data.conversationId, conversationTyping);
          set({ typingUsers: newTyping });
        }
      },

      [SOCKET_EVENTS.USER_STOP_TYPING]: (data) => {
        const { typingUsers } = get();
        const newTyping = new Map(typingUsers);
        const conversationTyping = (newTyping.get(data.conversationId) || [])
          .filter(u => u._id !== data.userId);
        
        if (conversationTyping.length === 0) {
          newTyping.delete(data.conversationId);
        } else {
          newTyping.set(data.conversationId, conversationTyping);
        }
        
        set({ typingUsers: newTyping });
      }
    };

    // Register all handlers
    [...Object.entries(connectionHandlers), 
     ...Object.entries(presenceHandlers), 
     ...Object.entries(typingHandlers)
    ].forEach(([event, handler]) => {
      socketService.on(event, handler);
    });
  },

  // ============== Utility Methods ==============

  isUserOnline: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers.some(u => u.userId === userId);
  },

  getUserStatus: (userId) => {
    const { userStatuses } = get();
    return userStatuses.get(userId) || { status: 'offline', lastSeen: null };
  },

  getTypingUsers: (conversationId) => {
    const { typingUsers } = get();
    return typingUsers.get(conversationId) || [];
  },

  getConnectionStatus: () => {
    const { isConnected, socketId } = get();
    return socketService.getConnectionStatus() || { isConnected, socketId };
  },
}));

export default useSocketStore;
