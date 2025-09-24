import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Archive,
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button.jsx'
import Input from './Input.jsx'

const Sidebar = ({
  isOpen = true,
  onToggle,
  onClose,
  activeSection = 'chats',
  onSectionChange,
  conversations = [],
  onConversationSelect,
  activeConversationId = null,
  onNewChat,
  onNewGroup,
  user = null,
  searchValue = '',
  onSearchChange,
  className = '',
  isMobile = false,
  ...props
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  // Navigation items
  const navigationItems = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      count: conversations.filter(c => !c.isArchived).length,
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users,
      count: conversations.filter(c => c.type === 'group' && !c.isArchived).length,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: Star,
      count: conversations.filter(c => c.isStarred).length,
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
      count: conversations.filter(c => c.isArchived).length,
    },
  ]

  const handleToggleCollapsed = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed)
    }
  }

  const sidebarVariants = {
    open: {
      width: isMobile ? '100%' : (isCollapsed ? '80px' : '320px'),
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    closed: {
      width: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  }

  const contentVariants = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -20 }
  }

  // Filter conversations based on active section
  const getFilteredConversations = () => {
    let filtered = conversations

    switch (activeSection) {
      case 'groups':
        filtered = conversations.filter(c => c.type === 'group' && !c.isArchived)
        break
      case 'starred':
        filtered = conversations.filter(c => c.isStarred)
        break
      case 'archived':
        filtered = conversations.filter(c => c.isArchived)
        break
      default:
        filtered = conversations.filter(c => !c.isArchived)
    }

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        c.lastMessage?.content?.toLowerCase().includes(searchValue.toLowerCase())
      )
    }

    return filtered
  }

  const formatConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group'
    }
    
    // For direct conversations, show other participant's name
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    return otherParticipant?.user?.name || 'Unknown User'
  }

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.avatar || null
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    return otherParticipant?.user?.avatar || null
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    const isThisWeek = (now - date) < (7 * 24 * 60 * 60 * 1000)
    if (isThisWeek) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className={clsx(
          'glass-dark border-r border-gray-700/50 backdrop-blur-xl',
          'flex flex-col h-full relative z-50',
          isMobile && 'fixed left-0 top-0',
          className
        )}
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              className="flex flex-col h-full"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700/30">
                <div className="flex items-center justify-between">
                  {!isCollapsed && (
                    <motion.h2
                      className="text-lg font-semibold text-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      Messages
                    </motion.h2>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {/* Collapse Toggle (Desktop) */}
                    {!isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleCollapsed}
                        className="w-8 h-8"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    
                    {/* Close Button (Mobile) */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-8 h-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Search */}
                {!isCollapsed && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchValue}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      leftIcon={<Search className="w-4 h-4" />}
                      className="bg-white/5 border-gray-600/30"
                    />
                  </motion.div>
                )}

                {/* New Chat Buttons */}
                {!isCollapsed && (
                  <motion.div
                    className="flex gap-2 mt-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onNewChat}
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="flex-1"
                    >
                      New Chat
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onNewGroup}
                      leftIcon={<Users className="w-4 h-4" />}
                    >
                      Group
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-4 py-2 border-b border-gray-700/30">
                <nav className="space-y-1">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = activeSection === item.id
                    
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => onSectionChange?.(item.id)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                          'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                          isActive && 'bg-cyan-500/20 text-cyan-400',
                          !isActive && 'text-gray-300'
                        )}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium flex-1 text-left">
                              {item.label}
                            </span>
                            {item.count > 0 && (
                              <span className={clsx(
                                'px-2 py-0.5 text-xs rounded-full',
                                isActive ? 'bg-cyan-400 text-dark-bg' : 'bg-gray-600 text-gray-300'
                              )}>
                                {item.count}
                              </span>
                            )}
                          </>
                        )}
                      </motion.button>
                    )
                  })}
                </nav>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {!isCollapsed && (
                    <div className="p-2">
                      {getFilteredConversations().map((conversation, index) => {
                        const isActive = activeConversationId === conversation._id
                        const avatar = getConversationAvatar(conversation)
                        const name = formatConversationName(conversation)
                        
                        return (
                          <motion.button
                            key={conversation._id}
                            onClick={() => onConversationSelect?.(conversation._id)}
                            className={clsx(
                              'w-full p-3 rounded-lg mb-2 text-left transition-colors',
                              'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                              isActive && 'bg-cyan-500/10 border border-cyan-500/30'
                            )}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="flex-shrink-0 relative">
                                {avatar ? (
                                  <img
                                    src={avatar}
                                    alt={name}
                                    className="w-12 h-12 rounded-full"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                      {name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Online indicator */}
                                {conversation.type === 'direct' && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-surface" />
                                )}
                                
                                {/* Unread badge */}
                                {conversation.unreadCount > 0 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-white truncate">
                                    {name}
                                  </h3>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    {formatTime(conversation.lastMessage?.timestamp)}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-400 truncate">
                                  {conversation.lastMessage?.content || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}

                      {/* Empty State */}
                      {getFilteredConversations().length === 0 && (
                        <motion.div
                          className="text-center py-12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="text-gray-500 mb-4">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-sm">
                              {searchValue ? 'No conversations found' : 'No conversations yet'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Button */}
              <div className="p-4 border-t border-gray-700/30">
                <Button
                  variant="ghost"
                  size={isCollapsed ? 'icon' : 'sm'}
                  onClick={() => onSectionChange?.('settings')}
                  className="w-full"
                  leftIcon={!isCollapsed && <Settings className="w-4 h-4" />}
                >
                  {isCollapsed ? (
                    <Settings className="w-5 h-5" />
                  ) : (
                    'Settings'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  )
}

export default Sidebar
