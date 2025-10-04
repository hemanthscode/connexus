/**
 * Message Actions Hook
 * Centralized message action handlers
 */

import { useState, useCallback } from 'react';
import { useChat } from './useChat';

export const useMessageActions = (message, isOwn) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);

  const { 
    editMessage, 
    deleteMessage, 
    toggleReaction, 
    setReplyToMessage,
    setMessageEditing
  } = useChat();

  const handleEdit = useCallback(() => {
    setMessageEditing(message._id);
    setShowActions(false);
  }, [message._id, setMessageEditing]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(message._id);
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
      console.error('Failed to toggle reaction:', error);
    }
  }, [message._id, toggleReaction]);

  const handleReactionClick = useCallback(() => {
    if (message.reactions && message.reactions.length > 0) {
      setShowReactionModal(true);
    }
  }, [message.reactions]);

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
  };
};

export default useMessageActions;
