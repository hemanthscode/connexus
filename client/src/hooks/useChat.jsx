import { useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { useSocket } from './useSocket';

export const useChat = () => {
  const { user } = useAuthStore();
  const socket = useSocket();
  
  // FIXED: Subscribe to all relevant store state
  const {
    conversations,
    messages,
    activeConversationId,
    temporaryConversation,
    isLoading,
    error,
    currentUser,
    messageEditingId,
    replyToMessage,
    searchResults,
    unreadCounts,
    _updateCounter, // FIXED: Subscribe to update counter
    // Actions
    setCurrentUser,
    setActiveConversation,
    setTemporaryConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    searchUsers,
    setMessageEditing,
    setReplyToMessage,
    clearReplyToMessage,
    getUnreadCount,
    markConversationAsRead,
    getCurrentConversation,
    getCurrentConversationId,
    setupSocketEvents
  } = useChatStore();

  const userSetRef = useRef(false);
  const conversationsLoadedRef = useRef(false);
  const messagesLoadedRef = useRef(new Set());
  const socketEventsSetupRef = useRef(false);

  // Setup socket events once
  useEffect(() => {
    if (socket.isConnected && !socketEventsSetupRef.current) {
      console.log('🔌 Setting up socket events...');
      setupSocketEvents();
      socketEventsSetupRef.current = true;
    }
  }, [socket.isConnected, setupSocketEvents]);

  useEffect(() => {
    if (user && !userSetRef.current) {
      console.log('👤 Setting current user in chat store:', user.name);
      setCurrentUser(user);
      userSetRef.current = true;
    }
  }, [user?._id, setCurrentUser]);

  useEffect(() => {
    if (socket.isConnected && !conversationsLoadedRef.current) {
      console.log('📋 Loading conversations...');
      conversationsLoadedRef.current = true;
      loadConversations();
    }
  }, [socket.isConnected, loadConversations]);

  useEffect(() => {
    if (activeConversationId && !messagesLoadedRef.current.has(activeConversationId)) {
      console.log('💬 Loading messages for conversation:', activeConversationId);
      messagesLoadedRef.current.add(activeConversationId);
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    return () => {
      if (!user) {
        userSetRef.current = false;
        conversationsLoadedRef.current = false;
        messagesLoadedRef.current.clear();
        socketEventsSetupRef.current = false;
      }
    };
  }, [user]);

  // FIXED: Get current conversation messages
  const currentConversationId = getCurrentConversationId();
  const currentMessages = messages.get(currentConversationId) || [];

  return {
    conversations,
    messages: currentMessages, // FIXED: Return current conversation messages
    activeConversationId,
    temporaryConversation,
    currentConversation: getCurrentConversation(),
    currentConversationId,
    isLoading,
    error,
    currentUser,
    messageEditingId,
    replyToMessage,
    searchResults,
    unreadCounts, // FIXED: Expose unread counts
    // Actions
    setActiveConversation,
    setTemporaryConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    searchUsers,
    setMessageEditing,
    setReplyToMessage,
    clearReplyToMessage,
    getUnreadCount,
    markConversationAsRead,
  };
};
