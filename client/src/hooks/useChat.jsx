/**
 * Chat Hook - ENHANCED GROUP COORDINATION
 * Simplified without direct store access
 */

import { useEffect, useRef, useCallback } from 'react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';

export const useChat = () => {
  const { user } = useAuthStore();
  const { isConnected } = useSocketStore();
  
  const chatStore = useChatStore();
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
    
    // Basic Actions
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
    setupSocketEvents,
    updateConversation,
    
    // GROUP METHODS - ALL ENHANCED
    createGroup,
    updateGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    changeParticipantRole,
    leaveGroup,
    deleteGroup,
  } = chatStore;

  // Track initialization to prevent duplicate calls
  const initialized = useRef({
    user: false,
    conversations: false,
    socketEvents: false,
  });

  const loadedMessages = useRef(new Set());

  // Set current user when authenticated
  useEffect(() => {
    if (user && !initialized.current.user) {
      setCurrentUser(user);
      initialized.current.user = true;
    } else if (!user) {
      initialized.current.user = false;
      loadedMessages.current.clear();
    }
  }, [user?._id, setCurrentUser]);

  // Setup socket events when connected
  useEffect(() => {
    if (isConnected && !initialized.current.socketEvents) {
      setupSocketEvents();
      initialized.current.socketEvents = true;
    } else if (!isConnected) {
      initialized.current.socketEvents = false;
    }
  }, [isConnected, setupSocketEvents]);

  // Load conversations when socket connected
  useEffect(() => {
    if (isConnected && !initialized.current.conversations) {
      loadConversations();
      initialized.current.conversations = true;
    } else if (!isConnected) {
      initialized.current.conversations = false;
      loadedMessages.current.clear();
    }
  }, [isConnected, loadConversations]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversationId && !activeConversationId.startsWith('temp_')) {
      if (!loadedMessages.current.has(activeConversationId)) {
        const existingMessages = messages.get(activeConversationId);
        if (!existingMessages || existingMessages.length === 0) {
          loadedMessages.current.add(activeConversationId);
          loadMessages(activeConversationId).catch(error => {
            console.warn('Failed to load messages for', activeConversationId, error.message);
          });
        }
      }
    }
  }, [activeConversationId]);

  // SIMPLIFIED: Group creation with automatic conversation switching
  const enhancedCreateGroup = useCallback(async (groupData) => {
    try {
      const newGroup = await createGroup(groupData);
      
      // Mark as loaded to prevent duplicate loading
      loadedMessages.current.add(newGroup._id);
      
      // Auto-switch to the new group after a short delay
      setTimeout(() => {
        setActiveConversation(newGroup._id);
      }, 500);
      
      return newGroup;
    } catch (error) {
      console.error('Enhanced createGroup failed:', error);
      throw error;
    }
  }, [createGroup, setActiveConversation]);

  // ENHANCED: Group deletion with conversation cleanup
  const enhancedDeleteGroup = useCallback(async (groupId) => {
    try {
      // Switch to no conversation if deleting current one
      if (activeConversationId === groupId) {
        setActiveConversation(null);
      }
      
      await deleteGroup(groupId);
      
      // Clear from loaded messages
      loadedMessages.current.delete(groupId);
      
    } catch (error) {
      console.error('Enhanced deleteGroup failed:', error);
      throw error;
    }
  }, [deleteGroup, activeConversationId, setActiveConversation]);

  // ENHANCED: Leave group with conversation cleanup
  const enhancedLeaveGroup = useCallback(async (groupId) => {
    try {
      // Switch to no conversation if leaving current one
      if (activeConversationId === groupId) {
        setActiveConversation(null);
      }
      
      await leaveGroup(groupId);
      
      // Clear from loaded messages
      loadedMessages.current.delete(groupId);
      
    } catch (error) {
      console.error('Enhanced leaveGroup failed:', error);
      throw error;
    }
  }, [leaveGroup, activeConversationId, setActiveConversation]);

  // Get current conversation data
  const currentConversationId = getCurrentConversationId();
  const currentConversation = getCurrentConversation();
  const currentMessages = messages.get(currentConversationId) || [];

  // Enhanced actions with group coordination
  const chatActions = {
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
    updateConversation,
    
    // ENHANCED GROUP METHODS with proper coordination
    createGroup: enhancedCreateGroup,
    updateGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    changeParticipantRole,
    leaveGroup: enhancedLeaveGroup,
    deleteGroup: enhancedDeleteGroup,
    
    // Convenience methods
    sendTextMessage: (content, replyTo = null) => {
      if (currentConversationId && content?.trim()) {
        return sendMessage(currentConversationId, content.trim(), 'text', replyTo);
      }
    },
    
    getConversationById: (id) => {
      return conversations.find(c => c._id === id);
    },
    
    isActiveConversation: (id) => {
      return activeConversationId === id;
    },

    // GROUP UTILITY METHODS
    isGroupAdmin: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      return group?.participants?.find(p => p.user._id === userId)?.role === 'admin';
    },
    
    isGroupMember: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      return group?.participants?.some(p => p.user._id === userId);
    },
    
    getGroupParticipants: (groupId) => {
      const group = conversations.find(c => c._id === groupId);
      return group?.participants || [];
    },
    
    canManageGroup: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      const userRole = group?.participants?.find(p => p.user._id === userId)?.role;
      return userRole === 'admin' || userRole === 'moderator';
    },
  };

  return {
    // State
    conversations,
    messages: currentMessages,
    allMessages: messages,
    activeConversationId,
    temporaryConversation,
    currentConversation,
    currentConversationId,
    isLoading,
    error,
    currentUser,
    messageEditingId,
    replyToMessage,
    searchResults,
    unreadCounts,
    
    // Actions
    ...chatActions,
  };
};

export default useChat;
