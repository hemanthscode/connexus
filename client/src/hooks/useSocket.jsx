/**
 * Socket Hook - OPTIMAL & CONCISE
 */
import { useEffect, useMemo, useCallback } from 'react';
import useSocketStore from '../store/socketStore';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';
import { typingHelpers } from '../utils/chatHelpers';

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { cleanup } = useChatStore();
  const store = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      store.connect(token);
    } else if (!isAuthenticated) {
      store.disconnect();
      cleanup();
    }
  }, [isAuthenticated, token]);

  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    return store.onlineUsers.some(u => (u.userId || u._id) === userId) || 
           store.userStatuses.get(userId)?.status === 'online';
  }, [store.onlineUsers, store.userStatuses]);

  const getUserStatus = useCallback((userId) => {
    if (!userId) return null;
    return store.userStatuses.get(userId) || 
           (store.onlineUsers.find(u => (u.userId || u._id) === userId) 
             ? { status: 'online', lastSeen: null }
             : { status: 'offline', lastSeen: null });
  }, [store.userStatuses, store.onlineUsers]);

  const getTypingUsers = useCallback((conversationId) => {
    return conversationId ? store.getTypingUsers(conversationId) : [];
  }, [store]);

  const actions = useMemo(() => ({
    startTyping: (conversationId) => {
      if (store.isConnected && conversationId && !conversationId.startsWith('temp_')) {
        socketService.startTyping(conversationId);
      }
    },
    stopTyping: (conversationId) => {
      if (store.isConnected && conversationId && !conversationId.startsWith('temp_')) {
        socketService.stopTyping(conversationId);
      }
    },
    reconnect: () => token && store.connect(token),
  }), [store.isConnected, token]);

  const utilities = useMemo(() => ({
    isUserOnline,
    getUserStatus,
    getTypingUsers,
    getTypingIndicatorText: (conversationId, currentUserId) => {
      const users = getTypingUsers(conversationId);
      return typingHelpers.formatTypingText(users, currentUserId);
    },
    hasTypingUsers: (conversationId, currentUserId) => {
      const users = getTypingUsers(conversationId);
      return typingHelpers.hasTypingUsers(users, currentUserId);
    },
  }), [isUserOnline, getUserStatus, getTypingUsers]);

  return {
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    connectionError: store.connectionError,
    ...actions,
    ...utilities,
  };
};

export default useSocket;
