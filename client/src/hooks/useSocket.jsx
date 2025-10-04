/**
 * Socket Hook - PERFORMANCE OPTIMIZED
 * Manages socket connection and real-time features with memoization and typing fixes
 */

import { useEffect, useMemo } from 'react';
import useSocketStore from '../store/socketStore';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketStore = useSocketStore();
  const { cleanup: cleanupChat } = useChatStore();
  
  const {
    isConnected,
    isConnecting,
    connectionError,
    onlineUsers,
    userStatuses,
    typingUsers,
    connect,
    disconnect,
    isUserOnline,
    getUserStatus,
    getTypingUsers,
    getConnectionStatus,
  } = socketStore;

  // Handle connection based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token);
    } else if (!isAuthenticated) {
      disconnect();
      cleanupChat();
    }
  }, [isAuthenticated, token, connect, disconnect, cleanupChat]);

  // MEMOIZED: Socket actions to prevent recreation on every render
  const socketActions = useMemo(() => ({
    // Typing actions - OPTIMIZED
    startTyping: (conversationId) => {
      if (isConnected && conversationId && !conversationId.startsWith('temp_')) {
        console.log('🔤 Starting typing for conversation:', conversationId);
        socketService.startTyping(conversationId);
      }
    },
    
    stopTyping: (conversationId) => {
      if (isConnected && conversationId && !conversationId.startsWith('temp_')) {
        console.log('🔤 Stopping typing for conversation:', conversationId);
        socketService.stopTyping(conversationId);
      }
    },
    
    // Presence actions
    updateUserStatus: (status) => {
      if (isConnected) {
        socketService.updateStatus(status);
      }
    },
    
    // Connection actions
    reconnect: () => {
      if (token) connect(token);
    },
    
    forceDisconnect: () => {
      disconnect();
    },

    // Message actions
    joinConversation: (conversationId) => {
      if (isConnected && conversationId) {
        socketService.joinConversation(conversationId);
      }
    },

    leaveConversation: (conversationId) => {
      if (isConnected && conversationId) {
        socketService.leaveConversation(conversationId);
      }
    },
  }), [isConnected, token, connect, disconnect]);

  // MEMOIZED: Utility methods to prevent recreation and improve performance
  const utilities = useMemo(() => ({
    // Basic utilities
    isUserOnline,
    getUserStatus,
    getConnectionStatus,
    
    // OPTIMIZED: Memoized typing users getter
    getTypingUsers: (conversationId) => {
      if (!conversationId) return [];
      return getTypingUsers(conversationId) || [];
    },
    
    // Get online status for multiple users
    getUsersOnlineStatus: (userIds) => {
      if (!Array.isArray(userIds)) return [];
      return userIds.map(id => ({
        userId: id,
        isOnline: isUserOnline(id),
        status: getUserStatus(id)
      }));
    },
    
    // Check if any users are typing in conversation
    isAnyoneTyping: (conversationId) => {
      const typingList = getTypingUsers(conversationId);
      return typingList && typingList.length > 0;
    },
    
    // OPTIMIZED: Get formatted typing indicator text - works for any conversation
    getTypingIndicatorText: (conversationId, currentUserId) => {
      const typingList = getTypingUsers(conversationId);
      
      if (!typingList || typingList.length === 0) return '';
      
      // Filter out current user if provided
      const otherTyping = currentUserId 
        ? typingList.filter(user => user._id !== currentUserId)
        : typingList;
      
      if (otherTyping.length === 0) return '';
      if (otherTyping.length === 1) return `${otherTyping[0].name} is typing...`;
      if (otherTyping.length === 2) return `${otherTyping[0].name} and ${otherTyping[1].name} are typing...`;
      return `${otherTyping[0].name} and ${otherTyping.length - 1} others are typing...`;
    },

    // NEW: Get all typing conversations for sidebar optimization
    getAllTypingConversations: () => {
      const typingConversations = {};
      
      // Convert Map to plain object for better performance
      if (typingUsers instanceof Map) {
        for (let [conversationId, users] of typingUsers) {
          if (users && users.length > 0) {
            typingConversations[conversationId] = users;
          }
        }
      }
      
      return typingConversations;
    },

    // NEW: Check if specific conversation has typing users
    hasTypingUsers: (conversationId) => {
      if (!conversationId) return false;
      const typingList = getTypingUsers(conversationId);
      return typingList && typingList.length > 0;
    },

    // NEW: Get typing user names for conversation
    getTypingUserNames: (conversationId, currentUserId, maxNames = 2) => {
      const typingList = getTypingUsers(conversationId);
      
      if (!typingList || typingList.length === 0) return [];
      
      const otherTyping = currentUserId 
        ? typingList.filter(user => user._id !== currentUserId)
        : typingList;
      
      return otherTyping.slice(0, maxNames).map(user => user.name);
    },
  }), [
    isUserOnline, 
    getUserStatus, 
    getTypingUsers, 
    getConnectionStatus, 
    typingUsers
  ]);

  // MEMOIZED: All typing conversations for performance
  const allTypingConversations = useMemo(() => {
    return utilities.getAllTypingConversations();
  }, [typingUsers, utilities]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    
    // Presence data
    onlineUsers,
    userStatuses,
    typingUsers,
    
    // Actions (memoized)
    ...socketActions,
    
    // Utilities (memoized)
    ...utilities,

    // Additional optimized data
    allTypingConversations,
  };
};

export default useSocket;
