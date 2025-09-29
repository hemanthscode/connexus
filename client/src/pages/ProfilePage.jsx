import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Camera, Edit3, Save, X, MessageSquare, Phone, Video, MoreVertical,
  MapPin, Calendar, Globe, Shield, Star
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import Modal from '@/components/ui/Modal.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useProfileUpdate } from '@/hooks/useAuth.jsx'
import { useOnlineUsers } from '@/hooks/useOnlineUsers.jsx'
import { useToast } from '@/components/ui/Toast.jsx'
import { formatLastSeen, formatDate } from '@/utils/formatters.js'
import uploadService from '@/services/uploadService.js'

// Configuration constants
const PROFILE_CONFIG = {
  AVATAR_SETTINGS: {
    MAX_SIZE: '5MB',
    RECOMMENDED_SIZE: '200x200 pixels',
    ACCEPTED_FORMATS: 'image/*'
  },
  CONFIRM_MESSAGES: {
    UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to',
    CANCEL_EDIT: 'cancel?',
    LEAVE_PAGE: 'leave?'
  },
  TOAST_MESSAGES: {
    AVATAR_SUCCESS: 'Avatar uploaded successfully',
    AVATAR_ERROR: 'Failed to upload avatar'
  },
  MOCK_STATS: {
    MESSAGES_SENT: 1234,
    CONVERSATIONS: 42
  }
}

