import React from 'react'
import { MessageCircle } from 'lucide-react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { useChat } from '../../hooks/useChat'

/**
 * Chat Window Component - Fixed mobile layout
 */
const ChatWindow = ({ onToggleSidebar }) => {
  const { activeConversation } = useChat()

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Choose from your existing conversations or start a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0">
      <ChatHeader
        conversation={activeConversation}
        onToggleSidebar={onToggleSidebar}
      />
      <MessageList conversationId={activeConversation.id} />
      <MessageInput conversationId={activeConversation.id} />
    </div>
  )
}

export default ChatWindow
