import { useEffect, useRef } from 'react';
import useSocketStore from '../store/socketStore';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketStore = useSocketStore();
  const chatStore = useChatStore();
  
  const connectionAttempted = useRef(false);
  const eventsSetup = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token && !connectionAttempted.current) {
      console.log('🔌 Attempting socket connection...');
      connectionAttempted.current = true;
      
      socketStore.connect(token);
      
      if (!eventsSetup.current) {
        eventsSetup.current = true;
        chatStore.setupSocketEvents();
      }
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) {
      connectionAttempted.current = false;
      eventsSetup.current = false;
      socketStore.disconnect();
      chatStore.cleanup();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      connectionAttempted.current = false;
      eventsSetup.current = false;
    };
  }, []);

  return {
    isConnected: socketStore.isConnected,
    isConnecting: socketStore.isConnecting,
    connectionError: socketStore.connectionError,
    onlineUsers: socketStore.onlineUsers,
    isUserOnline: socketStore.isUserOnline,
    getUserStatus: socketStore.getUserStatus,
    getTypingUsers: socketStore.getTypingUsers,
    startTyping: socketStore.startTyping,
    stopTyping: socketStore.stopTyping,
    joinConversation: socketStore.joinConversation,
    leaveConversation: socketStore.leaveConversation,
    sendMessage: socketStore.sendMessage,
    editMessage: socketStore.editMessage,
    deleteMessage: socketStore.deleteMessage,
    markMessagesRead: socketStore.markMessagesRead,
    addReaction: socketStore.addReaction,
    removeReaction: socketStore.removeReaction,
    updateUserStatus: socketStore.updateUserStatus,
    requestConversationInfo: socketStore.requestConversationInfo,
  };
};