const ProfilePage = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { getUserOnlineStatus } = useOnlineUsers()
  const toast = useToast()

  // State
  const [state, setState] = useState({
    isEditing: false,
    showAvatarModal: false,
    uploadingAvatar: false
  })

  const fileInputRef = useRef(null)

  // Profile data
  const isOwnProfile = !userId || userId === currentUser?._id
  const profileUser = isOwnProfile ? currentUser : null // In real app, fetch user by userId

  const {
    formData,
    validationErrors,
    isLoading,
    hasChanges,
    handleInputChange,
    handleSubmit,
    resetForm
  } = useProfileUpdate()

  // Memoized user status
  const userStatus = useMemo(() => {
    if (!profileUser) return { onlineStatus: 'offline', isOnline: false }
    
    const onlineStatus = getUserOnlineStatus(profileUser._id)
    const isOnline = onlineStatus === 'online'
    
    return { onlineStatus, isOnline }
  }, [profileUser, getUserOnlineStatus])

  // Memoized handlers
  const handlers = useMemo(() => ({
    handleAvatarUpload: async (file) => {
      if (!file) return

      setState(prev => ({ ...prev, uploadingAvatar: true }))
      try {
        const result = await uploadService.uploadAvatar(file)
        if (result.success) {
          handleInputChange('avatar', result.data.url)
          toast.success(PROFILE_CONFIG.TOAST_MESSAGES.AVATAR_SUCCESS)
          setState(prev => ({ ...prev, showAvatarModal: false }))
        }
      } catch (error) {
        toast.error(PROFILE_CONFIG.TOAST_MESSAGES.AVATAR_ERROR)
      } finally {
        setState(prev => ({ ...prev, uploadingAvatar: false }))
      }
    },

    handleFileSelect: (event) => {
      const file = event.target.files?.[0]
      if (file) {
        handlers.handleAvatarUpload(file)
      }
    },

    handleEditToggle: () => {
      if (state.isEditing && hasChanges) {
        const confirmed = window.confirm(
          `${PROFILE_CONFIG.CONFIRM_MESSAGES.UNSAVED_CHANGES} ${PROFILE_CONFIG.CONFIRM_MESSAGES.CANCEL_EDIT}`
        )
        if (!confirmed) return
        resetForm()
      }
      setState(prev => ({ ...prev, isEditing: !prev.isEditing }))
    },

    handleSave: async (e) => {
      e.preventDefault()
      const result = await handleSubmit(e)
      if (result.success) {
        setState(prev => ({ ...prev, isEditing: false }))
      }
    },

    handleBack: () => {
      if (state.isEditing && hasChanges) {
        const confirmed = window.confirm(
          `${PROFILE_CONFIG.CONFIRM_MESSAGES.UNSAVED_CHANGES} ${PROFILE_CONFIG.CONFIRM_MESSAGES.LEAVE_PAGE}`
        )
        if (!confirmed) return
      }
      navigate('/chat')
    }
  }), [state, hasChanges, handleInputChange, handleSubmit, resetForm, toast, navigate])

  // Render user info section
  const renderUserInfo = () => {
    if (state.isEditing) {
      return (
        <form onSubmit={handlers.handleSave} className="space-y-4">
          <Input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={validationErrors.name}
            className="text-2xl font-bold bg-transparent border-0 border-b border-gray-600 rounded-none p-0 focus:border-cyan-400"
            placeholder="Your name"
          />
          <Input
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            error={validationErrors.bio}
            placeholder="Tell us about yourself"
            className="bg-transparent"
          />
          <Input
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            error={validationErrors.location}
            placeholder="Your location"
            leftIcon={<MapPin className="w-4 h-4" />}
            className="bg-transparent"
          />
          
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={!hasChanges}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} disabled={!hasChanges}>
              Reset
            </Button>
          </div>
        </form>
      )
    }

    return (
      <>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">{profileUser.name}</h2>
          {profileUser.bio && <p className="text-gray-300 text-lg">{profileUser.bio}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          {profileUser.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profileUser.location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Joined {formatDate(profileUser.createdAt)}
          </div>
          {profileUser.website && (
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              <a 
                href={profileUser.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Website
              </a>
            </div>
          )}
        </div>

        {!isOwnProfile && (
          <div className="flex gap-3">
            <Button variant="primary" leftIcon={<MessageSquare className="w-4 h-4" />}>
              Send Message
            </Button>
            <Button variant="secondary" leftIcon={<Phone className="w-4 h-4" />}>
              Call
            </Button>
          </div>
        )}
      </>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark border-b border-gray-700/50 sticky top-0 z-10 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handlers.handleBack} className="w-10 h-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isOwnProfile ? 'My Profile' : profileUser.name}
              </h1>
              <p className="text-sm text-gray-400">
                {userStatus.isOnline ? 'Active now' : formatLastSeen(profileUser.lastSeen)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOwnProfile ? (
              <>
                <Button variant="ghost" size="icon"><MessageSquare className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
              </>
            ) : (
              <Button
                variant={state.isEditing ? 'ghost' : 'primary'}
                onClick={handlers.handleEditToggle}
                leftIcon={state.isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              >
                {state.isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Profile Header */}
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="relative w-32 h-32">
                  <img
                    src={formData.avatar || profileUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name || 'U')}&size=128`}
                    alt={profileUser.name}
                    className="w-full h-full rounded-full ring-4 ring-gray-600/50"
                  />
                  
                  {userStatus.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-dark-surface" />
                  )}
                  
                  {isOwnProfile && state.isEditing && (
                    <button
                      onClick={() => setState(prev => ({ ...prev, showAvatarModal: true }))}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                {renderUserInfo()}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white">{profileUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={clsx('capitalize', userStatus.isOnline ? 'text-green-400' : 'text-gray-400')}>
                    {userStatus.onlineStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Messages Sent</span>
                  <span className="text-white font-medium">{PROFILE_CONFIG.MOCK_STATS.MESSAGES_SENT.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Conversations</span>
                  <span className="text-white font-medium">{PROFILE_CONFIG.MOCK_STATS.CONVERSATIONS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Active</span>
                  <span className="text-white">
                    {userStatus.isOnline ? 'Now' : formatLastSeen(profileUser.lastSeen)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Avatar Upload Modal */}
      <Modal
        isOpen={state.showAvatarModal}
        onClose={() => setState(prev => ({ ...prev, showAvatarModal: false }))}
        title="Change Profile Photo"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <img
                src={formData.avatar || profileUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name || 'U')}&size=96`}
                alt="Current avatar"
                className="w-full h-full rounded-full"
              />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={PROFILE_CONFIG.AVATAR_SETTINGS.ACCEPTED_FORMATS}
              onChange={handlers.handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                loading={state.uploadingAvatar}
                disabled={state.uploadingAvatar}
                leftIcon={<Camera className="w-4 h-4" />}
                className="w-full"
              >
                {state.uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
              </Button>
              
              {(formData.avatar || profileUser.avatar) && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleInputChange('avatar', null)
                    setState(prev => ({ ...prev, showAvatarModal: false }))
                  }}
                  className="w-full"
                >
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Recommended: Square image, at least {PROFILE_CONFIG.AVATAR_SETTINGS.RECOMMENDED_SIZE}</p>
            <p>Max file size: {PROFILE_CONFIG.AVATAR_SETTINGS.MAX_SIZE}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProfilePage
