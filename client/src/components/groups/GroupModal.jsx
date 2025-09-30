import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, UserMinus, Crown, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { getInitials } from '../../utils/formatters';
import { authValidation } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const GroupModal = ({ isOpen, onClose, group = null }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { 
    searchUsers, 
    searchResults,
    createDirectConversation // We'll need to add group methods
  } = useChat();
  
  const { isUserOnline } = useSocket();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const isEditMode = Boolean(group);

  useEffect(() => {
    if (isEditMode && group) {
      reset({
        name: group.name,
        description: group.description
      });
      setSelectedUsers(group.participants?.filter(p => p.role !== 'admin') || []);
    } else {
      reset({ name: '', description: '' });
      setSelectedUsers([]);
    }
  }, [group, isEditMode, reset]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u._id === user._id);
      if (exists) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, { ...user, role: 'member' }];
      }
    });
  };

  const handleCreateGroup = async (data) => {
    try {
      const groupData = {
        name: data.name,
        description: data.description,
        participants: selectedUsers.map(u => u._id),
        type: 'group'
      };

      // This would need to be implemented in chat service
      // await createGroup(groupData);
      console.log('Creating group:', groupData);
      toast.success('Group created successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async (data) => {
    try {
      // This would need to be implemented in chat service
      // await updateGroup(group._id, data);
      console.log('Updating group:', data);
      toast.success('Group updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleRemoveParticipant = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleChangeRole = (userId, newRole) => {
    setSelectedUsers(prev => 
      prev.map(u => u._id === userId ? { ...u, role: newRole } : u)
    );
  };

  const handleClose = () => {
    reset();
    setSelectedUsers([]);
    setSearchQuery('');
    setActiveTab('info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEditMode ? 'Edit Group' : 'Create Group'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {isEditMode ? 'Manage group settings' : 'Start a group conversation'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'info' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Group Info
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Members ({selectedUsers.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'info' ? (
              <form onSubmit={handleSubmit(isEditMode ? handleUpdateGroup : handleCreateGroup)} className="p-6 space-y-6">
                <div>
                  <Input
                    label="Group Name"
                    type="text"
                    placeholder="Enter group name"
                    error={errors.name?.message}
                    {...register('name', {
                      required: 'Group name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 50, message: 'Name cannot exceed 50 characters' }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: { value: 200, message: 'Description cannot exceed 200 characters' }
                    })}
                    placeholder="What's this group about?"
                    rows={3}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {isEditMode ? 'Save Changes' : 'Create Group'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                {/* Search Users */}
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="Search users to add..."
                    icon={<Search className="w-5 h-5" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-3">Search Results</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {searchResults.map((user) => {
                        const isSelected = selectedUsers.find(u => u._id === user._id);
                        return (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {user.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user.name} 
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">
                                      {getInitials(user.name)}
                                    </span>
                                  </div>
                                )}
                                {isUserOnline(user._id) && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{user.name}</p>
                                <p className="text-gray-400 text-xs">{user.email}</p>
                              </div>
                            </div>
                            <Button
                              variant={isSelected ? "danger" : "secondary"}
                              size="sm"
                              onClick={() => handleUserToggle(user)}
                            >
                              {isSelected ? 'Remove' : 'Add'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Members */}
                {selectedUsers.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Selected Members ({selectedUsers.length})</p>
                    <div className="space-y-2">
                      {selectedUsers.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.name} 
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">
                                    {getInitials(user.name)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{user.name}</p>
                              <p className="text-gray-400 text-xs flex items-center space-x-1">
                                {user.role === 'admin' && <Crown className="w-3 h-3" />}
                                {user.role === 'moderator' && <Shield className="w-3 h-3" />}
                                <span className="capitalize">{user.role}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isEditMode && user.role !== 'admin' && (
                              <select
                                value={user.role}
                                onChange={(e) => handleChangeRole(user._id, e.target.value)}
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
                              >
                                <option value="member">Member</option>
                                <option value="moderator">Moderator</option>
                              </select>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParticipant(user._id)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No members added yet</p>
                    <p className="text-gray-500 text-sm">Search and add users to the group</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GroupModal;
