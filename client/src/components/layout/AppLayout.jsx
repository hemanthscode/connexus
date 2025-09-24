import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import Header from '../ui/Header.jsx'
import Sidebar from '../ui/Sidebar.jsx'
import { useToast } from '../ui/Toast.jsx'

const AppLayout = ({
  children,
  user = null,
  conversations = [],
  activeConversationId = null,
  onConversationSelect,
  onLogout,
  onSettings,
  onProfileClick,
  onNewChat,
  onNewGroup,
  connectionStatus = 'connected',
  className = '',
  sidebarProps = {},
  headerProps = {},
  ...props
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarSection, setSidebarSection] = useState('chats')
  const [searchValue, setSearchValue] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  const toast = useToast()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && activeConversationId) {
      setSidebarOpen(false)
    }
  }, [activeConversationId, isMobile])

  // Connection status notifications
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      toast.error('Connection lost. Trying to reconnect...', { duration: 0 })
    } else if (connectionStatus === 'connected') {
      toast.success('Connected', { duration: 2000 })
    }
  }, [connectionStatus, toast])

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleSearch = () => {
    if (isMobile) {
      setSidebarOpen(true)
    }
  }

  const mainVariants = {
    sidebarOpen: {
      marginLeft: isMobile ? 0 : sidebarOpen ? '320px' : '0px',
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    sidebarClosed: {
      marginLeft: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  }

  return (
    <div className={clsx('h-screen bg-dark-bg flex overflow-hidden', className)} {...props}>
      {/* Sidebar */}
      <AnimatePresence>
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onClose={handleSidebarClose}
          activeSection={sidebarSection}
          onSectionChange={setSidebarSection}
          conversations={conversations}
          onConversationSelect={onConversationSelect}
          activeConversationId={activeConversationId}
          onNewChat={onNewChat}
          onNewGroup={onNewGroup}
          user={user}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isMobile={isMobile}
          {...sidebarProps}
        />
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        variants={mainVariants}
        animate={isMobile ? 'sidebarClosed' : (sidebarOpen ? 'sidebarOpen' : 'sidebarClosed')}
      >
        {/* Header */}
        <Header
          user={user}
          onMenuToggle={handleSidebarToggle}
          onSearch={handleSearch}
          onLogout={onLogout}
          onSettings={onSettings}
          onProfileClick={onProfileClick}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          connectionStatus={connectionStatus}
          {...headerProps}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeConversationId || 'welcome'}
              className="h-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Connection Status Overlay */}
      <AnimatePresence>
        {connectionStatus === 'connecting' && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center py-2 px-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white mr-2" />
              <span className="text-white text-sm font-medium">Reconnecting...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Overlay */}
      <AnimatePresence>
        {connectionStatus === 'disconnected' && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-sm"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center py-2 px-4">
              <span className="text-white text-sm font-medium">No internet connection</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AppLayout
