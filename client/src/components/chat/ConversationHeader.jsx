import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Phone, 
  Video, 
  Search, 
  MoreVertical,
  Info,
  Settings,
  UserPlus,
  Pin,
  Archive,
  Trash2,
  Star,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useOnlineUsers } from '@/hooks/useOnlineUsers.jsx'
import { formatLastSeen } from '@/utils/formatters.js'

const ConversationHeader = ({
  conversation,
  onBack,
  onCall,
  onVideoCall,
  onSearch,
  onInfo,
  onSettings,
  onAddParticipants,
  onPin,
  onArchive,
  onDelete,
  onMute,
  isSearchOpen = false,
  showBackButton = false,
  className = '',
  ...props
}) => {
  const { user } = useAuth()
  const { getUserOnlineStatus } = useOnlineUsers()
  
  const [showParticipants, setShowParticipants] = useState(false)

  // Get conversation info
  const getConversationInfo = useCallback(() => {
    if (!conversation) return null

    if (conversation.type === 'group') {
      return {
        name: conversation.name || 'Unnamed Group',
        avatar: conversation.avatar,
        subtitle: `${conversation.participants?.length || 0} participants`,
        isOnline: false,
        canCall: false
      }
    }

    // Direct conversation
    const otherParticipant = conversation.participants?.find(
      p => p.user._id !== user?._id
    )
    
    if (!otherParticipant) {
      return {
        name: 'Unknown User',
        avatar: null,
        subtitle: 'Offline',
        isOnline: false,
        canCall: false
      }
    }

    const status = getUserOnlineStatus(otherParticipant.user._id)
    const isOnline = status === 'online'
    
    return {
      name: otherParticipant.user.name || 'Unknown User',
      avatar: otherParticipant.user.avatar,
      subtitle: isOnline 
        ? 'Active now' 
        : formatLastSeen(otherParticipant.user.lastSeen),
      isOnline,
      canCall: true
    }
  }, [conversation, user, getUserOnlineStatus])

  const info = getConversationInfo()

  // Menu items
  const getMenuItems = useCallback(() => {
    if (!conversation) return []

    const items = [
      {
        label: 'Conversation Info',
        icon: <Info className="w-4 h-4" />,
        onClick: onInfo
      },
      {
        label: 'Search Messages',
        icon: <Search className="w-4 h-4" />,
        onClick: onSearch
      }
    ]

    // Conversation actions
    items.push(
      {
        label: conversation.isPinned ? 'Unpin Chat' : 'Pin Chat',
        icon: <Pin className="w-4 h-4" />,
        onClick: onPin
      },
      {
        label: conversation.isMuted ? 'Unmute' : 'Mute',
        icon: conversation.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />,
        onClick: onMute
      },
      {
        label: 'Star Chat',
        icon: <Star className="w-4 h-4" />,
        onClick: () => {/* Handle star */}
      }
    )

    // Group-specific actions
    if (conversation.type === 'group') {
      items.push(
        { type: 'separator' },
        {
          label: 'Add Participants',
          icon: <UserPlus className="w-4 h-4" />,
          onClick: onAddParticipants
        },
        {
          label: 'Group Settings',
          icon: <Settings className="w-4 h-4" />,
          onClick: onSettings
        }
      )
    }

    items.push(
      { type: 'separator' },
      {
        label: 'Archive Chat',
        icon: <Archive className="w-4 h-4" />,
        onClick: onArchive
      },
      {
        label: 'Delete Chat',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: onDelete,
        variant: 'danger'
      }
    )

    return items
  }, [conversation, onInfo, onSearch, onPin, onMute, onAddParticipants, onSettings, onArchive, onDelete])

  if (!conversation || !info) {
    return (
      <div className={clsx(
        'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
        'px-4 py-3 h-16 flex items-center',
        className
      )}>
        <ConversationHeaderSkeleton />
      </div>
    )
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
        'px-4 py-3 flex items-center justify-between relative z-30',
        className
      )}
      {...props}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Back Button (Mobile) */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden w-8 h-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer"
            onClick={onInfo}
          >
            {info.avatar ? (
              <img
                src={info.avatar}
                alt={info.name}
                className="w-10 h-10 rounded-full ring-2 ring-gray-600/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-600/30">
                <span className="text-white font-semibold text-sm">
                  {info.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </motion.div>

          {/* Online indicator */}
          {info.isOnline && conversation.type === 'direct' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-surface" />
          )}

          {/* Group indicator */}
          {conversation.type === 'group' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-dark-surface flex items-center justify-center">
              <Users className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Name and Status */}
        <div className="flex-1 min-w-0">
          <motion.h2
            className="font-semibold text-white truncate cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={onInfo}
            whileHover={{ scale: 1.02 }}
          >
            {info.name}
          </motion.h2>
          
          <div className="flex items-center gap-2">
            <p className={clsx(
              'text-sm truncate',
              info.isOnline ? 'text-green-400' : 'text-gray-400'
            )}>
              {info.subtitle}
            </p>

            {/* Conversation indicators */}
            <div className="flex items-center gap-1">
              {conversation.isPinned && (
                <Pin className="w-3 h-3 text-yellow-400" />
              )}
              {conversation.isMuted && (
                <VolumeX className="w-3 h-3 text-gray-400" />
              )}
              {conversation.isStarred && (
                <Star className="w-3 h-3 text-yellow-400" />
              )}
            </div>
          </div>
        </div>

        {/* Participants Preview (Groups) */}
        {conversation.type === 'group' && conversation.participants && (
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex -space-x-2 hover:space-x-0 transition-all duration-200"
            >
              {conversation.participants.slice(0, 3).map((participant, index) => (
                <img
                  key={participant.user._id}
                  src={participant.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user.name || 'U')}&size=24`}
                  alt={participant.user.name}
                  className="w-6 h-6 rounded-full border-2 border-dark-surface hover:z-10 transition-all duration-200"
                  title={participant.user.name}
                />
              ))}
              {conversation.participants.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-dark-surface flex items-center justify-center text-xs text-white">
                  +{conversation.participants.length - 3}
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Call Buttons (Direct chats only) */}
        {info.canCall && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCall}
              className="w-9 h-9"
              title="Voice call"
            >
              <Phone className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="w-9 h-9"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Search Toggle */}
        <Button
          variant={isSearchOpen ? 'primary' : 'ghost'}
          size="icon"
          onClick={onSearch}
          className="w-9 h-9"
          title="Search messages"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* More Options */}
        <Dropdown
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          }
          placement="bottom-end"
        >
          {getMenuItems().map((item, index) => (
            item.type === 'separator' ? (
              <DropdownSeparator key={index} />
            ) : (
              <DropdownItem
                key={index}
                onClick={item.onClick}
                variant={item.variant}
                leftIcon={item.icon}
              >
                {item.label}
              </DropdownItem>
            )
          ))}
        </Dropdown>
      </div>

      {/* Participants Dropdown */}
      <AnimatePresence>
        {showParticipants && conversation.type === 'group' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 glass border-b border-gray-700/50 p-4 z-20"
          >
            <div className="flex flex-wrap gap-2">
              {conversation.participants?.map((participant) => (
                <div
                  key={participant.user._id}
                  className="flex items-center gap-2 glass rounded-lg px-3 py-2"
                >
                  <img
                    src={participant.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.user.name || 'U')}&size=24`}
                    alt={participant.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-white">
                    {participant.user.name}
                  </span>
                  {participant.role === 'admin' && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

// Loading skeleton
const ConversationHeaderSkeleton = () => (
  <div className="flex items-center gap-3 w-full">
    <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-600 rounded w-1/3 animate-pulse" />
      <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse" />
    </div>
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-lg bg-gray-700 animate-pulse" />
      <div className="w-9 h-9 rounded-lg bg-gray-700 animate-pulse" />
      <div className="w-9 h-9 rounded-lg bg-gray-700 animate-pulse" />
    </div>
  </div>
)

export default ConversationHeader
