import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import ConversationList from './ConversationList'
import { useChat } from '../../hooks/useChat'

/**
 * Chat Sidebar Component - Fixed mobile layout
 */
const ChatSidebar = ({ isOpen, onClose }) => {
  const { conversations } = useChat()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        className="
          fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700 flex flex-col
          lg:static lg:z-auto lg:translate-x-0 lg:w-80
          top-16 lg:top-0
        "
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-700
                border-0 rounded-md text-sm placeholder-gray-500 dark:placeholder-gray-400
                text-gray-900 dark:text-white
                focus:bg-white dark:focus:bg-gray-600 focus:ring-2
                focus:ring-blue-500 focus:outline-none transition-colors
              "
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList 
            conversations={filteredConversations} 
            onConversationSelect={() => {
              // Close sidebar on mobile after selection
              if (window.innerWidth < 1024) {
                onClose()
              }
            }}
          />
        </div>
      </motion.aside>
    </>
  )
}

export default ChatSidebar
