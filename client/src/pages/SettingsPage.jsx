import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download,
  Trash2,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  ArrowLeft,
  Save
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useUserPreferences } from '@/hooks/useAuth.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { preferences, actions } = useUserPreferences()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  // Settings tabs
  const tabs = [
    { id: 'general', label: 'General', icon: <User className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'data', label: 'Data & Storage', icon: <Download className="w-4 h-4" /> },
  ]

  const handleSave = useCallback(() => {
    toast.success('Settings saved successfully')
    setHasChanges(false)
  }, [toast])

  const handleBack = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmed) return
    }
    navigate('/chat')
  }, [hasChanges, navigate])

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark border-b border-gray-700/50 sticky top-0 z-10 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="w-10 h-10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-400">Manage your account and preferences</p>
              </div>
            </div>

            {hasChanges && (
              <Button
                variant="primary"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            )}
          </div>
        </motion.header>

        <div className="flex">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 glass-dark border-r border-gray-700/50 min-h-screen"
          >
            <div className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                      activeTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50'
                        : 'text-gray-300 hover:text-white'
                    )}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'general' && (
                  <GeneralSettings 
                    user={user} 
                    onUpdate={() => setHasChanges(true)} 
                  />
                )}
                {activeTab === 'notifications' && (
                  <NotificationSettings 
                    preferences={preferences} 
                    actions={actions}
                    onUpdate={() => setHasChanges(true)} 
                  />
                )}
                {activeTab === 'privacy' && (
                  <PrivacySettings 
                    onUpdate={() => setHasChanges(true)} 
                  />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceSettings 
                    preferences={preferences} 
                    actions={actions}
                    onUpdate={() => setHasChanges(true)} 
                  />
                )}
                {activeTab === 'data' && (
                  <DataStorageSettings 
                    onUpdate={() => setHasChanges(true)} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

// General Settings Component
const GeneralSettings = ({ user, onUpdate }) => {
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || ''
  })

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    onUpdate()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Profile Information</h2>
        <p className="text-gray-400 mb-6">Update your personal details and profile information.</p>
      </div>

      <div className="glass rounded-xl p-6 space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture</label>
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&size=80`}
              alt={user?.name}
              className="w-20 h-20 rounded-full ring-2 ring-gray-600/50"
            />
            <div className="space-y-2">
              <Button variant="secondary" size="sm">
                Change Photo
              </Button>
              <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            value={profileData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter your full name"
          />
          <Input
            label="Email Address"
            type="email"
            value={profileData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <Input
          label="Bio"
          value={profileData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Tell us about yourself"
          hint="Brief description for your profile"
        />

        <Input
          label="Location"
          value={profileData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Your location"
        />
      </div>
    </div>
  )
}

// Notification Settings Component
const NotificationSettings = ({ preferences, actions, onUpdate }) => {
  const toggleNotification = (key) => {
    actions.setNotifications({
      ...preferences.notifications,
      [key]: !preferences.notifications[key]
    })
    onUpdate()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Notifications</h2>
        <p className="text-gray-400 mb-6">Configure how you receive notifications.</p>
      </div>

      <div className="space-y-6">
        {/* Message Notifications */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Message Notifications</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="New Messages"
              description="Get notified when you receive new messages"
              checked={preferences.notifications.messages}
              onChange={() => toggleNotification('messages')}
            />
            <ToggleSetting
              label="Mentions"
              description="Get notified when someone mentions you"
              checked={preferences.notifications.mentions}
              onChange={() => toggleNotification('mentions')}
            />
            <ToggleSetting
              label="Sound Effects"
              description="Play sound for notifications"
              checked={preferences.notifications.sounds}
              onChange={() => toggleNotification('sounds')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Privacy Settings Component
const PrivacySettings = ({ onUpdate }) => {
  const [settings, setSettings] = useState({
    onlineStatus: true,
    lastSeen: true,
    readReceipts: true,
    profilePhoto: 'everyone'
  })

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    onUpdate()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Privacy & Security</h2>
        <p className="text-gray-400 mb-6">Control who can see your information and activity.</p>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Visibility</h3>
          <div className="space-y-4">
            <ToggleSetting
              label="Online Status"
              description="Show when you're online to other users"
              checked={settings.onlineStatus}
              onChange={() => handleToggle('onlineStatus')}
            />
            <ToggleSetting
              label="Last Seen"
              description="Show when you were last active"
              checked={settings.lastSeen}
              onChange={() => handleToggle('lastSeen')}
            />
            <ToggleSetting
              label="Read Receipts"
              description="Show when you've read messages"
              checked={settings.readReceipts}
              onChange={() => handleToggle('readReceipts')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Appearance Settings Component
const AppearanceSettings = ({ preferences, actions, onUpdate }) => {
  const themes = [
    { id: 'dark', name: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { id: 'light', name: 'Light', icon: <Sun className="w-4 h-4" /> },
  ]

  const languages = [
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Español' },
    { id: 'fr', name: 'Français' },
    { id: 'de', name: 'Deutsch' },
  ]

  const handleThemeChange = (themeId) => {
    actions.setTheme(themeId)
    onUpdate()
  }

  const handleLanguageChange = (languageId) => {
    actions.setLanguage(languageId)
    onUpdate()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Appearance</h2>
        <p className="text-gray-400 mb-6">Customize how Connexus looks and feels.</p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={clsx(
                  'flex items-center gap-3 p-4 rounded-lg border transition-all duration-200',
                  'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                  preferences.theme === theme.id
                    ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-400'
                    : 'border-gray-600/50 text-gray-300'
                )}
              >
                {theme.icon}
                <span className="font-medium">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Language</h3>
          <select
            value={preferences.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600/50 text-white focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// Data & Storage Settings Component
const DataStorageSettings = ({ onUpdate }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Data & Storage</h2>
        <p className="text-gray-400 mb-6">Manage your data usage and storage preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Storage Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Messages</span>
              <span className="text-white font-medium">2.4 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Media</span>
              <span className="text-white font-medium">1.2 GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Cache</span>
              <span className="text-white font-medium">0.3 GB</span>
            </div>
            <div className="pt-2 border-t border-gray-600/50">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">Total</span>
                <span className="text-white font-bold">3.9 GB</span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Button variant="secondary" className="w-full">
              Clear Cache
            </Button>
            <Button variant="danger" className="w-full" leftIcon={<Trash2 className="w-4 h-4" />}>
              Delete All Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toggle Setting Component
const ToggleSetting = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-600/50 hover:bg-white/5 transition-colors">
    <div>
      <p className="font-medium text-white">{label}</p>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={clsx(
        'relative w-12 h-6 rounded-full transition-colors duration-200',
        checked ? 'bg-cyan-500' : 'bg-gray-600'
      )}
    >
      <div
        className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
          checked && 'translate-x-6'
        )}
      />
    </button>
  </div>
)

export default SettingsPage
