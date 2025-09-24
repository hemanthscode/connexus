import { useCallback, useEffect, useState, useRef } from 'react'
import { useChatContext } from '@/context/ChatContext.jsx'
import { useSocket } from './useSocket.jsx'
import { useAuth } from './useAuth.jsx'
import { validateData, chatValidation } from '@/utils/validators.js'
import { debounce } from '@/utils/helpers.js'
import { useToast } from '@/components/ui/Toast.jsx'

/**
 * Main chat hook that provides chat functionality
 */
export const useChat = () => {
  const chatContext = useChatContext()
  
  if (!chatContext) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  
  return chatContext
}

/**
 * Hook for managing conversation operations
 */
export const useConversationOperations = () => {
  const {
    createDirectConversation,
    createGroup,
    updateConversation,
    setActiveConversation,
    markAsRead,
    conversations,
    isInitialized
  } = useChat()
  
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  // Create new direct conversation
  const createDirectChat = useCallback(async (participantId) => {
    if (!participantId || participantId === user?._id) {
      toast.error('Invalid participant selected')
      return { success: false, error: 'Invalid participant' }
    }

    setLoading(true)
    try {
      const result = await createDirectConversation(participantId)
      
      if (result.success) {
        toast.success('Conversation created')
        setActiveConversation(result.data._id)
      } else {
        toast.error(result.error || 'Failed to create conversation')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to create conversation')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user, createDirectConversation, setActiveConversation, toast])

  // Create new group
  const createGroupChat = useCallback(async (groupData) => {
    const validation = validateData(chatValidation.createGroup, groupData)
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors)[0]
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }

    setLoading(true)
    try {
      const result = await createGroup(validation.data)
      
      if (result.success) {
        toast.success('Group created successfully')
        setActiveConversation(result.data._id)
      } else {
        toast.error(result.error || 'Failed to create group')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to create group')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [createGroup, setActiveConversation, toast])

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId, archived = true) => {
    try {
      // Import chatService dynamically to avoid circular dependency
      const { archiveConversation } = await import('@/services/chatService.js')
      const result = await archiveConversation(conversationId, archived)
      
      if (result.success) {
        updateConversation(conversationId, { isArchived: archived })
        toast.success(archived ? 'Conversation archived' : 'Conversation unarchived')
      } else {
        toast.error(result.error || 'Failed to update conversation')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to update conversation')
      return { success: false, error: error.message }
    }
  }, [updateConversation, toast])

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

/**
 * Hook for managing message operations
 */
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

  // Send message with validation
  const sendChatMessage = useCallback(async (messageData) => {
    const validation = validateData(chatValidation.sendMessage, {
      ...messageData,
      conversationId
    })
    
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors)[0]
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }

    setSending(true)
    try {
      const result = await sendMessage({
        ...validation.data,
        conversationId
      })
      
      if (!result.success) {
        toast.error(result.error || 'Failed to send message')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to send message')
      return { success: false, error: error.message }
    } finally {
      setSending(false)
    }
  }, [conversationId, sendMessage, toast])

  // Edit message with validation
  const editChatMessage = useCallback(async (messageId, newContent) => {
    const validation = validateData(chatValidation.editMessage, {
      messageId,
      newContent
    })
    
    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors)[0]
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }

    try {
      const result = await editMessage(messageId, newContent)
      
      if (result.success) {
        toast.success('Message updated')
        setEditingMessage(null)
      } else {
        toast.error(result.error || 'Failed to edit message')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to edit message')
      return { success: false, error: error.message }
    }
  }, [editMessage, setEditingMessage, toast])

  // Delete message with confirmation
  const deleteChatMessage = useCallback(async (messageId, skipConfirmation = false) => {
    if (!skipConfirmation) {
      const confirmed = window.confirm('Are you sure you want to delete this message?')
      if (!confirmed) return { success: false, cancelled: true }
    }

    try {
      const result = await deleteMessage(messageId)
      
      if (result.success) {
        toast.success('Message deleted')
      } else {
        toast.error(result.error || 'Failed to delete message')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to delete message')
      return { success: false, error: error.message }
    }
  }, [deleteMessage, toast])

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId, emoji) => {
    try {
      const messages = getMessagesForConversation(conversationId)
      const message = messages.find(m => m._id === messageId)
      
      if (!message) return { success: false, error: 'Message not found' }
      
      // Check if user already reacted with this emoji
      const existingReaction = message.reactions?.find(r => 
        r.user === user?._id && r.emoji === emoji
      )
      
      let result
      if (existingReaction) {
        result = await removeReaction(messageId, emoji)
      } else {
        result = await addReaction(messageId, emoji)
      }
      
      if (!result.success) {
        toast.error(result.error || 'Failed to update reaction')
      }
      
      return result
    } catch (error) {
      toast.error('Failed to update reaction')
      return { success: false, error: error.message }
    }
  }, [conversationId, getMessagesForConversation, addReaction, removeReaction, user, toast])

  // Check if user can edit message
  const canEditMessage = useCallback((message) => {
    if (!message || !user) return false
    
    // Only sender can edit
    if (message.sender._id !== user._id) return false
    
    // Can't edit deleted messages
    if (message.isDeleted) return false
    
    // Can't edit system messages
    if (message.type === 'system') return false
    
    // Can edit within 24 hours
    const messageAge = Date.now() - new Date(message.createdAt).getTime()
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    return messageAge < twentyFourHours
  }, [user])

  // Check if user can delete message
  const canDeleteMessage = useCallback((message) => {
    if (!message || !user) return false
    
    // Already deleted
    if (message.isDeleted) return false
    
    // Sender can always delete
    if (message.sender._id === user._id) return true
    
    // Group admins can delete (would need group role info)
    // This would be implemented based on conversation participant roles
    
    return false
  }, [user])

  return {
    sendMessage: sendChatMessage,
    editMessage: editChatMessage,
    deleteMessage: deleteChatMessage,
    toggleReaction,
    setReplyToMessage,
    setEditingMessage,
    replyToMessage,
    editingMessage,
    canEditMessage,
    canDeleteMessage,
    sending
  }
}

// Add the missing functions for message draft management
export const useMessageDrafts = (conversationId) => {
  const {
    saveDraftMessage,
    getDraftMessage,
    clearDraftMessage
  } = useChat()

  const [draftContent, setDraftContent] = useState('')

  // Load draft on mount
  useEffect(() => {
    if (conversationId) {
      const draft = getDraftMessage(conversationId)
      setDraftContent(draft)
    }
  }, [conversationId, getDraftMessage])

  // Debounced draft saving
  const debouncedSaveDraft = useCallback(
    debounce((content) => {
      if (conversationId) {
        saveDraftMessage(conversationId, content)
      }
    }, 500),
    [conversationId, saveDraftMessage]
  )

  // Update draft content
  const updateDraft = useCallback((content) => {
    setDraftContent(content)
    debouncedSaveDraft(content)
  }, [debouncedSaveDraft])

  // Clear draft
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
