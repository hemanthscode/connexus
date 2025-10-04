import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Reply, 
  Smile,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import ReactionModal from './ReactionModal';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🙏'];

const MessageItem = ({ message, isGrouped, isOwn, isHighlighted, onScrollToMessage }) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const { user } = useAuth();
  const { 
    editMessage, 
    deleteMessage, 
    toggleReaction, 
    setReplyToMessage,
    messageEditingId,
    setMessageEditing
  } = useChat();
  
  const editInputRef = useRef(null);

  // Update edit content when message changes (for real-time updates)
  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  useEffect(() => {
    if (messageEditingId === message._id) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [messageEditingId, message._id]);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setMessageEditing(message._id);
    setEditContent(message.content);
    setShowActions(false);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message._id, editContent.trim());
    }
    setMessageEditing(null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setMessageEditing(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(message._id);
    }
    setShowActions(false);
  };

  const handleReply = () => {
    setReplyToMessage(message);
    setShowActions(false);
  };

  // FIXED: Handle click on reply indicator to scroll to original message
  const handleReplyClick = () => {
    if (message.replyTo?._id && onScrollToMessage) {
      onScrollToMessage(message.replyTo._id);
    }
  };

  // Enhanced reaction handling with optimistic updates
  const handleReaction = async (emoji) => {
    try {
      await toggleReaction(message._id, emoji);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  // Handle reaction bubble click to show modal
  const handleReactionClick = () => {
    if (message.reactions && message.reactions.length > 0) {
      setShowReactionModal(true);
    }
  };

  const getMessageStatus = () => {
    if (message.isOptimistic) return 'sending';
    if (message.status === 'failed') return 'failed';
    if (message.readBy?.length > 0) return 'read';
    return message.status || 'sent';
  };

  // ENHANCED: Better reaction rendering with proper user details
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((groups, reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction);
      return groups;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <AnimatePresence>
          {Object.entries(reactionGroups).map(([emoji, reactions]) => {
            const hasUserReacted = reactions.some(r => {
              // Handle both populated and non-populated user data
              const userId = r.user?._id || r.user;
              return userId === user?._id;
            });
            
            return (
              <motion.button
                key={emoji}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReactionClick}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleReaction(emoji);
                }}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer ${
                  hasUserReacted 
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30 shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-transparent'
                }`}
                title={`Click to see who reacted • Right-click to ${hasUserReacted ? 'remove' : 'add'} your reaction`}
              >
                <span>{emoji}</span>
                <motion.span
                  key={reactions.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="font-medium"
                >
                  {reactions.length}
                </motion.span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  const renderMessageStatus = () => {
    if (!isOwn) return null;
    
    const status = getMessageStatus();
    
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  if (message.isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div className="max-w-xs lg:max-w-md px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-gray-500 italic text-sm">This message was deleted</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key={message._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
        }}
        exit={{ opacity: 0, y: -20 }}
        layout
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'} transition-all duration-500 rounded-lg ${
          isHighlighted ? 'ring-2 ring-blue-400/50' : ''
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        data-message-id={message._id} // For scrolling reference
      >
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 ${isOwn ? 'space-x-reverse' : ''} max-w-xs lg:max-w-md`}>
          {/* Avatar */}
          {!isOwn && !isGrouped && (
            <div className="flex-shrink-0">
              {message.sender?.avatar ? (
                <img 
                  src={message.sender.avatar} 
                  alt={message.sender.name} 
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">
                    {getInitials(message.sender?.name || 'U')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Message Bubble */}
          <div className="relative group">
            {/* Actions */}
            <AnimatePresence>
              {showActions && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute top-0 z-10 flex items-center space-x-1 ${
                    isOwn ? '-left-20' : '-right-20'
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                  >
                    <Smile className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReply}
                    className="p-1 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                  {isOwn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="p-1 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                  {isOwn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="p-1 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className={`absolute z-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-2 flex space-x-1 shadow-xl ${
                    isOwn ? '-left-4 top-8' : '-right-4 top-8'
                  }`}
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleReaction(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <span className="text-lg">{emoji}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Content */}
            <div className={`relative px-4 py-2 rounded-2xl transition-all duration-200 ${
              isOwn 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                : 'bg-white/10 text-white'
            } ${isGrouped ? 'rounded-tl-md' : ''}`}>
              
              {/* FIXED: Clickable Reply indicator */}
              {message.replyTo && (
                <motion.div 
                  className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-blue-400 cursor-pointer hover:bg-black/30 transition-colors"
                  onClick={handleReplyClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Click to jump to replied message"
                >
                  <p className="text-xs text-gray-300 mb-1">
                    Replying to {message.replyTo.sender?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-200 truncate">
                    {message.replyTo.content}
                  </p>
                </motion.div>
              )}

              {/* Sender name for group chats */}
              {!isOwn && !isGrouped && (
                <p className="text-xs text-blue-300 mb-1 font-medium">
                  {message.sender?.name || 'Unknown'}
                </p>
              )}

              {/* Message content or edit input */}
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="w-full bg-transparent border-none outline-none text-white placeholder-gray-300"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <motion.p 
                    key={message.content}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: message.isOptimistic ? 0.7 : 1 }}
                    className="transition-opacity duration-200"
                  >
                    {message.content}
                  </motion.p>
                  
                  {/* Edit indicator */}
                  <AnimatePresence>
                    {message.editedAt && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-400 mt-1 italic"
                      >
                        edited
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Timestamp and status */}
                  <div className={`flex items-center justify-between mt-1 space-x-2 ${
                    isOwn ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <span className="text-xs text-gray-400">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </span>
                    <motion.div
                      key={getMessageStatus()}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      {renderMessageStatus()}
                    </motion.div>
                  </div>
                </>
              )}
            </div>

            {/* Reactions */}
            {renderReactions()}
          </div>
        </div>
      </motion.div>

      {/* Reaction Modal */}
      <ReactionModal
        isOpen={showReactionModal}
        onClose={() => setShowReactionModal(false)}
        message={message}
        reactions={message.reactions || []}
      />
    </>
  );
};

export default MessageItem;
