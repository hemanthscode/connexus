/**
 * Group Modal Component - ENHANCED GROUP CREATION
 * Fixed with better validation and error handling
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, UserMinus, Crown, Shield, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const GroupModal = ({ isOpen, onClose, group = null, onGroupCreated }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { 
    searchUsers, 
    searchResults,
    createGroup,
    updateGroup,
    currentUser
  } = useChat();
  
  const { isUserOnline } = useSocket();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const isEditMode = Boolean(group);
  const searchQuery = watch('search', '');

  // Initialize form data
  useEffect(() => {
    if (isEditMode && group) {
      reset({
        name: group.name || '',
        description: group.description || '',
        search: ''
      });
      setSelectedUsers(group.participants?.filter(p => p.role !== 'admin') || []);
    } else {
      reset({ name: '', description: '', search: '' });
      setSelectedUsers([]);
    }
  }, [group, isEditMode, reset]);

  // Search users with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers]);

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

  const handleFormSubmit = async (data) => {
    try {
      if (isEditMode) {
        // Update existing group
        const updatedGroup = await updateGroup(group._id, {
          name: data.name.trim(),
          description: data.description.trim()
        });
        toast.success('Group updated successfully!');
        onGroupCreated?.(updatedGroup);
      } else {
        // Create new group
        if (!data.name.trim()) {
          toast.error('Group name is required');
          return;
        }

        // Validate at least one participant for new groups
        if (selectedUsers.length === 0) {
          toast.error('Please add at least one member to the group');
          return;
        }

        const groupData = {
          name: data.name.trim(),
          description: data.description.trim(),
          participants: selectedUsers.map(u => u._id)
        };

        console.log('Creating group with data:', groupData);
        const newGroup = await createGroup(groupData);
        console.log('Group created:', newGroup);
        toast.success(`Group "${newGroup.name}" created successfully!`);
        onGroupCreated?.(newGroup);
      }
      
      handleClose();
    } catch (error) {
      console.error('Group operation failed:', error);
      toast.error(error.message || (isEditMode ? 'Failed to update group' : 'Failed to create group'));
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleClose = () => {
    reset();
    setSelectedUsers([]);
    setActiveTab('info');
    onClose();
  };

  // Filter search results to exclude already selected users and current user
  const availableUsers = searchResults.filter(
    user => !selectedUsers.find(selected => selected._id === user._id) && user._id !== currentUser?._id
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={isEditMode ? 'Edit Group' : 'Create Group'}
      className="max-h-[90vh]"
    >
      {/* Header with icon */}
      <div className="flex items-center space-x-3 p-6 border-b border-white/10">
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

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5">
        {[
          { key: 'info', label: 'Group Info' },
          { key: 'members', label: `Members (${selectedUsers.length})` }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1">
        {activeTab === 'info' ? (
          <div className="p-6 space-y-6">
            <Input
              label="Group Name"
              placeholder="Enter group name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Group name is required',
                minLength: { value: 2, message: 'Group name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Group name must be less than 50 characters' }
              })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 500, message: 'Description must be less than 500 characters' }
                })}
                placeholder="What's this group about?"
                rows={3}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Validation reminder for new groups */}
            {!isEditMode && selectedUsers.length === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-300 text-sm">
                    Don't forget to add members in the Members tab!
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={isSubmitting} 
                disabled={isSubmitting || (!isEditMode && selectedUsers.length === 0)}
              >
                {isEditMode ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Search Users */}
            <Input
              placeholder="Search users to add..."
              icon={<Search className="w-4 h-4" />}
              {...register('search')}
              helperText={searchQuery.length < 2 ? 
                'Type 2+ characters to search users' : 
                `Found ${availableUsers.length} available users`
              }
            />

            {/* Available Users */}
            {searchQuery.length >= 2 && availableUsers.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-3">Available Users</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="sm"
                          isOnline={isUserOnline(user._id)}
                          showOnlineStatus={true}
                        />
                        <div>
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUserToggle(user)}
                        leftIcon={<UserPlus className="w-3 h-3" />}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Members */}
            {selectedUsers.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-3">Selected Members ({selectedUsers.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-400 text-xs">{user.email}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 capitalize">
                              {user.role || 'member'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedUsers.length === 0 && searchQuery.length < 2 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-300 font-medium mb-2">No members added yet</h3>
                <p className="text-gray-500 text-sm">Search and add users to the group</p>
              </div>
            )}

            {/* No results */}
            {searchQuery.length >= 2 && availableUsers.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">No users found</p>
                <p className="text-gray-500 text-sm">Try different search terms</p>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default GroupModal;
