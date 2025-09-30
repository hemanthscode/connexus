import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, 
  Camera, 
  Edit, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Link as LinkIcon,
  Calendar,
  MessageCircle,
  UserPlus,
  Shield,
  Settings,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { updateProfileSchema } from '../../utils/validation';
import { getInitials, formatRelativeTime } from '../../utils/formatters';
import Button from '../ui/Button';
import Input, { Textarea } from '../ui/Input';
import Loading from '../ui/Loading';

const ProfileModal = ({ 
  isOpen = false, 
  onClose, 
  user = null, 
  mode = 'view', // 'view', 'edit'
  onStartChat = null,
  onBlockUser = null,
  onReportUser = null,
  className = ''
}) => {
  const { user: currentUser, updateUserProfile, updateAvatar, isLoading } = useAuth();
  const { createDirectConversation } = useChat();
  
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const fileInputRef = useRef(null);
  const isOwnProfile = user?._id === currentUser?._id;
  const profileUser = user || currentUser;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profileUser?.name || '',
      email: profileUser?.email || '',
      username: profileUser?.username || '',
      phone: profileUser?.phone || '',
      bio: profileUser?.bio || '',
      location: profileUser?.location || '',
      website: profileUser?.website || '',
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      name: profileUser?.name || '',
      email: profileUser?.email || '',
      username: profileUser?.username || '',
      phone: profileUser?.phone || '',
      bio: profileUser?.bio || '',
      location: profileUser?.location || '',
      website: profileUser?.website || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
    setAvatarPreview(null);
  };

  const handleSave = async (data) => {
    try {
      await updateUserProfile(data);
      setIsEditing(false);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile && isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File must be an image');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setIsUploadingAvatar(true);
    try {
      await updateAvatar(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleStartChat = async () => {
    if (!profileUser) return;
    
    try {
      await createDirectConversation(profileUser._id);
      onStartChat?.(profileUser);
      onClose?.();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const renderAvatar = () => {
    const avatarUrl = avatarPreview || profileUser?.avatar;
    
    return (
      <div className="relative group">
        <motion.div
          whileHover={isOwnProfile && isEditing ? { scale: 1.05 } : {}}
          className={`
            relative w-24 h-24 rounded-full overflow-hidden cursor-pointer
            ${isOwnProfile && isEditing ? 'cursor-pointer' : 'cursor-default'}
          `}
          onClick={handleAvatarClick}
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={profileUser?.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {getInitials(profileUser?.name || 'U')}
              </span>
            </div>
          )}

          {/* Upload overlay */}
          {isOwnProfile && isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Camera className="w-6 h-6 text-white" />
            </motion.div>
          )}

          {/* Loading overlay */}
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loading variant="spinner" size="sm" />
            </div>
          )}
        </motion.div>

        {/* Online indicator */}
        {!isOwnProfile && (
          <div className={`
            absolute -bottom-1 -right-1 w-6 h-6 border-2 border-gray-800 rounded-full
            ${profileUser?.isOnline ? 'bg-green-500' : 'bg-gray-500'}
          `} />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>
    );
  };

  const renderViewMode = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        {renderAvatar()}
        <h2 className="text-2xl font-bold text-white mt-4">
          {profileUser?.name}
        </h2>
        {profileUser?.username && (
          <p className="text-blue-300">@{profileUser.username}</p>
        )}
        {profileUser?.bio && (
          <p className="text-gray-300 mt-2 max-w-md mx-auto">
            {profileUser.bio}
          </p>
        )}
        
        {/* Status */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-400">
          {profileUser?.isOnline ? (
            <span className="flex items-center space-x-1 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Online</span>
            </span>
          ) : profileUser?.lastSeen ? (
            <span>Last seen {formatRelativeTime(profileUser.lastSeen)}</span>
          ) : (
            <span>Offline</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        {profileUser?.email && (
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{profileUser.email}</span>
          </div>
        )}
        
        {profileUser?.phone && (
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{profileUser.phone}</span>
          </div>
        )}
        
        {profileUser?.location && (
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">{profileUser.location}</span>
          </div>
        )}
        
        {profileUser?.website && (
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <LinkIcon className="w-5 h-5 text-gray-400" />
            <a 
              href={profileUser.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {profileUser.website}
            </a>
          </div>
        )}
        
        {profileUser?.joinedAt && (
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-300">
              Joined {new Date(profileUser.joinedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderEditMode = () => (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
      {/* Avatar */}
      <div className="text-center">
        {renderAvatar()}
        <p className="text-sm text-gray-400 mt-2">Click to change avatar</p>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          icon={<User />}
          error={errors.name?.message}
          {...register('name')}
        />
        
        <Input
          label="Username"
          icon={<User />}
          error={errors.username?.message}
          {...register('username')}
        />
        
        <Input
          label="Email"
          type="email"
          icon={<Mail />}
          error={errors.email?.message}
          {...register('email')}
          className="md:col-span-2"
        />
        
        <Input
          label="Phone"
          icon={<Phone />}
          error={errors.phone?.message}
          {...register('phone')}
        />
        
        <Input
          label="Location"
          icon={<MapPin />}
          error={errors.location?.message}
          {...register('location')}
        />
        
        <Input
          label="Website"
          icon={<LinkIcon />}
          error={errors.website?.message}
          {...register('website')}
          className="md:col-span-2"
        />
        
        <Textarea
          label="Bio"
          rows={3}
          error={errors.bio?.message}
          {...register('bio')}
          className="md:col-span-2"
        />
      </div>
    </form>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </h2>
            
            <div className="flex items-center space-x-2">
              {isOwnProfile && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  leftIcon={<Edit />}
                >
                  Edit
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {isEditing ? renderEditMode() : renderViewMode()}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            {isEditing ? (
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading || isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit(handleSave)}
                  loading={isLoading || isSubmitting}
                  disabled={!isDirty}
                  leftIcon={<Save />}
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {!isOwnProfile && (
                    <>
                      <Button
                        variant="primary"
                        onClick={handleStartChat}
                        leftIcon={<MessageCircle />}
                      >
                        Message
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => onBlockUser?.(profileUser)}
                        leftIcon={<Shield />}
                      >
                        Block
                      </Button>
                    </>
                  )}
                </div>
                
                {!isOwnProfile && (
                  <Button
                    variant="ghost"
                    onClick={() => onReportUser?.(profileUser)}
                    className="text-red-400 hover:text-red-300"
                    leftIcon={<Trash2 />}
                  >
                    Report
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileModal;
