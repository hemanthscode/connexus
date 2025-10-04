/**
 * Conversation Info Hook
 * Centralized conversation data extraction and formatting
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';

export const useConversationInfo = (conversation) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const conversationInfo = useMemo(() => {
    if (!conversation) {
      return {
        name: 'Select a conversation',
        avatar: null,
        isOnline: false,
        otherParticipant: null,
        status: 'Unknown',
        type: null,
      };
    }

    // Group conversation
    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Group Chat',
        avatar: conversation.avatar,
        isOnline: false,
        otherParticipant: null,
        status: `${conversation.participants?.length || 0} members`,
        type: 'group',
      };
    }

    // Direct conversation
    const otherParticipant = conversation.participants?.find(
      p => p.user?._id !== user?._id
    );

    const isOnline = otherParticipant ? isUserOnline(otherParticipant.user._id) : false;

    return {
      name: otherParticipant?.user?.name || 'Unknown User',
      avatar: otherParticipant?.user?.avatar,
      isOnline,
      otherParticipant,
      status: isOnline ? 'Online' : 'Offline',
      type: 'direct',
    };
  }, [conversation, user, isUserOnline]);

  const getLastMessagePreview = useMemo(() => {
    if (!conversation?.lastMessage?.content) return 'No messages yet';
    
    const content = conversation.lastMessage.content;
    const isOwn = conversation.lastMessage.sender?._id === user?._id;
    
    return isOwn ? `You: ${content}` : content;
  }, [conversation?.lastMessage, user]);

  return {
    ...conversationInfo,
    getLastMessagePreview,
  };
};

export default useConversationInfo;
