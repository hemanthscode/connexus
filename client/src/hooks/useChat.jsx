import { useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import { useSocket } from './useSocket';

export const useChat = () => {
  const { user } = useAuthStore();
  const chatStore = useChatStore();
  const socket = useSocket();
  
  const userSetRef = useRef(false);
  const conversationsLoadedRef = useRef(false);
  const messagesLoadedRef = useRef(new Set());

  useEffect(() => {
    if (user && !userSetRef.current) {
      console.log('👤 Setting current user in chat store:', user.name);
      chatStore.setCurrentUser(user);
      userSetRef.current = true;
    }
  }, [user?._id]);

  useEffect(() => {
    if (socket.isConnected && !conversationsLoadedRef.current) {
      console.log('📋 Loading conversations...');
      conversationsLoadedRef.current = true;
      chatStore.loadConversations();
    }
  }, [socket.isConnected]);

  useEffect(() => {
    const activeId = chatStore.activeConversationId;
    
    if (activeId && !messagesLoadedRef.current.has(activeId)) {
      console.log('💬 Loading messages for conversation:', activeId);
      messagesLoadedRef.current.add(activeId);
      chatStore.loadMessages(activeId);
    }
  }, [chatStore.activeConversationId]);

  useEffect(() => {
    return () => {
      if (!user) {
        userSetRef.current = false;
        conversationsLoadedRef.current = false;
        messagesLoadedRef.current.clear();
      }
    };
  }, [user]);

  return {
    conversations: chatStore.conversations,
    messages: chatStore.messages.get(chatStore.activeConversationId) || [],
    activeConversationId: chatStore.activeConversationId,
    isLoading: chatStore.isLoading,
    error: chatStore.error,
    currentUser: chatStore.currentUser,
    messageEditingId: chatStore.messageEditingId,
    replyToMessage: chatStore.replyToMessage,
    searchResults: chatStore.searchResults,
    setActiveConversation: chatStore.setActiveConversation,
    loadConversations: chatStore.loadConversations,
    loadMessages: chatStore.loadMessages,
    sendMessage: chatStore.sendMessage,
    editMessage: chatStore.editMessage,
    deleteMessage: chatStore.deleteMessage,
    toggleReaction: chatStore.toggleReaction,
    searchUsers: chatStore.searchUsers,
    createDirectConversation: chatStore.createDirectConversation,
    setMessageEditing: chatStore.setMessageEditing,
    setReplyToMessage: chatStore.setReplyToMessage,
    clearReplyToMessage: chatStore.clearReplyToMessage,
  };
};
