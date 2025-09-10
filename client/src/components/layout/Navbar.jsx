import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, LogOut, User, X, ArrowLeft } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * Navigation Bar Component - Fixed positioning for mobile
 */
const Navbar = ({ onToggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/login')
  }

  const handleProfileClick = () => {
    setShowUserMenu(false)
    setShowProfileModal(true)
  }

  const handleEditProfileClick = () => {
    setShowProfileModal(false)
    navigate('/profile')
  }

  const handleCloseProfile = () => {
    setShowProfileModal(false)
    navigate('/chat')
  }

  return (
    <>
      {/* Fixed navbar with proper z-index */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            {/* Only show menu button on small screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="lg:hidden p-2"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link 
              to="/chat"
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Connexus
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              )}
            </Button>

            <button
              onClick={() => setShowUserMenu(true)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-all"
              aria-label="User menu"
            >
              <Avatar
                name={user?.name}
                src={user?.avatar}
                size="sm"
              />
            </button>
          </div>
        </div>
      </nav>

      {/* User Menu Modal */}
      <Modal
        open={showUserMenu}
        onClose={() => setShowUserMenu(false)}
        title="Account Menu"
      >
        <div className="space-y-4">
          <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-600">
            <Avatar
              name={user?.name}
              src={user?.avatar}
              size="lg"
              className="mx-auto mb-3"
            />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {user?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
          
          <div className="space-y-1">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <User className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-white">Profile Settings</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </Modal>

      {/* Profile Settings Modal */}
      <Modal
        open={showProfileModal}
        onClose={handleCloseProfile}
        title="Profile Settings"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Avatar
              name={user?.name}
              src={user?.avatar}
              size="xl"
              className="mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {user?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md mt-1 capitalize transition-colors">
                {user?.status || 'online'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member since</label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md mt-1 transition-colors">
                January 2024
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last active</label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md mt-1 transition-colors">
                Just now
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="secondary"
              onClick={handleCloseProfile}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
            <Button
              onClick={handleEditProfileClick}
              className="flex items-center gap-2 flex-1"
            >
              <User className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Navbar
