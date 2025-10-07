/**
 * Chat Hook - OPTIMIZED WITH UTILITIES
 * Enhanced group coordination with utility functions
 */
import { useEffect, useRef, useCallback } from 'react';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import { 
  conversationHelpers, 
  messageHelpers, 
  permissionHelpers 
} from '../utils/chatHelpers';
import { MESSAGE_TYPES } from '../utils/constants';

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
    
    // GROUP METHODS
    createGroup,
    updateGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    changeParticipantRole,
    leaveGroup,
    deleteGroup,
    
    // NEW: Utility methods from store
    canPerformGroupAction,
    getUserRole,
    getConversationDisplayName,
    getConversationAvatar,
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

  // ENHANCED: Group creation with automatic conversation switching
  const enhancedCreateGroup = useCallback(async (groupData) => {
    try {
      const newGroup = await createGroup(groupData);
      
      loadedMessages.current.add(newGroup._id);
      
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
      if (activeConversationId === groupId) {
        setActiveConversation(null);
      }
      
      await deleteGroup(groupId);
      loadedMessages.current.delete(groupId);
      
    } catch (error) {
      console.error('Enhanced deleteGroup failed:', error);
      throw error;
    }
  }, [deleteGroup, activeConversationId, setActiveConversation]);

  // ENHANCED: Leave group with conversation cleanup
  const enhancedLeaveGroup = useCallback(async (groupId) => {
    try {
      if (activeConversationId === groupId) {
        setActiveConversation(null);
      }
      
      await leaveGroup(groupId);
      loadedMessages.current.delete(groupId);
      
    } catch (error) {
      console.error('Enhanced leaveGroup failed:', error);
      throw error;
    }
  }, [leaveGroup, activeConversationId, setActiveConversation]);

  // Get current conversation data using helpers
  const currentConversationId = getCurrentConversationId();
  const currentConversation = getCurrentConversation();
  const currentMessages = messages.get(currentConversationId) || [];

  // Enhanced actions with group coordination and utilities
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
    
    // ENHANCED GROUP METHODS
    createGroup: enhancedCreateGroup,
    updateGroup,
    updateGroupInfo,
    addGroupParticipants,
    removeGroupParticipant,
    changeParticipantRole,
    leaveGroup: enhancedLeaveGroup,
    deleteGroup: enhancedDeleteGroup,
    
    // UTILITY METHODS - ENHANCED WITH HELPERS
    sendTextMessage: (content, replyTo = null) => {
      if (currentConversationId && content?.trim()) {
        return sendMessage(currentConversationId, content.trim(), MESSAGE_TYPES.TEXT, replyTo);
      }
    },
    
    getConversationById: (id) => {
      return conversations.find(c => c._id === id);
    },
    
    // Use conversationHelpers for consistent checking
    isActiveConversation: (id) => {
      return conversationHelpers.isConversationActive(id, activeConversationId, temporaryConversation);
    },
    
    // GROUP UTILITY METHODS - ENHANCED WITH PERMISSION HELPERS
    isGroupAdmin: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      return permissionHelpers.hasGroupPermission(group, userId, 'admin');
    },
    
    isGroupMember: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      return permissionHelpers.hasGroupPermission(group, userId, 'member');
    },
    
    getGroupParticipants: (groupId) => {
      const group = conversations.find(c => c._id === groupId);
      return group?.participants || [];
    },
    
    canManageGroup: (groupId, userId = user?._id) => {
      const group = conversations.find(c => c._id === groupId);
      return permissionHelpers.hasGroupPermission(group, userId, 'moderate');
    },
    
    // NEW: Use store utility methods
    canPerformAction: (groupId, action) => {
      return canPerformGroupAction(groupId, action);
    },
    
    getUserGroupRole: (groupId) => {
      return getUserRole(groupId);
    },
    
    // Use conversationHelpers for display
    getDisplayName: (conversationId) => {
      return getConversationDisplayName ? getConversationDisplayName(conversationId) : 
        conversationHelpers.getConversationName(
          conversations.find(c => c._id === conversationId), 
          user?._id
        );
    },
    
    getAvatar: (conversationId) => {
      return getConversationAvatar ? getConversationAvatar(conversationId) :
        conversationHelpers.getConversationAvatar(
          conversations.find(c => c._id === conversationId), 
          user?._id
        );
    },
    
    // Use messageHelpers for message operations
    canEditMessage: (message) => {
      return messageHelpers.isMessageEditable(message, user?._id);
    },
    
    getMessagePreview: (message) => {
      return messageHelpers.getMessagePreview(message);
    },
    
    shouldGroupMessage: (currentMsg, previousMsg) => {
      return messageHelpers.shouldGroupMessages(currentMsg, previousMsg);
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
