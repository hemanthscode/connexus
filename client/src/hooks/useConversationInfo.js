/**
 * Conversation Info Hook - OPTIMAL
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import { conversationHelpers, userHelpers, messageHelpers } from '../utils/chatHelpers';

export const useConversationInfo = (conversation) => {
  const { user } = useAuth();
  const { isUserOnline, getTypingUsers } = useSocket();

  const info = useMemo(() => {
    if (!conversation) {
      return { name: 'Select a conversation', avatar: null, isOnline: false, status: 'Unknown', type: null, userId: null };
    }

    const name = conversationHelpers.getConversationName(conversation, user?._id);
    const avatar = conversationHelpers.getConversationAvatar(conversation, user?._id);

    if (conversation.type === 'group') {
      const typingUsers = getTypingUsers(conversation._id);
      return {
        name, avatar, isOnline: false, type: 'group', userId: null,
        status: typingUsers.length > 0 ? `${typingUsers.length} typing...` : `${conversation.participants?.length || 0} members`,
      };
    }

    const otherParticipant = conversation.participants?.find(p => !userHelpers.isSameUser(p.user, user));
    const otherUser = userHelpers.getUserDetails(otherParticipant?.user);
    const isOnline = isUserOnline(otherUser._id);
    const isTyping = getTypingUsers(conversation._id).some(u => userHelpers.isSameUser(u, { _id: otherUser._id }));

    return {
      name: otherUser.name,
      avatar: otherUser.avatar,
      isOnline,
      status: isTyping ? 'typing...' : (isOnline ? 'Online' : 'Offline'),
      type: 'direct',
      userId: otherUser._id,
    };
  }, [conversation, user, isUserOnline, getTypingUsers]);

  const getLastMessagePreview = useMemo(() => {
    if (!conversation?.lastMessage?.content) return 'No messages yet';
    const preview = messageHelpers.getMessagePreview(conversation.lastMessage);
    const isOwn = userHelpers.isSameUser(conversation.lastMessage.sender, user);
    return isOwn ? `You: ${preview}` : preview;
  }, [conversation?.lastMessage, user]);

  return { ...info, getLastMessagePreview };
};

export default useConversationInfo;
