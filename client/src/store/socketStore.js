/**
 * Socket Store - OPTIMAL & CONCISE
 */
import { create } from 'zustand';
import socketService from '../services/socket';
import { SOCKET_EVENTS, USER_STATUS } from '../utils/constants';

const useSocketStore = create((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  onlineUsers: [],
  userStatuses: new Map(),
  typingUsers: new Map(),

  connect: (token) => {
    const { isConnecting, isConnected } = get();
    if (isConnecting || isConnected) return;
    
    set({ isConnecting: true, connectionError: null });
    try {
      socketService.connect(token);
      get()._setupEvents();
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
      onlineUsers: [],
      userStatuses: new Map(),
      typingUsers: new Map(),
    });
  },

  getTypingUsers: (conversationId) => get().typingUsers.get(conversationId) || [],

  _setupEvents: () => {
    if (socketService._setup) return;
    socketService._setup = true;

    // Connection
    socketService.on('socket_connected', () => {
      set({ isConnected: true, isConnecting: false, connectionError: null });
    });

    socketService.on('socket_disconnected', (reason) => {
      set({ isConnected: false, connectionError: reason });
    });

    // Presence
    socketService.on(SOCKET_EVENTS.CURRENT_ONLINE_USERS, (users) => {
      set({ onlineUsers: users || [] });
    });

    socketService.on(SOCKET_EVENTS.USER_ONLINE, (data) => {
      const { onlineUsers, userStatuses } = get();
      const userId = data.userId || data._id;
      
      if (!onlineUsers.find(u => (u.userId || u._id) === userId)) {
        set({ onlineUsers: [...onlineUsers, data] });
      }
      
      const newStatuses = new Map(userStatuses);
      newStatuses.set(userId, { status: USER_STATUS.ONLINE, lastSeen: null });
      set({ userStatuses: newStatuses });
    });

    socketService.on(SOCKET_EVENTS.USER_OFFLINE, (data) => {
      const { onlineUsers, userStatuses } = get();
      const userId = data.userId || data._id;
      
      set({ onlineUsers: onlineUsers.filter(u => (u.userId || u._id) !== userId) });
      
      const newStatuses = new Map(userStatuses);
      newStatuses.set(userId, { status: USER_STATUS.OFFLINE, lastSeen: data.lastSeen });
      set({ userStatuses: new Map(newStatuses) }); // Force update
    });

    // Typing
    socketService.on(SOCKET_EVENTS.USER_TYPING, (data) => {
      const { typingUsers } = get();
      const newTyping = new Map(typingUsers);
      const users = newTyping.get(data.conversationId) || [];
      
      if (!users.find(u => (u._id || u.id) === (data.user._id || data.user.id))) {
        users.push(data.user);
        newTyping.set(data.conversationId, users);
        set({ typingUsers: newTyping });
      }
    });

    socketService.on(SOCKET_EVENTS.USER_STOP_TYPING, (data) => {
      const { typingUsers } = get();
      const newTyping = new Map(typingUsers);
      const users = (newTyping.get(data.conversationId) || [])
        .filter(u => (u._id || u.id) !== data.userId);
      
      if (users.length === 0) {
        newTyping.delete(data.conversationId);
      } else {
        newTyping.set(data.conversationId, users);
      }
      set({ typingUsers: newTyping });
    });
  },
}));

export default useSocketStore;
