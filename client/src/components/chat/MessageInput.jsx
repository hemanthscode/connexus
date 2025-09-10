import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import Button from '../ui/Button'
import { useChat } from '../../hooks/useChat'
import { useAuth } from '../../hooks/useAuth'

/**
 * Message Input Component - Fixed typing indicator (only for recipients)
 */
const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const { sendMessage } = useChat()
  const { user } = useAuth()

  // Clear input when conversation changes
  useEffect(() => {
    setMessage('')
  }, [conversationId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!message.trim() || !user) return

    const messageText = message.trim()
    setMessage('')

    try {
      await sendMessage(conversationId, messageText, user.id)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e) => {
    setMessage(e.target.value)
    // No typing indicator for self - only recipients should see typing
  }

  return (
    <motion.div
      key={conversationId}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors"
    >
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="
                w-full px-4 py-2 bg-gray-100 dark:bg-gray-700
                border-0 rounded-full resize-none
                text-sm placeholder-gray-500 dark:placeholder-gray-400
                text-gray-900 dark:text-white
                focus:bg-white dark:focus:bg-gray-600 focus:ring-2
                focus:ring-blue-500 focus:outline-none
                transition-colors max-h-32
              "
              style={{
                minHeight: '40px',
                height: 'auto'
              }}
            />
          </div>
          
          <Button
            type="submit"
            disabled={!message.trim()}
            className="rounded-full w-10 h-10 p-0 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default MessageInput
