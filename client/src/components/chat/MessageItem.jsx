/**
 * Message Item - FIXED HOVER ZONE & ENHANCED EDIT MODAL
 * Action bar only activates on message bubble, improved edit experience
 */
import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, Trash2, Reply, Smile, Check, CheckCheck, 
  Info, Copy, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { messageHelpers, reactionHelpers, userHelpers } from '../../utils/chatHelpers';
import { formatChatTime } from '../../utils/formatters';
import { EMOJIS } from '../../utils/constants';
import Button from '../ui/Button';
import Modal, { ConfirmModal } from '../ui/Modal';
import Avatar from '../ui/Avatar';
import ReactionModal from './ReactionModal';
import toast from 'react-hot-toast';

// ENHANCED EDIT MODAL
const EnhancedEditModal = ({ isOpen, onClose, message, onSave }) => {
  const [content, setContent] = useState(message?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent === message?.content) return;
    
    setIsSaving(true);
    try {
      await onSave(trimmedContent);
      onClose();
      toast.success('Message updated');
    } catch (error) {
      toast.error('Failed to update message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isChanged = content.trim() !== message?.content;
  const isValid = content.trim().length > 0;
  const charCount = content.length;
  const maxChars = 2000;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Message" size="md">
      <div className="p-6">
        {/* Original Message Preview */}
        <div className="bg-white/5 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
          <p className="text-xs text-blue-300 mb-1">Original message</p>
          <p className="text-sm text-gray-300">{message?.content}</p>
        </div>

        {/* Edit Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Edit your message..."
            rows={4}
            maxLength={maxChars}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            autoFocus
          />
          
          {/* Character Count */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            <span className={charCount > maxChars * 0.9 ? 'text-yellow-400' : charCount > maxChars * 0.95 ? 'text-red-400' : ''}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-400 mt-2 flex items-center space-x-4">
          <span>Press Ctrl+Enter to save</span>
          <span>•</span>
          <span>Esc to cancel</span>
        </p>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center space-x-2">
            {isChanged && (
              <div className="flex items-center space-x-1 text-xs text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              disabled={!isValid || !isChanged || isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// OPTIMIZED: Consolidated modals using existing Modal variants
const MessageModals = ({ 
  showDelete, showInfo, showEdit, showReactions,
  onCloseDelete, onCloseInfo, onCloseEdit, onCloseReactions,
  onConfirmDelete, onSaveEdit, message, isOwn 
}) => {
  return (
    <>
      <ConfirmModal
        isOpen={showDelete}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        onCancel={onCloseDelete}
        title="Delete Message"
        type="error"
        confirmText="Delete"
        cancelText="Cancel"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Delete this message?</h3>
              <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-sm text-gray-300 truncate">{message?.content}</p>
          </div>
        </div>
      </ConfirmModal>

      <Modal isOpen={showInfo} onClose={onCloseInfo} title="Message Info" size="md">
        <div className="p-6 space-y-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Content</h4>
            <p className="text-white">{message?.content}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-400 mb-1">Sent</h4>
              <p className="text-sm text-white">{formatChatTime(message?.createdAt, { full: true })}</p>
            </div>
            
            {message?.editedAt && (
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-400 mb-1">Edited</h4>
                <p className="text-sm text-white">{formatChatTime(message.editedAt, { full: true })}</p>
              </div>
            )}
            
            {isOwn && (
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-400 mb-1">Status</h4>
                <p className="text-sm text-white capitalize">{messageHelpers.getMessageStatus(message)}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <EnhancedEditModal
        isOpen={showEdit}
        onClose={onCloseEdit}
        message={message}
        onSave={onSaveEdit}
      />

      <ReactionModal
        isOpen={showReactions}
        onClose={onCloseReactions}
        message={message}
        reactions={message?.reactions || []}
      />
    </>
  );
};

// OPTIMIZED: Consolidated quick reactions using Button component
const QuickReactions = ({ onReact, isOwn }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} bg-gray-900/95 backdrop-blur border border-white/20 rounded-full px-2 py-1 flex space-x-1 shadow-lg z-30`}
  >
    {EMOJIS.REACTIONS.slice(0, 5).map((emoji) => (
      <Button
        key={emoji}
        variant="ghost"
        size="xs"
        onClick={() => onReact(emoji)}
        className="w-8 h-8 text-sm hover:scale-110"
      >
        {emoji}
      </Button>
    ))}
  </motion.div>
);

const MessageItem = ({ message, isGrouped, isOwn, showSenderName, onScrollToMessage }) => {
  const [showActions, setShowActions] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  
  const { user } = useAuth();
  const { editMessage, deleteMessage, toggleReaction, setReplyToMessage } = useChat();

  const handleReaction = (emoji) => {
    toggleReaction(message._id, emoji);
    setShowQuickReactions(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied');
  };

  const canEdit = isOwn && !message.isDeleted;
  const canDelete = isOwn && !message.isDeleted;

  // OPTIMIZED: Consolidated status icon logic
  const getStatusIcon = () => {
    if (!isOwn) return null;
    const status = messageHelpers.getMessageStatus(message);
    const statusIcons = {
      sending: <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />,
      sent: <Check className="w-3 h-3 text-gray-400" />,
      delivered: <CheckCheck className="w-3 h-3 text-gray-400" />,
      read: <CheckCheck className="w-3 h-3 text-blue-400" />,
      failed: <div className="w-3 h-3 bg-red-500 rounded-full" />
    };
    return statusIcons[status];
  };

  // OPTIMIZED: Consolidated reactions using Button components
  const ReactionsBar = () => {
    if (!message.reactions?.length) return null;
    const grouped = reactionHelpers.groupReactionsByEmoji(message.reactions);
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(grouped).map(([emoji, reactions]) => {
          const hasReacted = reactionHelpers.hasUserReacted(reactions, user?._id);
          const count = reactions.length;
          
          return (
            <Button
              key={emoji}
              variant={hasReacted ? "primary" : "ghost"}
              size="xs"
              onClick={() => setShowReactionModal(true)}
              className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs ${
                hasReacted ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'
              }`}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </Button>
          );
        })}
      </div>
    );
  };

  // OPTIMIZED: Consolidated action buttons
  const actionButtons = [
    { icon: Smile, action: () => setShowQuickReactions(!showQuickReactions), title: "React" },
    { icon: Reply, action: () => setReplyToMessage(message), title: "Reply" },
    { icon: Copy, action: handleCopy, title: "Copy" },
    { icon: Info, action: () => setShowInfoModal(true), title: "Message info" },
    ...(canEdit ? [{ icon: Edit, action: () => setShowEditModal(true), title: "Edit", variant: "warning" }] : []),
    ...(canDelete ? [{ icon: Trash2, action: () => setShowDeleteModal(true), title: "Delete", variant: "danger" }] : [])
  ];

  if (message.isDeleted) {
    return (
      <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="flex items-center space-x-2 px-3 py-2 bg-white/5 rounded-lg max-w-sm">
          <Trash2 className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500 italic text-sm">This message was deleted</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* FIXED: Removed hover events from outer container */}
      <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}>
        <div className={`flex items-end space-x-2 max-w-md relative ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          
          {/* FIXED: Consistent Avatar usage */}
          {!isOwn && !isGrouped && showSenderName && (
            <Avatar
              src={message.sender?.avatar}
              name={message.sender?.name}
              size="sm"
              className="mb-1"
            />
          )}

          {/* FIXED: Hover events moved to message bubble only */}
          <div 
            className="relative group"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
              setShowActions(false);
              setShowQuickReactions(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative px-3 py-2 rounded-2xl break-words ${
                isOwn 
                  ? 'bg-blue-600 text-white rounded-br-md' 
                  : 'bg-white/10 text-white rounded-bl-md'
              } ${isGrouped && isOwn ? 'rounded-tr-2xl' : ''} ${isGrouped && !isOwn ? 'rounded-tl-2xl' : ''}`}
            >
              {/* Reply indicator */}
              {message.replyTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onScrollToMessage?.(message.replyTo._id)}
                  className="w-full mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-blue-400 hover:bg-black/30 justify-start"
                >
                  <div className="text-left">
                    <p className="text-xs text-blue-300 font-medium">
                      {userHelpers.getUserDetails(message.replyTo.sender).name}
                    </p>
                    <p className="text-xs text-gray-200 truncate">
                      {messageHelpers.getMessagePreview(message.replyTo)}
                    </p>
                  </div>
                </Button>
              )}

              {showSenderName && !isOwn && (
                <p className="text-xs text-blue-200 mb-1 font-medium">
                  {userHelpers.getUserDetails(message.sender).name}
                </p>
              )}

              <p className={`text-sm leading-relaxed ${message.isOptimistic ? 'opacity-70' : ''}`}>
                {message.content}
              </p>

              <div className={`flex items-center justify-between mt-1 space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-300/80">
                    {formatChatTime(message.createdAt)}
                  </span>
                  {message.editedAt && (
                    <span className="text-xs text-gray-300/60">• edited</span>
                  )}
                </div>
                {getStatusIcon()}
              </div>
            </motion.div>

            <ReactionsBar />

            {/* FIXED: Action Bar positioned relative to message bubble */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg px-1 py-1 flex items-center space-x-1 shadow-lg z-20`}
                >
                  {actionButtons.map(({ icon: Icon, action, title, variant }) => (
                    <Button
                      key={title}
                      variant="ghost"
                      size="xs"
                      onClick={action}
                      className={`p-1.5 ${
                        variant === 'warning' ? 'hover:bg-yellow-500/20' :
                        variant === 'danger' ? 'hover:bg-red-500/20' : 'hover:bg-white/20'
                      }`}
                      title={title}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showQuickReactions && (
                <QuickReactions onReact={handleReaction} isOwn={isOwn} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <MessageModals
        showDelete={showDeleteModal}
        showInfo={showInfoModal}
        showEdit={showEditModal}
        showReactions={showReactionModal}
        onCloseDelete={() => setShowDeleteModal(false)}
        onCloseInfo={() => setShowInfoModal(false)}
        onCloseEdit={() => setShowEditModal(false)}
        onCloseReactions={() => setShowReactionModal(false)}
        onConfirmDelete={() => {
          deleteMessage(message._id);
          setShowDeleteModal(false);
        }}
        onSaveEdit={(content) => editMessage(message._id, content)}
        message={message}
        isOwn={isOwn}
      />
    </>
  );
};

export default memo(MessageItem);
