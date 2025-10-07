/**
 * Profile Page - ULTRA OPTIMIZED & STREAMLINED
 * Maximum reuse of existing components, modern UX patterns
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, Edit2, ArrowLeft, Camera, Mail,
  Twitter, Instagram, Linkedin, Github, ExternalLink
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const SOCIAL_PLATFORMS = {
  twitter: { icon: Twitter, label: 'Twitter', color: '#1DA1F2', placeholder: 'https://twitter.com/username' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', placeholder: 'https://linkedin.com/in/username' },  
  github: { icon: Github, label: 'GitHub', color: '#333333', placeholder: 'https://github.com/username' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F', placeholder: 'https://instagram.com/username' }
};

// OPTIMIZED: Reusable Info Card Component
const InfoCard = ({ icon: Icon, label, value, iconColor = 'text-blue-400' }) => (
  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
    <div className="flex items-center space-x-3 mb-2">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span className="text-sm font-medium text-gray-300">{label}</span>
    </div>
    <p className="text-white font-medium">{value || 'Not provided'}</p>
  </div>
);

// OPTIMIZED: Social Link Item Component
const SocialLinkItem = ({ platform, config, url, isEditing, onChange, disabled }) => {
  const IconComponent = config.icon;
  
  if (isEditing) {
    return (
      <div>
        <label className="flex items-center space-x-2 text-xs font-medium text-gray-300 mb-2">
          <IconComponent className="w-4 h-4" style={{ color: config.color }} />
          <span>{config.label}</span>
        </label>
        <Input
          type="url"
          value={url || ''}
          onChange={(e) => onChange(platform, e.target.value)}
          disabled={disabled}
          placeholder={config.placeholder}
          variant="default"
        />
      </div>
    );
  }

  const hasLink = Boolean(url);
  
  return (
    <a
      href={hasLink ? url : '#'}
      target={hasLink ? "_blank" : undefined}
      rel={hasLink ? "noopener noreferrer" : undefined}
      onClick={(e) => !hasLink && e.preventDefault()}
      className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
        hasLink 
          ? 'bg-white/10 hover:bg-white/20 cursor-pointer border border-white/20' 
          : 'bg-white/5 opacity-40 cursor-not-allowed border border-white/10'
      }`}
      title={config.label}
    >
      <IconComponent 
        className="w-5 h-5" 
        style={{ color: hasLink ? config.color : '#9ca3af' }} 
      />
    </a>
  );
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    socialLinks: user?.socialLinks || {}
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
        socialLinks: user.socialLinks || {}
      });
    }
  }, [user]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSocialChange = useCallback((platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  }, []);

  // Simple validation
  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (formData.name.length < 2) {
      toast.error('Name must be at least 2 characters');
      return false;
    }
    if (formData.name.length > 50) {
      toast.error('Name must be less than 50 characters');
      return false;
    }
    if (formData.bio && formData.bio.length > 200) {
      toast.error('Bio must be less than 200 characters');
      return false;
    }
    return true;
  };

  const cleanFormData = useCallback((data) => {
    const cleaned = {
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      bio: data.bio?.trim() || '',
      location: data.location?.trim() || '',
      socialLinks: {}
    };
    
    // Clean social links
    if (data.socialLinks) {
      Object.entries(data.socialLinks).forEach(([platform, url]) => {
        if (url && url.trim()) {
          cleaned.socialLinks[platform] = url.trim();
        }
      });
    }
    
    return cleaned;
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    const cleanedData = cleanFormData(formData);
    setIsLoading(true);
    
    try {
      const result = await authService.updateProfile(cleanedData);
      
      if (result.success) {
        useAuthStore.getState().setUser(result.data);
        toast.success('Profile updated successfully');
        setIsEditing(false);
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, cleanFormData]);

  const handleCancel = useCallback(() => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      socialLinks: user?.socialLinks || {}
    });
    setIsEditing(false);
  }, [user]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.name !== (user.name || '') ||
      formData.phone !== (user.phone || '') ||
      formData.bio !== (user.bio || '') ||
      formData.location !== (user.location || '') ||
      JSON.stringify(formData.socialLinks) !== JSON.stringify(user.socialLinks || {})
    );
  }, [formData, user]);

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loading size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col overflow-hidden">
      
      {/* STREAMLINED HEADER */}
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            className="text-gray-300 hover:text-white"
          >
            Back
          </Button>
          
          <h1 className="text-xl font-bold text-white">Profile Settings</h1>
          
          <div className="w-20 flex justify-end">
            {isLoading && <Loading size="sm" />}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex p-6 gap-6 min-h-0">
        
        {/* LEFT PANEL - Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 flex flex-col"
        >
          {/* OPTIMIZED: Avatar Section using Avatar component */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="2xl"
                className="ring-4 ring-blue-500/30"
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white/20" />
              <Button
                variant="primary"
                size="xs"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0"
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <div className="flex items-center justify-center space-x-2 text-gray-300 mb-6">
              <Mail className="w-4 h-4" />
              <span className="text-sm truncate">{user.email}</span>
            </div>

            {/* OPTIMIZED: Action Buttons using Button component */}
            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                    leftIcon={<Edit2 className="w-4 h-4" />}
                    className="w-full"
                  >
                    Edit Profile
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex space-x-3"
                >
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!hasChanges || isLoading}
                    loading={isLoading}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* OPTIMIZED: Social Links using component */}
          <div className="mt-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Social Links</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => (
                <SocialLinkItem
                  key={platform}
                  platform={platform}
                  config={config}
                  url={user.socialLinks?.[platform]}
                  isEditing={false}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL - Content */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 flex flex-col min-h-0"
        >
          <AnimatePresence mode="wait">
            {!isEditing ? (
              /* DISPLAY MODE */
              <motion.div
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-white mb-6">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* OPTIMIZED: Basic Info using InfoCard component */}
                  <div className="space-y-4">
                    <InfoCard icon={User} label="Full Name" value={user.name} iconColor="text-blue-400" />
                    <InfoCard icon={Phone} label="Phone" value={user.phone} iconColor="text-green-400" />
                    <InfoCard icon={MapPin} label="Location" value={user.location} iconColor="text-purple-400" />
                  </div>

                  {/* Bio Section */}
                  <div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">About Me</h4>
                      <p className="text-white leading-relaxed">
                        {user.bio || 'No bio provided yet. Click edit to add something about yourself!'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Links with External Link Icons */}
                {Object.values(user.socialLinks || {}).some(link => link) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Social Media</h4>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => {
                        const url = user.socialLinks?.[platform];
                        if (!url) return null;
                        
                        const IconComponent = config.icon;
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all group"
                          >
                            <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                            <span className="text-sm text-white">{config.label}</span>
                            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* EDIT MODE */
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <h3 className="text-lg font-bold text-white mb-6">Edit Profile</h3>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                  {/* OPTIMIZED: Left Column using Input components */}
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      icon={<User className="w-4 h-4" />}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={isLoading}
                      placeholder="Enter your full name"
                      required
                    />

                    <Input
                      label="Phone Number"
                      icon={<Phone className="w-4 h-4" />}
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isLoading}
                      placeholder="+1 (555) 000-0000"
                    />

                    <Input
                      label="Location"
                      icon={<MapPin className="w-4 h-4" />}
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={isLoading}
                      placeholder="City, Country"
                    />

                    {/* Bio Textarea */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        About Me
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={isLoading}
                        rows={4}
                        maxLength={200}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Tell us something about yourself..."
                      />
                      <div className="mt-1 text-xs text-gray-400 text-right">
                        {formData.bio?.length || 0}/200
                      </div>
                    </div>
                  </div>

                  {/* OPTIMIZED: Right Column - Social Links */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-200">Social Media Links</h4>
                    
                    {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => (
                      <SocialLinkItem
                        key={platform}
                        platform={platform}
                        config={config}
                        url={formData.socialLinks[platform]}
                        isEditing={true}
                        onChange={handleSocialChange}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
