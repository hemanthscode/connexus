import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Phone, MapPin, Edit2, Check, X, ArrowLeft,
  Twitter, Instagram, Linkedin, Github, Mail
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

const SOCIAL_PLATFORMS = {
  twitter: { icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },  
  github: { icon: Github, label: 'GitHub', color: '#333' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F' }
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [displayUser, setDisplayUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  const [formData, setFormData] = useState(() => ({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    socialLinks: user?.socialLinks || {}
  }));

  useEffect(() => {
    if (user && !isLocalLoading) {
      setDisplayUser(user);
    }
  }, [user, isLocalLoading]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSocialChange = useCallback((platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  }, []);

  const cleanFormData = useCallback((data) => {
    const cleaned = { ...data };
    if (cleaned.socialLinks) {
      const filteredSocialLinks = {};
      Object.entries(cleaned.socialLinks).forEach(([platform, url]) => {
        if (url && url.trim()) {
          filteredSocialLinks[platform] = url.trim();
        }
      });
      cleaned.socialLinks = filteredSocialLinks;
    }
    return cleaned;
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    const cleanedData = cleanFormData(formData);
    setIsLocalLoading(true);
    
    const originalDisplayUser = displayUser;
    const optimisticUser = { ...displayUser, ...cleanedData, updatedAt: new Date().toISOString() };
    setDisplayUser(optimisticUser);
    setIsEditing(false);

    try {
      const result = await authService.updateProfile(cleanedData);
      
      if (result.success) {
        useAuthStore.getState().setUser(result.data);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      setDisplayUser(originalDisplayUser);
      setIsEditing(true);
      
      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLocalLoading(false);
    }
  }, [formData, displayUser, cleanFormData]);

  const handleCancel = useCallback(() => {
    setFormData({
      name: displayUser?.name || '',
      phone: displayUser?.phone || '',
      bio: displayUser?.bio || '',
      location: displayUser?.location || '',
      socialLinks: displayUser?.socialLinks || {}
    });
    setIsEditing(false);
  }, [displayUser]);

  const handleBack = () => {
    window.history.back();
  };

  useEffect(() => {
    if (displayUser && !isEditing && !isLocalLoading) {
      setFormData({
        name: displayUser.name || '',
        phone: displayUser.phone || '',
        bio: displayUser.bio || '',
        location: displayUser.location || '',
        socialLinks: displayUser.socialLinks || {}
      });
    }
  }, [displayUser?.name, displayUser?.phone, displayUser?.bio, displayUser?.location, displayUser?.socialLinks, isEditing, isLocalLoading]);

  const hasChanges = useMemo(() => {
    if (!displayUser) return false;
    return (
      formData.name !== (displayUser.name || '') ||
      formData.phone !== (displayUser.phone || '') ||
      formData.bio !== (displayUser.bio || '') ||
      formData.location !== (displayUser.location || '') ||
      JSON.stringify(formData.socialLinks) !== JSON.stringify(displayUser.socialLinks || {})
    );
  }, [formData, displayUser]);

  if (!displayUser) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
          
          <div className="w-16 sm:w-20 flex justify-end">
            {isLocalLoading && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center h-full">
                {/* Avatar */}
                <div className="relative mb-4">
                  <img
                    src={displayUser.avatar || `https://ui-avatars.com/api/?name=${displayUser.name}&background=3b82f6&color=ffffff&size=200`}
                    alt={displayUser.name}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-50"
                  />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-white" />
                </div>

                {/* Name & Email */}
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayUser.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{displayUser.email}</span>
                </div>

                {/* Edit Button */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isLocalLoading}
                    className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="w-full flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={isLocalLoading}
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges || isLocalLoading}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                )}

                {/* Social Icons */}
                <div className="w-full mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => {
                      const IconComponent = config.icon;
                      const hasLink = displayUser.socialLinks?.[platform];
                      
                      return (
                        <a
                          key={platform}
                          href={hasLink || '#'}
                          target={hasLink ? "_blank" : undefined}
                          rel={hasLink ? "noopener noreferrer" : undefined}
                          onClick={(e) => !hasLink && e.preventDefault()}
                          className={`flex items-center justify-center w-full aspect-square rounded-xl transition-all ${
                            hasLink 
                              ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
                              : 'bg-gray-50 opacity-40 cursor-not-allowed'
                          }`}
                          title={config.label}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: hasLink ? config.color : '#9ca3af' }} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">About</h3>
                {isEditing ? (
                  <div>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={isLocalLoading}
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Write something about yourself..."
                    />
                    <div className="mt-1 text-xs text-gray-500 text-right">{formData.bio?.length || 0}/200</div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">{displayUser.bio || 'No bio yet'}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={isLocalLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{displayUser.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={isLocalLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{displayUser.phone || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          disabled={isLocalLoading}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="City, Country"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{displayUser.location || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Links - Edit Mode Only */}
              {isEditing && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Social Links</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(SOCIAL_PLATFORMS).map(([platform, config]) => {
                      const IconComponent = config.icon;
                      return (
                        <div key={platform}>
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
                            <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                            {config.label}
                          </label>
                          <input
                            type="url"
                            value={formData.socialLinks[platform] || ''}
                            onChange={(e) => handleSocialChange(platform, e.target.value)}
                            disabled={isLocalLoading}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`https://${platform}.com/username`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;