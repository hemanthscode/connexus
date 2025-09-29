import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout.jsx'
import ChatLayout from '@/components/layout/ChatLayout.jsx'
import MessageList, { EmptyMessageList } from '@/components/chat/MessageList.jsx'
import MessageInput from '@/components/chat/MessageInput.jsx'
import UserSearch from '@/components/chat/UserSearch.jsx'
import ReplyPreview from '@/components/chat/ReplyPreview.jsx'
import { useChat } from '@/hooks/useChat.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useSocket } from '@/hooks/useSocket.jsx'
import { useUI } from '@/store/uiSlice.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Configuration constants
const CHAT_CONFIG = {
  TOAST_MESSAGES: {
    NEW_CONVERSATION: 'New conversation started',
    GROUP_CREATED: 'Group created successfully',
    PARTICIPANTS_ADDED: (count) => `Added ${count} participant(s)`,
    FEATURE_COMING_SOON: {
      VOICE_CALL: 'Voice calling feature coming soon!',
      VIDEO_CALL: 'Video calling feature coming soon!',
      INFO: 'Conversation info feature coming soon!',
      SETTINGS: 'Conversation settings feature coming soon!',
      FORWARD: 'Forward message feature coming soon!',
      PIN: 'Pin conversation feature coming soon!',
      ARCHIVE: 'Archive conversation feature coming soon!',
      DELETE: 'Delete conversation feature coming soon!'
    }
  },
  CONFIRM_MESSAGES: {
    LOGOUT: 'Are you sure you want to sign out?'
  }
}

