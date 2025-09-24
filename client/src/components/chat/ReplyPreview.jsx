import { motion } from 'framer-motion'
import { X, Reply, Image, File, Mic } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import { truncateText } from '@/utils/helpers.js'
import { formatMessageTime } from '@/utils/formatters.js'

const ReplyPreview = ({
  message,
  onCancel,
  compact = false,
  showCancel = true,
  className = '',
  ...props
}) => {
  if (!message) return null

  const getMessagePreview = () => {
    if (message.isDeleted) {
      return {
        text: 'This message was deleted',
        icon: null,
        color: 'text-gray-500'
      }
    }

    switch (message.type) {
      case 'image':
        return {
          text: message.attachments?.length > 1 
            ? `${message.attachments.length} images` 
            : 'Photo',
          icon: <Image className="w-4 h-4" />,
          color: 'text-green-400'
        }
      
      case 'file':
        return {
          text: message.attachments?.[0]?.name || 'File',
          icon: <File className="w-4 h-4" />,
          color: 'text-blue-400'
        }
      
      case 'voice':
        return {
          text: 'Voice message',
          icon: <Mic className="w-4 h-4" />,
          color: 'text-purple-400'
        }
      
      case 'system':
        return {
          text: message.content,
          icon: null,
          color: 'text-gray-400'
        }
      
      default:
        return {
          text: message.content || 'Message',
          icon: null,
          color: 'text-gray-300'
        }
    }
  }

  const preview = getMessagePreview()
  const senderName = message.sender?.name || 'Unknown User'
  const maxLength = compact ? 50 : 100

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx(
        'glass border-l-4 border-cyan-400/70 bg-cyan-500/5',
        compact ? 'p-2' : 'p-3',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Reply Icon */}
        <div className="flex-shrink-0 mt-1">
          <Reply className="w-4 h-4 text-cyan-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-cyan-400">
              Replying to
            </span>
            <span className="text-xs text-gray-400">
              {senderName}
            </span>
            {!compact && message.createdAt && (
              <span className="text-xs text-gray-500">
                {formatMessageTime(message.createdAt)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Message Type Icon */}
            {preview.icon && (
              <span className={clsx('flex-shrink-0', preview.color)}>
                {preview.icon}
              </span>
            )}

            {/* Message Preview */}
            <p className={clsx(
              'text-sm truncate flex-1',
              preview.color,
              message.isDeleted && 'italic'
            )}>
              {truncateText(preview.text, maxLength)}
            </p>
          </div>

          {/* Original Message Metadata */}
          {!compact && message.editedAt && (
            <p className="text-xs text-gray-500 mt-1">
              (edited)
            </p>
          )}
        </div>

        {/* Cancel Button */}
        {showCancel && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="w-6 h-6 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Original Message Attachments Preview */}
      {!compact && message.attachments?.length > 0 && (
        <div className="mt-2 ml-7">
          <div className="flex flex-wrap gap-1">
            {message.attachments.slice(0, 3).map((attachment, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-gray-400">
                {attachment.type?.startsWith('image/') ? (
                  <Image className="w-3 h-3" />
                ) : (
                  <File className="w-3 h-3" />
                )}
                <span className="truncate max-w-[80px]">
                  {attachment.name}
                </span>
              </div>
            ))}
            {message.attachments.length > 3 && (
              <span className="text-xs text-gray-500">
                +{message.attachments.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Inline reply preview for within messages
export const InlineReplyPreview = ({
  message,
  onClick,
  compact = false, // FIXED: Extract compact prop
  className = '',
  ...props // FIXED: Now props won't contain 'compact'
}) => {
  if (!message) return null

  const preview = message.type === 'image' ? 'Photo' : 
                 message.type === 'file' ? 'File' : 
                 message.type === 'voice' ? 'Voice message' :
                 message.isDeleted ? 'Deleted message' :
                 message.content

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={clsx(
        'glass rounded-lg mb-2 border-l-2 border-cyan-400/50',
        'cursor-pointer hover:bg-cyan-500/10 transition-all duration-200',
        'bg-gray-800/30',
        compact ? 'p-1.5' : 'p-2', // FIXED: Use compact directly in className
        className
      )}
      {...props} // FIXED: Now safe to spread props
    >
      <div className="flex items-center gap-2">
        <Reply className="w-3 h-3 text-cyan-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-cyan-400 font-medium mb-0.5">
            {message.sender?.name || 'Unknown User'}
          </p>
          <p className={clsx(
            'text-xs truncate',
            message.isDeleted ? 'text-gray-500 italic' : 'text-gray-300'
          )}>
            {truncateText(preview, compact ? 40 : 60)} {/* FIXED: Use compact directly */}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Compact reply indicator for message list
export const ReplyIndicator = ({
  message,
  onClick,
  className = '',
  ...props
}) => {
  if (!message) return null

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1 text-xs text-cyan-400',
        'hover:text-cyan-300 transition-colors duration-200',
        'p-1 rounded hover:bg-cyan-500/10',
        className
      )}
      {...props}
    >
      <Reply className="w-3 h-3" />
      <span>
        Reply to {message.sender?.name || 'Unknown'}
      </span>
    </button>
  )
}

// Reply chain component for showing message threads
export const ReplyChain = ({
  messages = [],
  maxDepth = 3,
  onMessageClick,
  className = '',
  ...props
}) => {
  if (!messages.length) return null

  const displayMessages = messages.slice(0, maxDepth)
  const hasMore = messages.length > maxDepth

  return (
    <div className={clsx('space-y-1', className)} {...props}>
      {displayMessages.map((message, index) => (
        <motion.div
          key={message._id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="ml-4 relative"
        >
          {/* Connection line */}
          {index < displayMessages.length - 1 && (
            <div className="absolute left-0 top-6 w-px h-8 bg-gray-600/50" />
          )}
          
          <InlineReplyPreview
            message={message}
            onClick={() => onMessageClick?.(message)}
            compact={true} // FIXED: Pass boolean directly, not through ...props
          />
        </motion.div>
      ))}
      
      {hasMore && (
        <div className="ml-4 text-xs text-gray-500">
          +{messages.length - maxDepth} more messages in thread
        </div>
      )}
    </div>
  )
}

export default ReplyPreview
