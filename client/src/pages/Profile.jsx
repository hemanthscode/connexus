import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, X, Save, Edit, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'

/**
 * Profile Page Component - Added navigation back to chat
 */
const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    status: user?.status || 'online'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setShowEditModal(false)
  }

  const handleCancel = () => {
    setShowEditModal(false)
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      status: user?.status || 'online'
    })
  }

  const handleBackToChat = () => {
    navigate('/chat')
  }

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToChat}
                    className="p-2"
                    aria-label="Back to chat"
                  >
                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Settings
                  </h1>
                </div>
                
                <Button 
                  onClick={() => setShowEditModal(true)} 
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <Avatar
                    name={formData.name}
                    src={user?.avatar}
                    size="xl"
                    className="mx-auto mb-4"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {user?.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {user?.email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md capitalize">
                      {user?.status || 'online'}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Member since</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        January 2024
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last active</span>
                      <p className="text-gray-900 dark:text-white font-medium">
                        Just now
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal
        open={showEditModal}
        onClose={handleCancel}
        title="Edit Profile"
        className="max-w-lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar
                name={formData.name}
                src={user?.avatar}
                size="xl"
                className="mx-auto mb-4"
              />
              
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                aria-label="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-800 rounded-md text-sm
                  text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors
                "
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Avatar Change Modal */}
      <Modal
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Change Avatar"
      >
        <div className="space-y-4">
          <div className="text-center">
            <Avatar
              name={formData.name}
              src={user?.avatar}
              size="xl"
              className="mx-auto mb-4"
            />
          </div>
          
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                console.log('Upload new photo')
                setShowAvatarModal(false)
              }}
            >
              Upload New Photo
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                console.log('Remove current photo')
                setShowAvatarModal(false)
              }}
            >
              Remove Current Photo
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Profile
