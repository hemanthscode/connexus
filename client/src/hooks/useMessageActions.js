/**
 * Message Actions Hook - OPTIMIZED WITH UTILITIES
 * Enhanced message action handlers using messageHelpers
 */
import { useState, useCallback } from 'react';
import { useChat } from './useChat';
import { messageHelpers } from '../utils/chatHelpers';
import { formatError } from '../utils/formatters';

export const useMessageActions = (message, isOwn) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);

  const {
    editMessage,
    deleteMessage,
    toggleReaction,
    setReplyToMessage,
    setMessageEditing,
    currentUser,
  } = useChat();

  // Use messageHelpers to check if message is editable
  const canEdit = messageHelpers.isMessageEditable(message, currentUser?._id);

  const handleEdit = useCallback(() => {
    if (canEdit) {
      setMessageEditing(message._id);
      setShowActions(false);
    }
  }, [message._id, setMessageEditing, canEdit]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(message._id);
      } catch (error) {
        console.error('Delete message failed:', formatError(error));
      }
    }
    setShowActions(false);
  }, [message._id, deleteMessage]);

  const handleReply = useCallback(() => {
    setReplyToMessage(message);
    setShowActions(false);
  }, [message, setReplyToMessage]);

  const handleReaction = useCallback(async (emoji) => {
    try {
      await toggleReaction(message._id, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to toggle reaction:', formatError(error));
    }
  }, [message._id, toggleReaction]);

  const handleReactionClick = useCallback(() => {
    if (message.reactions && message.reactions.length > 0) {
      setShowReactionModal(true);
    }
  }, [message.reactions]);

  // ENHANCED: Action availability checks using messageHelpers
  const actionAvailability = {
    canEdit,
    canDelete: isOwn,
    canReply: true,
    canReact: true,
    hasReactions: message.reactions && message.reactions.length > 0,
  };

  return {
    // State
    showActions,
    setShowActions,
    showEmojiPicker,
    setShowEmojiPicker,
    showReactionModal,
    setShowReactionModal,
    
    // Actions
    handleEdit,
    handleDelete,
    handleReply,
    handleReaction,
    handleReactionClick,
    
    // Action availability - NEW
    ...actionAvailability,
    
    // Message info using helpers - NEW
    messageStatus: messageHelpers.getMessageStatus(message),
    messagePreview: messageHelpers.getMessagePreview(message),
  };
};

export default useMessageActions;
