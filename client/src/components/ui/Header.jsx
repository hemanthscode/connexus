import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  X, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button.jsx'
import Dropdown, { DropdownItem, DropdownSeparator } from './Dropdown.jsx'
import Input from './Input.jsx'

const Header = ({
  user = null,
  onMenuToggle,
  onSearch,
  onLogout,
  onSettings,
  onProfileClick,
  isSearching = false,
  searchValue = '',
  onSearchChange,
  showSearch = true,
  showNotifications = true,
  connectionStatus = 'connected', // connected, connecting, disconnected
  className = '',
  ...props
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [theme, setTheme] = useState('dark')

  // Mock notification count (replace with real data)
  const notificationCount = 3

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    // Implement theme switching logic here
  }

  const connectionIcons = {
    connected: <Wifi className="w-4 h-4 text-green-400" />,
    connecting: <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />,
    disconnected: <WifiOff className="w-4 h-4 text-red-400" />
  }

  const connectionMessages = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected'
  }

  // User menu items
  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      onClick: onProfileClick
    },
    {
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: onSettings
    },
    { type: 'separator' },
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      onClick: onLogout,
      variant: 'danger'
    }
  ]

  const getUserDisplayName = () => {
    if (!user) return 'Guest'
    return user.name || user.email || 'Unknown User'
  }

  const getUserAvatar = () => {
    if (user?.avatar) return user.avatar
    
    const name = getUserDisplayName()
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0ea5e9&color=fff&size=40&rounded=true&bold=true`
  }

  return (
    <motion.header
      className={clsx(
        'glass-dark border-b border-gray-700/50 backdrop-blur-xl',
        'sticky top-0 z-40 h-16',
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
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">
              Connexus
            </h1>
          </div>

          {/* Connection Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-gray-600/30">
            {connectionIcons[connectionStatus]}
            <span className={clsx(
              'text-xs font-medium',
              connectionStatus === 'connected' && 'text-green-400',
              connectionStatus === 'connecting' && 'text-yellow-400',
              connectionStatus === 'disconnected' && 'text-red-400'
            )}>
              {connectionMessages[connectionStatus]}
            </span>
          </div>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <motion.div
              animate={{
                scale: isSearchFocused ? 1.02 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <Input
                type="text"
                placeholder="Search conversations, users..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-white/5 border-gray-600/30"
                containerClassName="w-full"
              />
            </motion.div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search Button (Mobile) */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => onSearch?.()}
            >
              <Search className="w-5 h-5" />
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="hidden sm:flex"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* Notifications */}
          {showNotifications && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.span>
              )}
            </Button>
          )}

          {/* User Menu */}
          {user ? (
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <img
                    src={getUserAvatar()}
                    alt={getUserDisplayName()}
                    className="w-8 h-8 rounded-full ring-2 ring-cyan-400/30"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white truncate max-w-[120px]">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user.status || 'offline'}
                    </p>
                  </div>
                </div>
              }
              placement="bottom-end"
            >
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
          ) : (
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <motion.div
          className="md:hidden px-4 pb-4"
          initial={false}
          animate={{
            height: isSearchFocused ? 'auto' : 0,
            opacity: isSearchFocused ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <Input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-white/5 border-gray-600/30"
          />
        </motion.div>
      )}
    </motion.header>
  )
}

export default Header