const ChatPage = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  // Hooks
  const { user, logout } = useAuth()
  const { 
    conversations, 
    setActiveConversation, 
    activeConversationId,
    getConversationById,
    isInitialized 
  } = useChat()
  const { connectionStatus } = useSocket()
  
  // UI Store - using your Zustand store structure
  const uiStore = useUI()
  const {
    userSelectModal,
    openUserSelectModal,
    closeUserSelectModal,
    openSettingsModal,
    openProfileModal
  } = uiStore

  // Local state
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Navigation refs to prevent loops
  const lastConversationIdRef = useRef(conversationId)
  const lastActiveConversationIdRef = useRef(activeConversationId)

  // Memoized active conversation
  const activeConversation = useMemo(() => getConversationById(activeConversationId), [getConversationById, activeConversationId])

  // Navigation effects
  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId
      
      if (conversationId && conversationId !== activeConversationId) {
        setActiveConversation(conversationId)
      } else if (!conversationId && activeConversationId) {
        setActiveConversation(null)
      }
    }
  }, [conversationId, activeConversationId, setActiveConversation])

  useEffect(() => {
    if (activeConversationId !== lastActiveConversationIdRef.current) {
      lastActiveConversationIdRef.current = activeConversationId
      
      if (activeConversationId && activeConversationId !== conversationId) {
        navigate(`/chat/${activeConversationId}`, { replace: true })
      } else if (!activeConversationId && conversationId) {
        navigate('/chat', { replace: true })
      }
    }
  }, [activeConversationId, conversationId, navigate])

  // Memoized handlers
  const handlers = useMemo(() => ({
    // Navigation and selection
    handleConversationSelect: (selectedConversationId) => {
      if (selectedConversationId !== activeConversationId) {
        setActiveConversation(selectedConversationId)
      }
    },

    // User actions - using your store structure
    handleNewChat: () => {
      openUserSelectModal({
        mode: 'newChat',
        onSuccess: (conversation) => {
          setActiveConversation(conversation._id)
          toast.success(CHAT_CONFIG.TOAST_MESSAGES.NEW_CONVERSATION)
          closeUserSelectModal()
        }
      })
    },

    handleNewGroup: () => {
      openUserSelectModal({
        mode: 'newGroup',
        onSuccess: (group) => {
          setActiveConversation(group._id)
          toast.success(CHAT_CONFIG.TOAST_MESSAGES.GROUP_CREATED)
          closeUserSelectModal()
        }
      })
    },

    handleAddParticipants: () => {
      if (activeConversation?.type === 'group') {
        openUserSelectModal({
          mode: 'addToGroup',
          existingGroup: activeConversation,
          onSuccess: (users) => {
            toast.success(CHAT_CONFIG.TOAST_MESSAGES.PARTICIPANTS_ADDED(users.length))
            closeUserSelectModal()
          }
        })
      }
    },

    // Message actions
    handleReply: (message) => setReplyToMessage(message),
    handleCancelReply: () => setReplyToMessage(null),
    handleSearchToggle: () => setIsSearchOpen(prev => !prev),

    // Feature placeholders (coming soon)
    handleCall: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.VOICE_CALL),
    handleVideoCall: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.VIDEO_CALL),
    handleConversationInfo: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.INFO),
    handleConversationSettings: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.SETTINGS),
    handleTogglePin: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.PIN),
    handleArchive: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.ARCHIVE),
    handleDelete: () => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.DELETE),

    // App-level actions - using your store methods
    handleSettings: () => openSettingsModal('general'),
    handleProfileClick: () => openProfileModal(user?._id, 'view'),

    handleLogout: async () => {
      const confirmed = window.confirm(CHAT_CONFIG.CONFIRM_MESSAGES.LOGOUT)
      if (confirmed) {
        await logout()
        navigate('/login')
      }
    }
  }), [
    activeConversationId, 
    activeConversation, 
    setActiveConversation, 
    openUserSelectModal, 
    closeUserSelectModal,
    openSettingsModal, 
    openProfileModal, 
    user?._id, 
    toast, 
    logout, 
    navigate
  ])

  // Loading state
  if (!isInitialized) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppLayout
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={handlers.handleConversationSelect}
        onLogout={handlers.handleLogout}
        onSettings={handlers.handleSettings}
        onProfileClick={handlers.handleProfileClick}
        onNewChat={handlers.handleNewChat}
        onNewGroup={handlers.handleNewGroup}
        connectionStatus={connectionStatus}
      >
        <ChatLayout
          conversation={activeConversation}
          user={user}
          onCall={handlers.handleCall}
          onVideoCall={handlers.handleVideoCall}
          onSearchToggle={handlers.handleSearchToggle}
          onConversationInfo={handlers.handleConversationInfo}
          onConversationSettings={handlers.handleConversationSettings}
          onAddParticipants={handlers.handleAddParticipants}
          onTogglePin={handlers.handleTogglePin}
          onArchive={handlers.handleArchive}
          onDelete={handlers.handleDelete}
          isSearchOpen={isSearchOpen}
          showHeader={true}
        >
          {activeConversation ? (
            <div className="flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  conversationId={activeConversationId}
                  onReply={handlers.handleReply}
                  onPin={handlers.handleTogglePin}
                  onForward={() => toast.info(CHAT_CONFIG.TOAST_MESSAGES.FEATURE_COMING_SOON.FORWARD)}
                  showScrollToBottom={true}
                />
              </div>

              {/* Reply Preview */}
              <AnimatePresence>
                {replyToMessage && (
                  <div className="border-t border-gray-700/50 p-4">
                    <ReplyPreview
                      message={replyToMessage}
                      onCancel={handlers.handleCancelReply}
                      compact={false}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* Message Input */}
              <div className="border-t border-gray-700/50">
                <MessageInput
                  conversationId={activeConversationId}
                  replyToMessage={replyToMessage}
                  onCancelReply={handlers.handleCancelReply}
                  disabled={!activeConversation}
                />
              </div>
            </div>
          ) : (
            <EmptyMessageList
              conversationName="someone new"
              onStartChat={handlers.handleNewChat}
            />
          )}
        </ChatLayout>
      </AppLayout>

      {/* User Search Modal - using your store structure */}
      <UserSearch
        isOpen={userSelectModal?.open || false}
        onClose={closeUserSelectModal}
        mode={userSelectModal?.mode || 'newChat'}
        onSuccess={userSelectModal?.onSuccess || (() => {})}
        existingGroup={userSelectModal?.existingGroup || null}
      />
    </>
  )
}

export default ChatPage
