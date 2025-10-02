import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Settings,
  MessageCircle,
  UserMinus,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { getInitials } from '../../utils/formatters';
import { authValidation } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import toast from 'react-hot-toast';

const ProfileModal = ({ user: profileUser, isOpen, onClose, isOwnProfile = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    avatar: '',
  });

  const { user: currentUser, updateProfile } = useAuth();
  const { createDirectConversation } = useChat();
  const { isUserOnline, getUserStatus } = useSocket();

  const displayUser = profileUser || currentUser;
  const userStatus = getUserStatus(displayUser?._id);
  const isOnline = isUserOnline(displayUser?._id);

  useEffect(() => {
    if (displayUser) {
      setProfileData({
        name: displayUser.name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
        bio: displayUser.bio || '',
        location: displayUser.location || '',
        avatar: displayUser.avatar || '',
      });
    }
  }, [displayUser]);

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;

    // Basic validation
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profileData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!displayUser || isOwnProfile) return;

    try {
      await createDirectConversation(displayUser._id);
      onClose();
      toast.success(`Started conversation with ${displayUser.name}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderProfileTab = () => (
    <div className="p-6 space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          {displayUser?.avatar ? (
            <img 
              src={displayUser.avatar} 
              alt={displayUser.name} 
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {getInitials(displayUser?.name || 'U')}
              </span>
            </div>
          )}
          
          {/* Online Status */}
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          
          {isOwnProfile && isEditing && (
            <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-2xl font-bold text-white">{displayUser?.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <p className="text-gray-300 mb-1">{displayUser?.email}</p>
          
          {userStatus?.lastSeen && !isOnline && (
            <p className="text-gray-500 text-sm">
              Last seen {format(new Date(userStatus.lastSeen), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4">
        <div>
          <Input
            label="Full Name"
            icon={<User className="w-5 h-5" />}
            value={isEditing ? profileData.name : displayUser?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Input
            label="Email Address"
            icon={<Mail className="w-5 h-5" />}
            value={isEditing ? profileData.email : displayUser?.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter your email address"
            type="email"
          />
        </div>

        <div>
          <Input
            label="Phone Number"
            icon={<Phone className="w-5 h-5" />}
            value={isEditing ? profileData.phone : displayUser?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <Input
            label="Location"
            icon={<MapPin className="w-5 h-5" />}
            value={isEditing ? profileData.location : displayUser?.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            disabled={!isEditing}
            placeholder="Enter your location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Bio
          </label>
          <textarea
            value={isEditing ? profileData.bio : displayUser?.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={500}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50"
          />
          {isEditing && (
            <p className="text-xs text-gray-400 mt-1">
              {profileData.bio.length}/500 characters
            </p>
          )}
        </div>

        {/* Member Since */}
        <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
          <Calendar className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-gray-400 text-sm">Member since</p>
            <p className="text-white font-medium">
              {displayUser?.createdAt 
                ? format(new Date(displayUser.createdAt), 'MMMM yyyy')
                : 'Unknown'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-white/10">
        {isOwnProfile ? (
          isEditing ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setProfileData({
                    name: displayUser?.name || '',
                    email: displayUser?.email || '',
                    phone: displayUser?.phone || '',
                    bio: displayUser?.bio || '',
                    location: displayUser?.location || '',
                    avatar: displayUser?.avatar || '',
                  });
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loading size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          )
        ) : (
          <>
            <Button
              variant="primary"
              onClick={handleStartConversation}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Message</span>
            </Button>
            <Button
              variant="secondary"
              className="flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="p-6">
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Activity Coming Soon</h3>
        <p className="text-gray-400 text-sm">
          User activity and statistics will be available in a future update.
        </p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'activity', label: 'Activity', icon: Shield },
  ];

  if (!displayUser) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      className="max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isOwnProfile ? 'My Profile' : `${displayUser.name}'s Profile`}
            </h2>
            <p className="text-gray-300 text-sm">
              {isOwnProfile ? 'Manage your profile information' : 'View user details'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>
    </Modal>
  );
};

export default ProfileModal;
