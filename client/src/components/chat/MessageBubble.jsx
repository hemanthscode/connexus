import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MoreVertical, 
  Reply, 
  Edit3, 
  Trash2, 
  Copy, 
  Forward,
  Pin,
  Star,
  Download,
  Eye,
  Clock,
  Check,
  CheckCheck,
  AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown.jsx'
import MessageReactions from './MessageReactions.jsx'
import MessageEditor from './MessageEditor.jsx'
import { InlineReplyPreview } from './ReplyPreview.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useMessageOperations } from '@/hooks/useChat.jsx'
import { formatMessageTime } from '@/utils/formatters.js'
import { copyToClipboard, formatFileSize } from '@/utils/helpers.js'
import { MESSAGE_STATUS } from '@/utils/constants.js'
import { useToast } from '../ui/Toast.jsx'

const MessageBubble = ({
  message,
  conversationId,
  showAvatar = true,
  showName = true,
  isGrouped = false,
  isSelected = false,
  onSelect,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
  className = '',
  ...props
}) => {
  const { user } = useAuth()
  const { 
    canEditMessage, 
    canDeleteMessage, 
    deleteMessage, 
    toggleReaction 
  } = useMessageOperations(conversationId)
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [showFullTime, setShowFullTime] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const messageRef = useRef(null)

  const isOwnMessage = message.sender._id === user?._id
  const canEdit = canEditMessage(message)
  const canDelete = canDeleteMessage(message)

  // Handle message actions
  const handleReply = useCallback(() => {
    onReply?.(message)
  }, [message, onReply])

  const handleEdit = useCallback(() => {
    if (canEdit) {
      setIsEditing(true)
      onEdit?.(message)
    }
  }, [canEdit, message, onEdit])

  const handleDelete = useCallback(async () => {
    if (!canDelete) return
    
    const confirmed = window.confirm('Are you sure you want to delete this message?')
    if (confirmed) {
      const result = await deleteMessage(message._id)
      if (result.success) {
        onDelete?.(message)
      }
    }
  }, [canDelete, message, deleteMessage, onDelete])

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(message.content)
    if (success) {
      toast.success('Message copied to clipboard')
    } else {
      toast.error('Failed to copy message')
    }
  }, [message.content, toast])

  const handlePin = useCallback(() => {
    onPin?.(message)
  }, [message, onPin])

  const handleForward = useCallback(() => {
    onForward?.(message)
  }, [message, onForward])

  const handleSelect = useCallback(() => {
    onSelect?.(message._id)
  }, [message._id, onSelect])

  // Get message status icon
  const getStatusIcon = () => {
    if (!isOwnMessage) return null

    switch (message.status) {
      case MESSAGE_STATUS.SENDING:
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
      case MESSAGE_STATUS.SENT:
        return <Check className="w-3 h-3 text-gray-400" />
      case MESSAGE_STATUS.DELIVERED:
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case MESSAGE_STATUS.READ:
        return <CheckCheck className="w-3 h-3 text-cyan-400" />
      case MESSAGE_STATUS.FAILED:
        return <AlertCircle className="w-3 h-3 text-red-400" />
      default:
        return null
    }
  }

  // Render attachment
  const renderAttachment = (attachment, index) => {
    const isImage = attachment.type?.startsWith('image/')
    const isVideo = attachment.type?.startsWith('video/')
    const isAudio = attachment.type?.startsWith('audio/')

    if (isImage) {
      return (
        <div key={index} className="relative rounded-lg overflow-hidden max-w-sm">
          {!imageError ? (
            <motion.img
              src={attachment.url}
              alt={attachment.name}
              className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onError={() => setImageError(true)}
              onClick={() => {/* Open image viewer */}}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <div className="w-full h-32 bg-gray-700 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Eye className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Image failed to load</p>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (isVideo) {
      return (
        <div key={index} className="relative rounded-lg overflow-hidden max-w-sm">
          <video
            src={attachment.url}
            controls
            className="w-full h-auto rounded-lg"
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
        </div>
      )
    }

    if (isAudio) {
      return (
        <div key={index} className="glass rounded-lg p-3 max-w-sm">
          <audio
            src={attachment.url}
            controls
            className="w-full"
          >
            Your browser does not support audio playback.
          </audio>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
            <span>{attachment.name}</span>
            <span>{formatFileSize(attachment.size)}</span>
          </div>
        </div>
      )
    }

    // Generic file
    return (
      <div key={index} className="glass rounded-lg p-3 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {attachment.name}
            </p>
            <p className="text-xs text-gray-400">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(attachment.url, '_blank')}
            className="w-8 h-8"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const messageMenuItems = [
    {
      label: 'Reply',
      icon: <Reply className="w-4 h-4" />,
      onClick: handleReply,
    },
    ...(canEdit ? [{
      label: 'Edit',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: handleEdit,
    }] : []),
    {
      label: 'Copy',
      icon: <Copy className="w-4 h-4" />,
      onClick: handleCopy,
      disabled: !message.content,
    },
    {
      label: 'Forward',
      icon: <Forward className="w-4 h-4" />,
      onClick: handleForward,
    },
    {
      label: 'Pin',
      icon: <Pin className="w-4 h-4" />,
      onClick: handlePin,
    },
    {
      label: 'Star',
      icon: <Star className="w-4 h-4" />,
      onClick: () => {/* Handle star */},
    },
    { type: 'separator' },
    ...(canDelete ? [{
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: 'danger',
    }] : []),
  ]

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-message-id={message._id}
      className={clsx(
        'flex gap-3 mb-4 group relative',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
        isGrouped && 'mb-1',
        isSelected && 'bg-cyan-500/10 rounded-lg p-2 -m-2',
        className
      )}
      {...props}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute -left-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 rounded border-gray-600 text-cyan-400 focus:ring-cyan-400"
          />
        </div>
      )}

      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0',
        isGrouped && 'invisible'
      )}>
        {showAvatar && (
          <motion.img
            src={message.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name || 'U')}&background=0ea5e9&color=fff&size=40&rounded=true`}
            alt={message.sender.name}
            className="w-10 h-10 rounded-full ring-2 ring-gray-600/30"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Message Content */}
      <div className={clsx(
        'flex-1 max-w-md space-y-1',
        isOwnMessage && 'items-end'
      )}>
        {/* Sender Name */}
        {showName && !isOwnMessage && !isGrouped && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">
              {message.sender.name}
            </span>
            {message.sender.isBot && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                BOT
              </span>
            )}
          </div>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <InlineReplyPreview
            message={message.replyTo}
            onClick={() => {/* Scroll to replied message */}}
            compact
          />
        )}

        {/* Message Bubble */}
        <div className={clsx(
          'relative group/bubble',
          isOwnMessage ? 'ml-auto' : 'mr-auto'
        )}>
          <div
            className={clsx(
              'glass rounded-2xl px-4 py-2 relative',
              isOwnMessage 
                ? 'bg-cyan-500/20 border-cyan-400/30 rounded-tr-sm' 
                : 'bg-gray-800/50 border-gray-600/30 rounded-tl-sm',
              message.status === MESSAGE_STATUS.FAILED && 'border-red-500/50 bg-red-500/10',
              isSelected && 'ring-2 ring-cyan-400/50'
            )}
          >
            {/* System Message */}
            {message.type === 'system' ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-400 italic">
                  {message.content}
                </p>
              </div>
            ) : (
              <>
                {/* Message Content */}
                {isEditing ? (
                  <MessageEditor
                    message={message}
                    isEditing={true}
                    onCancelEdit={() => setIsEditing(false)}
                    onSaveEdit={() => setIsEditing(false)}
                  />
                ) : (
                  <div className="space-y-2">
                    {/* Text Content */}
                    {message.content && (
                      <div className="text-sm text-white whitespace-pre-wrap break-words">
                        {message.content}
                        {message.editedAt && (
                          <span className="text-xs text-gray-400 ml-2 italic">
                            (edited)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Attachments */}
                    {message.attachments?.length > 0 && (
                      <div className="space-y-2">
                        {message.attachments.map(renderAttachment)}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Actions (Hover) */}
                <div className={clsx(
                  'absolute -top-8 flex items-center gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200',
                  'glass rounded-lg px-2 py-1 border border-gray-600/50',
                  isOwnMessage ? 'right-0' : 'left-0'
                )}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReply}
                    className="w-6 h-6"
                    title="Reply"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>

                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEdit}
                      className="w-6 h-6"
                      title="Edit"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}

                  <Dropdown
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        title="More options"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    }
                    placement={isOwnMessage ? 'bottom-end' : 'bottom-start'}
                  >
                    {messageMenuItems.map((item, index) => (
                      item.type === 'separator' ? (
                        <DropdownSeparator key={index} />
                      ) : (
                        <DropdownItem
                          key={index}
                          onClick={item.onClick}
                          variant={item.variant}
                          leftIcon={item.icon}
                          disabled={item.disabled}
                        >
                          {item.label}
                        </DropdownItem>
                      )
                    ))}
                  </Dropdown>
                </div>
              </>
            )}
          </div>

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className={clsx(
              'mt-1',
              isOwnMessage ? 'flex justify-end' : 'flex justify-start'
            )}>
              <MessageReactions
                message={message}
                conversationId={conversationId}
                compact
              />
            </div>
          )}
        </div>

        {/* Message Info */}
        <div className={clsx(
          'flex items-center gap-2 text-xs text-gray-500',
          isOwnMessage ? 'justify-end flex-row-reverse' : 'justify-start'
        )}>
          {/* Timestamp */}
          <button
            onClick={() => setShowFullTime(!showFullTime)}
            className="hover:text-gray-400 transition-colors"
          >
            {showFullTime 
              ? new Date(message.createdAt).toLocaleString()
              : formatMessageTime(message.createdAt)
            }
          </button>

          {/* Status Icon */}
          {getStatusIcon()}

          {/* Read Receipts */}
          {isOwnMessage && message.readBy?.length > 0 && (
            <div className="flex items-center gap-1">
              <span>Read by</span>
              <div className="flex -space-x-1">
                {message.readBy.slice(0, 3).map((reader, index) => (
                  <img
                    key={reader.user}
                    src={reader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.name || 'U')}&size=16`}
                    alt={reader.name}
                    className="w-4 h-4 rounded-full ring-1 ring-gray-600"
                    title={reader.name}
                  />
                ))}
                {message.readBy.length > 3 && (
                  <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                    +{message.readBy.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// System message component
export const SystemMessage = ({
  message,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        'flex justify-center my-4',
        className
      )}
      {...props}
    >
      <div className="glass rounded-full px-4 py-2 border border-gray-600/30 bg-gray-800/30">
        <p className="text-sm text-gray-400 text-center">
          {message.content}
        </p>
      </div>
    </motion.div>
  )
}

// Date separator component
export const DateSeparator = ({
  date,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex items-center justify-center my-6',
        className
      )}
      {...props}
    >
      <div className="glass rounded-full px-4 py-1 border border-gray-600/30 bg-gray-800/50">
        <p className="text-xs font-medium text-gray-400">
          {date}
        </p>
      </div>
    </motion.div>
  )
}

// Message placeholder for loading
export const MessagePlaceholder = ({ isOwn = false }) => {
  return (
    <div className={clsx(
      'flex gap-3 mb-4',
      isOwn ? 'flex-row-reverse' : 'flex-row'
    )}>
      <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
      <div className="flex-1 max-w-md">
        <div className={clsx(
          'glass rounded-2xl px-4 py-3 space-y-2',
          isOwn ? 'ml-auto rounded-tr-sm' : 'mr-auto rounded-tl-sm'
        )}>
          <div className="h-4 bg-gray-600 rounded animate-pulse" />
          <div className="h-4 bg-gray-600 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
