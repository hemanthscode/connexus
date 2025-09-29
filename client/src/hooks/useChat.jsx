import { useCallback, useEffect, useState, useMemo } from 'react'
import { useChatContext } from '@/context/ChatContext.jsx'
import { useAuth } from './useAuth.jsx'
import { validateData, chatValidation } from '@/utils/validators.js'
import { debounce } from '@/utils/helpers.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Main chat hook
export const useChat = () => {
  const chatContext = useChatContext()
  
  if (!chatContext) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  
  return chatContext
}

// Conversation operations hook - consolidated
export const useConversationOperations = () => {
  const {
    createDirectConversation,
    createGroup,
    setActiveConversation,
    conversations,
    isInitialized
  } = useChat()
  
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  // Generic conversation creation handler
  const createConversation = useCallback(async (type, data, validation = null) => {
    if (validation) {
      const validationResult = validateData(validation, data)
      if (!validationResult.isValid) {
        const errorMessage = Object.values(validationResult.errors)[0]
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
      data = validationResult.data
    }

    setLoading(true)
    try {
      const result = type === 'direct' 
        ? await createDirectConversation(data.participantId || data)
        : await createGroup(data)
      
      if (result.success) {
        const successMessage = type === 'direct' ? 'Conversation created' : 'Group created successfully'
        toast.success(successMessage)
        setActiveConversation(result.data._id)
      } else {
        toast.error(result.error || `Failed to create ${type}`)
      }
      
      return result
    } catch (error) {
      const errorMessage = `Failed to create ${type}`
      toast.error(errorMessage)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [createDirectConversation, createGroup, setActiveConversation, toast])

  // Specific conversation creators
  const createDirectChat = useCallback((participantId) => {
    if (!participantId || participantId === user?._id) {
      toast.error('Invalid participant selected')
      return { success: false, error: 'Invalid participant' }
    }
    return createConversation('direct', participantId)
  }, [user, createConversation, toast])

  const createGroupChat = useCallback((groupData) => {
    return createConversation('group', groupData, chatValidation.createGroup)
  }, [createConversation])

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId, archived = true) => {
    try {
      const { archiveConversation } = await import('@/services/chatService.js')
      const result = await archiveConversation(conversationId, archived)
      
      if (result.success) {
        toast.success(archived ? 'Conversation archived' : 'Conversation unarchived')
      } else {
        toast.error(result.error || 'Failed to update conversation')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to update conversation')
      return { success: false, error: error.message }
    }
  }, [toast])

  // Find existing direct conversation
  const findDirectConversation = useCallback((participantId) => {
    if (!participantId || !user) return null
    
    return conversations.find(conv => 
      conv.type === 'direct' && 
      conv.participants?.some(p => p.user._id === participantId)
    )
  }, [conversations, user])

  return {
    createDirectChat,
    createGroupChat,
    archiveConversation,
    findDirectConversation,
    loading,
    isInitialized
  }
}

// Message operations hook - consolidated
export const useMessageOperations = (conversationId) => {
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setReplyToMessage,
    setEditingMessage,
    replyToMessage,
    editingMessage,
    getMessagesForConversation
  } = useChat()
  
  const { user } = useAuth()
  const toast = useToast()
  const [sending, setSending] = useState(false)

  // Generic message operation handler
  const executeMessageOperation = useCallback(async (operation, validationSchema, data, successMessage) => {
    if (validationSchema) {
      const validation = validateData(validationSchema, data)
      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors)[0]
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
      data = validation.data
    }

    try {
      const result = await operation(data)
      
      if (result.success && successMessage) {
        toast.success(successMessage)
      } else if (!result.success) {
        toast.error(result.error || 'Operation failed')
      }
      
      return result
    } catch (error) {
      toast.error('Operation failed')
      return { success: false, error: error.message }
    }
  }, [toast])

  // Send message with validation
  const sendChatMessage = useCallback(async (messageData) => {
    setSending(true)
    try {
      const result = await executeMessageOperation(
        (data) => sendMessage({ ...data, conversationId }),
        chatValidation.sendMessage,
        { ...messageData, conversationId },
        null // Don't show success toast for messages
      )
      return result
    } finally {
      setSending(false)
    }
  }, [conversationId, sendMessage, executeMessageOperation])

  // Edit message with validation
  const editChatMessage = useCallback(async (messageId, newContent) => {
    const result = await executeMessageOperation(
      () => editMessage(messageId, newContent),
      chatValidation.editMessage,
      { messageId, newContent },
      'Message updated'
    )
    
    if (result.success) {
      setEditingMessage(null)
    }
    
    return result
  }, [editMessage, setEditingMessage, executeMessageOperation])

  // Delete message with confirmation
  const deleteChatMessage = useCallback(async (messageId, skipConfirmation = false) => {
    if (!skipConfirmation && !window.confirm('Are you sure you want to delete this message?')) {
      return { success: false, cancelled: true }
    }

    return await executeMessageOperation(
      () => deleteMessage(messageId),
      null,
      messageId,
      'Message deleted'
    )
  }, [deleteMessage, executeMessageOperation])

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId, emoji) => {
    const messages = getMessagesForConversation(conversationId)
    const message = messages.find(m => m._id === messageId)
    
    if (!message) return { success: false, error: 'Message not found' }
    
    const existingReaction = message.reactions?.find(r => 
      r.user === user?._id && r.emoji === emoji
    )
    
    const operation = existingReaction 
      ? () => removeReaction(messageId, emoji)
      : () => addReaction(messageId, emoji)
    
    return await executeMessageOperation(operation, null, null, null)
  }, [conversationId, getMessagesForConversation, addReaction, removeReaction, user, executeMessageOperation])

  // Permission checks
  const messagePermissions = useMemo(() => ({
    canEdit: (message) => {
      if (!message || !user) return false
      if (message.sender._id !== user._id) return false
      if (message.isDeleted || message.type === 'system') return false
      
      const messageAge = Date.now() - new Date(message.createdAt).getTime()
      return messageAge < 24 * 60 * 60 * 1000 // 24 hours
    },

    canDelete: (message) => {
      if (!message || !user || message.isDeleted) return false
      return message.sender._id === user._id
    },
  }), [user])

  return {
    sendMessage: sendChatMessage,
    editMessage: editChatMessage,
    deleteMessage: deleteChatMessage,
    toggleReaction,
    setReplyToMessage,
    setEditingMessage,
    replyToMessage,
    editingMessage,
    ...messagePermissions,
    sending
  }
}

// Message drafts hook - optimized
export const useMessageDrafts = (conversationId) => {
  const { saveDraftMessage, getDraftMessage, clearDraftMessage } = useChat()
  const [draftContent, setDraftContent] = useState('')

  // Load draft on mount
  useEffect(() => {
    if (conversationId) {
      setDraftContent(getDraftMessage(conversationId))
    }
  }, [conversationId, getDraftMessage])

  // Debounced draft saving
  const debouncedSaveDraft = useMemo(() => 
    debounce((content) => {
      if (conversationId) {
        saveDraftMessage(conversationId, content)
      }
    }, 500),
    [conversationId, saveDraftMessage]
  )

  const updateDraft = useCallback((content) => {
    setDraftContent(content)
    debouncedSaveDraft(content)
  }, [debouncedSaveDraft])

  const clearDraft = useCallback(() => {
    setDraftContent('')
    if (conversationId) {
      clearDraftMessage(conversationId)
    }
  }, [conversationId, clearDraftMessage])

  return {
    draftContent,
    updateDraft,
    clearDraft,
    hasDraft: draftContent.length > 0
  }
}

export default useChat
