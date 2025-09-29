import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Menu, Settings, LogOut, User, Bell, Moon, Sun, Wifi, WifiOff
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from './Dropdown.jsx'

// Configuration constants
const CONNECTION_CONFIG = {
  connected: {
    icon: Wifi,
    message: 'Connected',
    color: 'text-green-400'
  },
  connecting: {
    icon: Wifi,
    message: 'Connecting...',
    color: 'text-yellow-400',
    animate: 'animate-pulse'
  },
  disconnected: {
    icon: WifiOff,
    message: 'Disconnected', 
    color: 'text-red-400'
  }
}

const Header = ({
  user = null,
  onMenuToggle,
  onLogout,
  showNotifications = true,
  connectionStatus = 'connected',
  sidebarOpen = false,
  isMobile = false,
  className = '',
  ...props
}) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
    return saved
  })
  
  const navigate = useNavigate()
  const notificationCount = user?.unreadNotifications || 0

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Memoized user utilities
  const userUtils = useMemo(() => {
    if (!user) return { displayName: 'Guest', avatar: null }

    const displayName = user.displayName || user.name || user.email?.split('@')[0] || 'User'
    const initials = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    
    const avatar = user.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0ea5e9&color=fff&size=40&rounded=true&bold=true`

    return { displayName, avatar }
  }, [user])

  // Memoized user menu items
  const userMenuItems = useMemo(() => [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/profile')
    },
    {
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/settings')
    },
    {
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      onClick: handleThemeToggle
    },
    { type: 'separator' },
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      onClick: onLogout,
      variant: 'danger'
    }
  ], [theme, navigate, onLogout, handleThemeToggle])

  // Connection status configuration
  const currentConnection = CONNECTION_CONFIG[connectionStatus] || CONNECTION_CONFIG.disconnected
  const ConnectionIcon = currentConnection.icon

  const renderConnectionStatus = (isMobile = false) => (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-gray-600/30',
      isMobile && 'w-fit mx-auto'
    )}>
      <ConnectionIcon className={clsx('w-4 h-4', currentConnection.color, currentConnection.animate)} />
      <span className={clsx('text-xs font-medium', currentConnection.color)}>
        {currentConnection.message}
      </span>
    </div>
  )

  const renderUserMenu = () => (
    <Dropdown
      trigger={
        <motion.div
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <img
            src={userUtils.avatar}
            alt={userUtils.displayName}
            className="w-8 h-8 rounded-full ring-2 ring-cyan-400/30"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userUtils.displayName)}&background=6b7280&color=fff&size=32`
            }}
          />
          <div className="hidden lg:block text-left min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-[120px]">
              {userUtils.displayName}
            </p>
            <p className="text-xs text-gray-400 capitalize truncate">
              {user.status === 'online' ? (
                <span className="text-green-400">● Online</span>
              ) : (
                <span className="text-gray-400">○ {user.status || 'Offline'}</span>
              )}
            </p>
          </div>
        </motion.div>
      }
      placement="bottom-end"
    >
      {/* Mobile user info */}
      <div className="px-3 py-2 border-b border-gray-600/30 lg:hidden">
        <p className="text-sm font-medium text-white">{userUtils.displayName}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>

      {userMenuItems.map((item, index) => (
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
  )

  return (
    <motion.header
      className={clsx(
        'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
        'sticky top-0 z-40 h-16 flex-shrink-0',
        className
      )}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className={clsx(
              'transition-transform duration-200',
              sidebarOpen && isMobile && 'rotate-90'
            )}
            title="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">Connexus</h1>
              <p className="text-xs text-gray-400 -mt-1">Chat App</p>
            </div>
          </div>
        </div>

        {/* Center Section - Connection Status (Desktop) */}
        <div className="hidden md:flex">
          {renderConnectionStatus()}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="hidden sm:flex"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          {showNotifications && user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => console.log('Notifications clicked')}
              className="relative"
              title={`${notificationCount} notifications`}
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              )}
            </Button>
          )}

          {/* User Menu or Sign In */}
          {user ? (
            renderUserMenu()
          ) : (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Connection Status */}
      <div className="md:hidden px-4 pb-2">
        {renderConnectionStatus(true)}
      </div>
    </motion.header>
  )
}

export default Header
