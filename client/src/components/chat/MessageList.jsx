import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import { useChat } from '../../hooks/useChat'
import { useAuth } from '../../hooks/useAuth'
import { groupMessagesByDate } from '../../utils/helpers'
import { formatMessageDate } from '../../utils/formatters'

const MessageList = ({ conversationId }) => {
  const messagesEndRef = useRef(null)
  const { messages, typingUsers } = useChat()
  const { user } = useAuth()
  
  const conversationMessages = messages[conversationId] || []
  const groupedMessages = groupMessagesByDate(conversationMessages)
  const typingInConversation = typingUsers[conversationId] || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {formatMessageDate(date)}
                </span>
              </div>
              
              {msgs.map((message, index) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  layout
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === user?.id}
                    showAvatar={
                      index === 0 || 
                      msgs[index - 1]?.senderId !== message.senderId
                    }
                  />
                </motion.div>
              ))}
            </div>
          ))}

          {/* Typing indicator for other users */}
          {typingInConversation.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-start"
            >
              <div className="max-w-xs bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      
      <div ref={messagesEndRef} />
      
      {conversationMessages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Send the first message to start the conversation
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList
