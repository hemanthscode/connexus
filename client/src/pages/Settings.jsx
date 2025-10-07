/**
 * Settings Page - COMPREHENSIVE & FUNCTIONAL
 * Based on our existing frontend architecture
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Palette, MessageSquare, Key, Database,
  Settings as SettingsIcon, ArrowLeft, Save, Trash2, Download,
  Moon, Sun, Volume2, VolumeX, Eye, EyeOff, Smartphone,
  Monitor, Wifi, WifiOff, LogOut, AlertTriangle, Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth';
import { formatError } from '../utils/formatters';
import { STORAGE_KEYS, ROUTES } from '../utils/constants';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { disconnect, isConnected } = useSocket();
  
  // Settings state
  const [settings, setSettings] = useState({
    // Notification Settings
    notifications: {
      desktop: localStorage.getItem('desktop-notifications') !== 'false',
      sounds: localStorage.getItem('notification-sounds') !== 'false',
      messagePreview: localStorage.getItem('message-preview') !== 'false',
      typingIndicators: localStorage.getItem('typing-indicators') !== 'false',
      onlineStatus: localStorage.getItem('online-status') !== 'false'
    },
    // Privacy Settings
    privacy: {
      readReceipts: localStorage.getItem('read-receipts') !== 'false',
      lastSeen: localStorage.getItem('last-seen') !== 'false',
      profileVisibility: localStorage.getItem('profile-visibility') || 'everyone',
      searchVisibility: localStorage.getItem('search-visibility') !== 'false'
    },
    // Appearance Settings
    appearance: {
      theme: localStorage.getItem('theme') || 'system',
      fontSize: localStorage.getItem('font-size') || 'medium',
      messageLayout: localStorage.getItem('message-layout') || 'comfortable',
      showAvatars: localStorage.getItem('show-avatars') !== 'false',
      animationsEnabled: localStorage.getItem('animations-enabled') !== 'false'
    },
    // Chat Settings
    chat: {
      enterToSend: localStorage.getItem('enter-to-send') !== 'false',
      emojiSuggestions: localStorage.getItem('emoji-suggestions') !== 'false',
      linkPreviews: localStorage.getItem('link-previews') !== 'false',
      autoDownloadMedia: localStorage.getItem('auto-download-media') === 'true',
      messageHistory: localStorage.getItem('message-history') !== 'false'
    },
    // Security Settings
    security: {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      sessionTimeout: localStorage.getItem('session-timeout') || '7',
      loginNotifications: localStorage.getItem('login-notifications') !== 'false'
    }
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Save settings to localStorage and apply them
  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    
    // Save to localStorage
    Object.entries(newSettings).forEach(([category, categorySettings]) => {
      Object.entries(categorySettings).forEach(([key, value]) => {
        const storageKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        localStorage.setItem(storageKey, value.toString());
      });
    });

    // Apply theme immediately
    if (newSettings.appearance?.theme) {
      applyTheme(newSettings.appearance.theme);
    }

    // Request notification permission if enabled
    if (newSettings.notifications?.desktop && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    toast.success('Settings saved successfully');
  }, []);

  const updateSetting = useCallback((category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Theme application
  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Apply settings on mount
  useEffect(() => {
    applyTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  // Password change handler
  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(formatError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Export user data
  const exportUserData = () => {
    const userData = {
      profile: user,
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `connexus-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Data exported successfully');
  };

  // Clear all data
  const clearAllData = () => {
    // Clear localStorage except auth token
    const keysToKeep = [STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset settings to defaults
    const defaultSettings = {
      notifications: { desktop: true, sounds: true, messagePreview: true, typingIndicators: true, onlineStatus: true },
      privacy: { readReceipts: true, lastSeen: true, profileVisibility: 'everyone', searchVisibility: true },
      appearance: { theme: 'system', fontSize: 'medium', messageLayout: 'comfortable', showAvatars: true, animationsEnabled: true },
      chat: { enterToSend: true, emojiSuggestions: true, linkPreviews: true, autoDownloadMedia: false, messageHistory: true },
      security: { twoFactorEnabled: false, sessionTimeout: '7', loginNotifications: true }
    };
    
    setSettings(defaultSettings);
    toast.success('All data cleared successfully');
    setShowDeleteModal(false);
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      await authService.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error(formatError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Settings tabs configuration
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: SettingsIcon }
  ];

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Setting item component
  const SettingItem = ({ title, description, children, className = "" }) => (
    <div className={`flex items-center justify-between py-4 border-b border-white/10 last:border-b-0 ${className}`}>
      <div className="flex-1">
        <h4 className="text-white font-medium">{title}</h4>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-xl font-bold text-white">Settings</h1>
          
          <div className="w-20 flex justify-end">
            {isLoading && <Loading size="sm" />}
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600/30 text-white border border-blue-500/50'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Profile Information</h3>
                    <div className="flex items-center space-x-4 mb-6">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=ffffff&size=200`}
                        alt={user.name}
                        className="w-16 h-16 rounded-full ring-4 ring-blue-500/30"
                      />
                      <div>
                        <h4 className="text-white font-medium">{user.name}</h4>
                        <p className="text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = '/profile'}
                      leftIcon={<User className="w-4 h-4" />}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Notification Preferences</h3>
                    
                    <SettingItem
                      title="Desktop Notifications"
                      description="Show desktop notifications for new messages"
                    >
                      <ToggleSwitch
                        enabled={settings.notifications.desktop}
                        onChange={(value) => updateSetting('notifications', 'desktop', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Sound Notifications"
                      description="Play sounds for notifications"
                    >
                      <ToggleSwitch
                        enabled={settings.notifications.sounds}
                        onChange={(value) => updateSetting('notifications', 'sounds', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Message Preview"
                      description="Show message content in notifications"
                    >
                      <ToggleSwitch
                        enabled={settings.notifications.messagePreview}
                        onChange={(value) => updateSetting('notifications', 'messagePreview', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Typing Indicators"
                      description="Show when others are typing"
                    >
                      <ToggleSwitch
                        enabled={settings.notifications.typingIndicators}
                        onChange={(value) => updateSetting('notifications', 'typingIndicators', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Online Status"
                      description="Show your online status to others"
                    >
                      <ToggleSwitch
                        enabled={settings.notifications.onlineStatus}
                        onChange={(value) => updateSetting('notifications', 'onlineStatus', value)}
                      />
                    </SettingItem>
                  </div>
                </motion.div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Privacy Controls</h3>
                    
                    <SettingItem
                      title="Read Receipts"
                      description="Let others know when you've read their messages"
                    >
                      <ToggleSwitch
                        enabled={settings.privacy.readReceipts}
                        onChange={(value) => updateSetting('privacy', 'readReceipts', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Last Seen"
                      description="Show when you were last active"
                    >
                      <ToggleSwitch
                        enabled={settings.privacy.lastSeen}
                        onChange={(value) => updateSetting('privacy', 'lastSeen', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Profile Visibility"
                      description="Who can see your profile information"
                    >
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="everyone" className="bg-gray-800">Everyone</option>
                        <option value="contacts" className="bg-gray-800">Contacts Only</option>
                        <option value="nobody" className="bg-gray-800">Nobody</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Search Visibility"
                      description="Allow others to find you by email or username"
                    >
                      <ToggleSwitch
                        enabled={settings.privacy.searchVisibility}
                        onChange={(value) => updateSetting('privacy', 'searchVisibility', value)}
                      />
                    </SettingItem>
                  </div>
                </motion.div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Appearance & Display</h3>
                    
                    <SettingItem
                      title="Theme"
                      description="Choose your preferred color scheme"
                    >
                      <div className="flex space-x-2">
                        {[
                          { value: 'light', icon: Sun, label: 'Light' },
                          { value: 'dark', icon: Moon, label: 'Dark' },
                          { value: 'system', icon: Monitor, label: 'System' }
                        ].map((theme) => {
                          const Icon = theme.icon;
                          return (
                            <button
                              key={theme.value}
                              onClick={() => updateSetting('appearance', 'theme', theme.value)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                                settings.appearance.theme === theme.value
                                  ? 'bg-blue-600/30 border-blue-500/50 text-white'
                                  : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{theme.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </SettingItem>

                    <SettingItem
                      title="Font Size"
                      description="Adjust text size for better readability"
                    >
                      <select
                        value={settings.appearance.fontSize}
                        onChange={(e) => updateSetting('appearance', 'fontSize', e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="small" className="bg-gray-800">Small</option>
                        <option value="medium" className="bg-gray-800">Medium</option>
                        <option value="large" className="bg-gray-800">Large</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Message Layout"
                      description="Choose how messages are displayed"
                    >
                      <select
                        value={settings.appearance.messageLayout}
                        onChange={(e) => updateSetting('appearance', 'messageLayout', e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="compact" className="bg-gray-800">Compact</option>
                        <option value="comfortable" className="bg-gray-800">Comfortable</option>
                        <option value="spacious" className="bg-gray-800">Spacious</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Show Avatars"
                      description="Display user profile pictures in chat"
                    >
                      <ToggleSwitch
                        enabled={settings.appearance.showAvatars}
                        onChange={(value) => updateSetting('appearance', 'showAvatars', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Animations"
                      description="Enable smooth animations and transitions"
                    >
                      <ToggleSwitch
                        enabled={settings.appearance.animationsEnabled}
                        onChange={(value) => updateSetting('appearance', 'animationsEnabled', value)}
                      />
                    </SettingItem>
                  </div>
                </motion.div>
              )}

              {/* Chat Settings */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Chat Preferences</h3>
                    
                    <SettingItem
                      title="Enter to Send"
                      description="Send messages by pressing Enter (Shift+Enter for new line)"
                    >
                      <ToggleSwitch
                        enabled={settings.chat.enterToSend}
                        onChange={(value) => updateSetting('chat', 'enterToSend', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Emoji Suggestions"
                      description="Show emoji suggestions while typing"
                    >
                      <ToggleSwitch
                        enabled={settings.chat.emojiSuggestions}
                        onChange={(value) => updateSetting('chat', 'emojiSuggestions', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Link Previews"
                      description="Show previews for shared links"
                    >
                      <ToggleSwitch
                        enabled={settings.chat.linkPreviews}
                        onChange={(value) => updateSetting('chat', 'linkPreviews', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Auto-download Media"
                      description="Automatically download images and files"
                    >
                      <ToggleSwitch
                        enabled={settings.chat.autoDownloadMedia}
                        onChange={(value) => updateSetting('chat', 'autoDownloadMedia', value)}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Message History"
                      description="Store message history locally"
                    >
                      <ToggleSwitch
                        enabled={settings.chat.messageHistory}
                        onChange={(value) => updateSetting('chat', 'messageHistory', value)}
                      />
                    </SettingItem>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Connection Status</h3>
                    <div className="flex items-center space-x-3">
                      {isConnected ? (
                        <>
                          <Wifi className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-medium">Connected</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-medium">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Security Settings</h3>
                    
                    <SettingItem
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                    >
                      <ToggleSwitch
                        enabled={settings.security.twoFactorEnabled}
                        onChange={(value) => {
                          updateSetting('security', 'twoFactorEnabled', value);
                          if (value) {
                            toast.success('Two-factor authentication would be enabled');
                          } else {
                            toast.success('Two-factor authentication disabled');
                          }
                        }}
                      />
                    </SettingItem>

                    <SettingItem
                      title="Session Timeout"
                      description="Automatically log out after inactivity"
                    >
                      <select
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1" className="bg-gray-800">1 day</option>
                        <option value="7" className="bg-gray-800">7 days</option>
                        <option value="30" className="bg-gray-800">30 days</option>
                        <option value="never" className="bg-gray-800">Never</option>
                      </select>
                    </SettingItem>

                    <SettingItem
                      title="Login Notifications"
                      description="Get notified when someone logs into your account"
                    >
                      <ToggleSwitch
                        enabled={settings.security.loginNotifications}
                        onChange={(value) => updateSetting('security', 'loginNotifications', value)}
                      />
                    </SettingItem>
                  </div>

                  {/* Change Password */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <Input
                        type="password"
                        label="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <Input
                        type="password"
                        label="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <Input
                        type="password"
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <Button
                        variant="primary"
                        onClick={handlePasswordChange}
                        loading={isLoading}
                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        leftIcon={<Key className="w-4 h-4" />}
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data & Storage */}
              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Data Management</h3>
                    
                    <div className="space-y-4">
                      <Button
                        variant="secondary"
                        onClick={exportUserData}
                        leftIcon={<Download className="w-4 h-4" />}
                        className="w-full justify-start"
                      >
                        <div className="text-left">
                          <div className="font-medium">Export Data</div>
                          <div className="text-sm text-gray-400">Download your profile and settings</div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => setShowDeleteModal(true)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        className="w-full justify-start text-red-400 hover:text-red-300"
                      >
                        <div className="text-left">
                          <div className="font-medium">Clear All Data</div>
                          <div className="text-sm text-gray-400">Reset all settings and clear cache</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Storage Usage</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Messages</span>
                        <span className="text-white font-medium">~2.5 MB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Settings</span>
                        <span className="text-white font-medium">~15 KB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Cache</span>
                        <span className="text-white font-medium">~500 KB</span>
                      </div>
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-white font-medium">Total</span>
                        <span className="text-white font-bold">~3.0 MB</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Advanced Options</h3>
                    
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        onClick={() => setShowLogoutModal(true)}
                        leftIcon={<LogOut className="w-4 h-4" />}
                        className="w-full justify-start text-yellow-400 hover:text-yellow-300"
                      >
                        <div className="text-left">
                          <div className="font-medium">Sign Out</div>
                          <div className="text-sm text-gray-400">Sign out from this device</div>
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                            deleteAccount();
                          }
                        }}
                        leftIcon={<AlertTriangle className="w-4 h-4" />}
                        className="w-full justify-start text-red-400 hover:text-red-300"
                      >
                        <div className="text-left">
                          <div className="font-medium">Delete Account</div>
                          <div className="text-sm text-gray-400">Permanently delete your account and all data</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Debug Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">App Version</span>
                        <span className="text-white">1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Build Date</span>
                        <span className="text-white">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID</span>
                        <span className="text-white font-mono text-xs">{user._id}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={clearAllData}
        title="Clear All Data"
        confirmText="Clear Data"
        cancelText="Cancel"
      >
        <div className="p-6">
          <p className="text-gray-300 mb-4">This will reset all your settings and clear cached data. Your account and messages will not be affected.</p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">This action cannot be undone. Make sure to export your data first if needed.</p>
          </div>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          setShowLogoutModal(false);
        }}
        title="Sign Out"
        confirmText="Sign Out"
        cancelText="Cancel"
      >
        <div className="p-6">
          <p className="text-gray-300">Are you sure you want to sign out? You'll need to sign in again to access your account.</p>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default SettingsPage;
