import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Users, Settings, Archive, Star, Plus, 
  ChevronLeft, ChevronRight, Search
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button.jsx'
import Input from './Input.jsx'

// Animation variants
const SIDEBAR_VARIANTS = {
  open: (isMobile) => ({
    width: isMobile ? '100%' : '320px',
    transition: { duration: 0.3, ease: 'easeInOut' }
  }),
  closed: {
    width: 0,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  collapsed: {
    width: '80px',
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
}

const CONTENT_VARIANTS = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -20 }
}

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

  // Memoized calculations
  const { unreadCounts, navigationItems } = useMemo(() => {
    const counts = {
      chats: conversations.filter(c => !c.isArchived && c.unreadCount > 0 && c.type !== 'group').length,
      groups: conversations.filter(c => c.type === 'group' && !c.isArchived && c.unreadCount > 0).length,
      starred: conversations.filter(c => c.isStarred && c.unreadCount > 0).length,
      archived: conversations.filter(c => c.isArchived && c.unreadCount > 0).length
    }

    const items = [
      { id: 'chats', label: 'Chats', icon: MessageSquare, count: counts.chats },
      { id: 'groups', label: 'Groups', icon: Users, count: counts.groups },
      { id: 'starred', label: 'Starred', icon: Star, count: counts.starred },
      { id: 'archived', label: 'Archived', icon: Archive, count: counts.archived },
    ]

    return { unreadCounts: counts, navigationItems: items }
  }, [conversations])

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
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
      const query = searchValue.toLowerCase()
      filtered = filtered.filter(c => {
        const name = formatConversationName(c).toLowerCase()
        const lastMessage = c.lastMessage?.content?.toLowerCase() || ''
        return name.includes(query) || lastMessage.includes(query)
      })
    }

    // Sort by unread and timestamp
    return filtered.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      
      const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0)
      const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0)
      return bTime - aTime
    })
  }, [conversations, activeSection, searchValue, user])

  const formatConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group'
    }
    
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

  const handleToggleCollapsed = () => {
    if (!isMobile) setIsCollapsed(!isCollapsed)
  }

  const renderNavigation = () => (
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
              title={`${item.label}${item.count > 0 ? ` (${item.count} unread)` : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 text-xs rounded-full font-medium bg-red-500 text-white min-w-[18px] text-center"
                    >
                      {item.count > 99 ? '99+' : item.count}
                    </motion.span>
                  )}
                </>
              )}
            </motion.button>
          )
        })}
      </nav>
    </div>
  )

  const renderConversationItem = (conversation, index) => {
    const isActive = activeConversationId === conversation._id
    const avatar = getConversationAvatar(conversation)
    const name = formatConversationName(conversation)
    const hasUnread = conversation.unreadCount > 0

    return (
      <motion.button
        key={conversation._id}
        onClick={() => onConversationSelect?.(conversation._id)}
        className={clsx(
          'w-full p-3 rounded-lg mb-2 text-left transition-all duration-200',
          'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
          'relative group',
          isActive && 'bg-cyan-500/10 border border-cyan-500/30',
          hasUnread && !isActive && 'bg-white/5'
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
                className={clsx(
                  'w-12 h-12 rounded-full transition-all',
                  hasUnread && 'ring-2 ring-cyan-400/50'
                )}
              />
            ) : (
              <div className={clsx(
                'w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center transition-all',
                hasUnread && 'ring-2 ring-cyan-400/50'
              )}>
                <span className="text-white font-semibold text-sm">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Online indicator for direct chats */}
            {conversation.type === 'direct' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-surface" />
            )}
            
            {/* Unread badge */}
            {hasUnread && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-medium">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={clsx(
                'font-semibold truncate',
                hasUnread ? 'text-white' : 'text-gray-300',
                isActive && 'text-cyan-400'
              )}>
                {name}
              </h3>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatTime(conversation.lastMessage?.timestamp)}
              </span>
            </div>
            
            <p className={clsx(
              'text-sm truncate',
              hasUnread ? 'text-gray-300' : 'text-gray-400'
            )}>
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>
          </div>
        </div>
      </motion.button>
    )
  }

  const renderEmptyState = () => (
    <motion.div
      className="text-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="text-gray-500 mb-4">
        <MessageSquare className="w-12 h-12 mx-auto mb-3" />
        <p className="text-sm font-medium mb-1">
          {searchValue ? 'No conversations found' : 'No conversations yet'}
        </p>
        <p className="text-xs text-gray-600">
          {searchValue 
            ? 'Try searching for something else' 
            : 'Start a new conversation to get started'
          }
        </p>
      </div>
      {!searchValue && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onNewChat?.()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Start New Chat
        </Button>
      )}
    </motion.div>
  )

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
        variants={SIDEBAR_VARIANTS}
        animate={isOpen ? (isCollapsed ? 'collapsed' : 'open') : 'closed'}
        custom={isMobile}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              className="flex flex-col h-full"
              variants={CONTENT_VARIANTS}
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
                    {!isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleCollapsed}
                        className="w-8 h-8"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-8 h-8"
                        title="Close sidebar"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Search & New Chat Buttons */}
                {!isCollapsed && (
                  <>
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
                        leftIcon={<Search className="w-4 h-4" />}
                        className="bg-white/5 border-gray-600/30"
                      />
                    </motion.div>

                    <motion.div
                      className="flex gap-2 mt-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onNewChat?.()}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="flex-1"
                      >
                        New Chat
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onNewGroup?.()}
                        leftIcon={<Users className="w-4 h-4" />}
                      >
                        Group
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Navigation */}
              {renderNavigation()}

              {/* Conversations List */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {!isCollapsed && (
                    <div className="p-2">
                      {filteredConversations.length > 0 
                        ? filteredConversations.map(renderConversationItem)
                        : renderEmptyState()
                      }
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
                  {isCollapsed ? <Settings className="w-5 h-5" /> : 'Settings'}
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
