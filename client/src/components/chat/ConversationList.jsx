import React from 'react'
import { motion } from 'framer-motion'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { useChat } from '../../hooks/useChat'
import { formatRelativeTime } from '../../utils/formatters'
import { cn } from '../../utils/cn'

const ConversationList = ({ conversations = [], onConversationSelect }) => {
  const { activeConversation, setActiveConversation } = useChat()

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation.id)
    onConversationSelect?.()
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <p className="font-medium">No conversations found</p>
        <p className="text-sm mt-1">Start a new chat to get going!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {conversations.map((conversation, index) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'relative p-4 cursor-pointer transition-all duration-200',
            'hover:bg-gray-50 dark:hover:bg-gray-700/50',
            'active:bg-gray-100 dark:active:bg-gray-700',
            activeConversation?.id === conversation.id && [
              'bg-blue-50 dark:bg-blue-900/20',
              'border-r-2 border-blue-500',
              'shadow-sm'
            ]
          )}
          onClick={() => handleConversationClick(conversation)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Avatar
                name={conversation.name}
                src={conversation.avatar}
                status={conversation.isOnline ? 'online' : 'offline'}
                size="md"
              />
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {conversation.name}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                  {formatRelativeTime(conversation.lastActivity)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate pr-2">
                  {conversation.lastMessage}
                </p>
                
                {conversation.unreadCount > 0 && (
                  <Badge variant="primary" className="flex-shrink-0">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {activeConversation?.id === conversation.id && conversation.isOnline && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default ConversationList
