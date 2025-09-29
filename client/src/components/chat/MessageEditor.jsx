import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Edit3 } from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import { useMessageOperations } from '@/hooks/useChat.jsx'
import { useToast } from '../ui/Toast.jsx'
import { validateData, chatValidation } from '@/utils/validators.js'

// Configuration constants
const EDITOR_CONFIG = {
  MAX_LENGTH: 2000,
  WARNING_THRESHOLD: 1900,
  MIN_HEIGHT: '40px',
  MAX_HEIGHT: '200px'
}

const MessageEditor = ({
  message,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  disabled = false,
  className = '',
  ...props
}) => {
  const { editMessage } = useMessageOperations(message?.conversation)
  const toast = useToast()
  
  const [editContent, setEditContent] = useState(message?.content || '')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const textareaRef = useRef(null)
  const originalContent = useRef(message?.content || '')

  // Check if message can be edited
  const canEdit = useMemo(() => (
    !message?.isDeleted && 
    message?.type === 'text' && 
    !disabled &&
    message?.sender?._id === message?.currentUserId // Assuming we have current user context
  ), [message, disabled])

  // Update content when message changes
  useEffect(() => {
    if (message?.content !== undefined) {
      setEditContent(message.content)
      originalContent.current = message.content
      setHasChanges(false)
    }
  }, [message?.content])

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Handle content changes
  const handleContentChange = useCallback((value) => {
    setEditContent(value)
    setHasChanges(value !== originalContent.current)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && isEditing) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [editContent, isEditing])

  // Handlers with memoization
  const handlers = useMemo(() => ({
    handleKeyDown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handlers.handleSaveEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handlers.handleCancelEdit()
      }
    },

    handleSaveEdit: async () => {
      if (!hasChanges || !message?._id) {
        handlers.handleCancelEdit()
        return
      }

      const trimmedContent = editContent.trim()
      
      // Validate content
      const validation = validateData(chatValidation.editMessage, {
        messageId: message._id,
        newContent: trimmedContent
      })

      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors)[0]
        toast.error(errorMessage)
        return
      }

      if (!trimmedContent) {
        toast.error('Message cannot be empty')
        return
      }

      setSaving(true)
      
      try {
        const result = await editMessage(message._id, trimmedContent)
        
        if (result.success) {
          originalContent.current = trimmedContent
          setHasChanges(false)
          toast.success('Message updated')
          onSaveEdit?.(trimmedContent)
        }
      } catch (error) {
        console.error('Failed to edit message:', error)
        toast.error('Failed to update message')
      } finally {
        setSaving(false)
      }
    },

    handleCancelEdit: () => {
      setEditContent(originalContent.current)
      setHasChanges(false)
      onCancelEdit?.()
    },

    handleStartEdit: () => {
      if (!message?.content || disabled) return
      onStartEdit?.()
    }
  }), [editContent, hasChanges, message, editMessage, toast, onSaveEdit, onCancelEdit, onStartEdit, disabled])

  if (!message) return null

  // Character count with warnings
  const characterInfo = useMemo(() => {
    const count = editContent.length
    const remaining = EDITOR_CONFIG.MAX_LENGTH - count
    const isWarning = count > EDITOR_CONFIG.WARNING_THRESHOLD
    
    return { count, remaining, isWarning }
  }, [editContent.length])

  return (
    <div className={clsx('relative group', className)} {...props}>
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2"
        >
          {/* Edit Header */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Edit3 className="w-3 h-3" />
            <span>Editing message</span>
            <span className="text-gray-500">• Enter to save, Esc to cancel</span>
          </div>

          {/* Edit Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handlers.handleKeyDown}
              disabled={saving}
              maxLength={EDITOR_CONFIG.MAX_LENGTH}
              className={clsx(
                'w-full resize-none rounded-lg px-3 py-2 pr-20',
                'glass border border-cyan-400/50 text-white placeholder-gray-400',
                'focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
              style={{ 
                minHeight: EDITOR_CONFIG.MIN_HEIGHT, 
                maxHeight: EDITOR_CONFIG.MAX_HEIGHT 
              }}
              placeholder="Edit your message..."
            />

            {/* Edit Controls */}
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlers.handleCancelEdit}
                disabled={saving}
                className="w-6 h-6"
              >
                <X className="w-3 h-3" />
              </Button>
              
              <Button
                variant="primary"
                size="icon"
                onClick={handlers.handleSaveEdit}
                disabled={!hasChanges || saving}
                loading={saving}
                className="w-6 h-6"
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Edit Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {hasChanges && <span className="text-yellow-400">• Unsaved changes</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={characterInfo.isWarning ? 'text-yellow-400' : ''}>
                {characterInfo.count}/{EDITOR_CONFIG.MAX_LENGTH}
              </span>
              {characterInfo.isWarning && (
                <span className="text-yellow-400">
                  {characterInfo.remaining} characters remaining
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Message Content */}
          <div className="message-content">
            {message.content}
            
            {/* Edited Indicator */}
            {message.editedAt && (
              <span className="text-xs text-gray-500 ml-2 italic">(edited)</span>
            )}
          </div>

          {/* Edit Button */}
          {canEdit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handlers.handleStartEdit}
                className="w-6 h-6 bg-gray-800/90 backdrop-blur-sm"
                title="Edit message"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

// Quick edit button component for message actions
export const QuickEditButton = ({ message, onEdit, disabled = false, className = '', ...props }) => {
  const canEdit = !message?.isDeleted && message?.type === 'text' && !disabled

  if (!canEdit) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onEdit?.(message)}
      disabled={disabled}
      className={clsx('w-6 h-6', className)}
      title="Edit message"
      {...props}
    >
      <Edit3 className="w-3 h-3" />
    </Button>
  )
}

export default MessageEditor
