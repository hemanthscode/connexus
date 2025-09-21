import { useState, useEffect, useCallback } from 'react'
import { useSocket } from './useSocket'
import * as chatService from '../service/chat'

export const useChat = () => {
  const { socket, emitTypingStart, emitTypingStop } = useSocket()

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const convos = await chatService.fetchConversations()
      setConversations(convos)
    } catch (err) {
      console.error("Failed to load conversations", err)
    }
  }, [])

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return
    try {
      const msgs = await chatService.fetchMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      console.error("Failed to load messages", err)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversation) loadMessages(selectedConversation._id)
  }, [selectedConversation, loadMessages])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const onNewMessage = ({ conversationId, message }) => {
      if (selectedConversation && conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, message])
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: message.content, updatedAt: message.createdAt }
            : c
        )
      )
    }

    const onTyping = ({ conversationId, isTyping }) => {
      if (selectedConversation && conversationId === selectedConversation._id) {
        setIsTyping(isTyping)
      }
    }

    socket.on('new_message', onNewMessage)
    socket.on('typing', onTyping)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('typing', onTyping)
    }
  }, [socket, selectedConversation])

  // Send message via socket
  const sendMessage = async (content) => {
    if (!selectedConversation) return
    const message = { conversationId: selectedConversation._id, content, type: 'text' }
    socket.emit('send_message', message)
    setMessages((prev) => [
      ...prev,
      { ...message, _id: 'temp-' + Date.now(), createdAt: new Date(), sender: null }, // sender can be added from context
    ])
  }

  // Typing notifications control
  const handleTyping = (typing) => {
    if (!selectedConversation) return
    if (typing) emitTypingStart(selectedConversation._id)
    else emitTypingStop(selectedConversation._id)
  }

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    isTyping,
    sendMessage,
    handleTyping,
    reloadConversations: loadConversations,
  }
}
