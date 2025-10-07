/**
 * Group Modal - OPTIMIZED & MINIMAL
 * Reduced redundancy, cleaner structure
 */
import { useState, useEffect } from 'react';
import { Users, Search, UserMinus, UserPlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { userHelpers } from '../../utils/chatHelpers';
import { chatValidation, sanitizers } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const GroupModal = ({ isOpen, onClose, group = null, onGroupCreated }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const { searchUsers, searchResults, createGroup, updateGroup, currentUser } = useChat();
  const { isUserOnline } = useSocket();
  
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
  const isEditMode = Boolean(group);
  const searchQuery = watch('search', '');

  // Initialize form
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

  // Search users
  useEffect(() => {
    if (searchQuery?.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(sanitizers.searchQuery(searchQuery));
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchUsers]);

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => userHelpers.isSameUser(u, user));
      return exists 
        ? prev.filter(u => !userHelpers.isSameUser(u, user))
        : [...prev, { ...user, role: 'member' }];
    });
  };

  const handleFormSubmit = async (data) => {
    try {
      if (!isEditMode && selectedUsers.length === 0) {
        toast.error('Please add at least one member');
        return;
      }

      const groupData = {
        name: sanitizers.name(data.name),
        description: sanitizers.message(data.description || ''),
        ...((!isEditMode) && { participants: selectedUsers.map(u => u._id) })
      };

      const result = isEditMode 
        ? await updateGroup(group._id, groupData)
        : await createGroup(groupData);

      toast.success(`Group ${isEditMode ? 'updated' : 'created'} successfully!`);
      onGroupCreated?.(result);
      onClose();
      
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const availableUsers = userHelpers.filterNewUsers(
    searchResults, 
    selectedUsers.map(u => ({ _id: u._id })), 
    currentUser?._id
  );

  // User item component
  const UserItem = ({ user, isSelected, onToggle }) => (
    <div 
      onClick={() => onToggle(user)}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Avatar
          src={user.avatar}
          name={user.name}
          size="sm"
          isOnline={isUserOnline(user._id)}
          showOnlineStatus
        />
        <div>
          <p className="text-white font-medium text-sm">{user.name}</p>
          <p className="text-gray-400 text-xs">{user.email}</p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center">
        {isSelected ? (
          <UserMinus className="w-4 h-4 text-red-400" />
        ) : (
          <UserPlus className="w-4 h-4 text-green-400" />
        )}
      </div>
    </div>
  );

  const tabs = [
    { key: 'info', label: 'Group Info' },
    { key: 'members', label: `Members (${selectedUsers.length})` }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditMode ? 'Edit Group' : 'Create Group'}
      className="max-h-[90vh]"
    >
      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5">
        {tabs.map(({ key, label }) => (
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

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {activeTab === 'info' ? (
          <div className="p-6 space-y-6">
            <Input
              label="Group Name"
              placeholder="Enter group name"
              error={errors.name?.message}
              {...register('name', chatValidation.groupName)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description', chatValidation.groupDescription)}
                placeholder="What's this group about?"
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {!isEditMode && selectedUsers.length === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-amber-300 text-sm flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Don't forget to add members in the Members tab!
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
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
            {/* Search */}
            <Input
              placeholder="Search users to add..."
              icon={<Search className="w-4 h-4" />}
              {...register('search')}
            />

            {/* Selected Members */}
            {selectedUsers.length > 0 && (
              <div className="bg-blue-500/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-300">Selected ({selectedUsers.length})</h4>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div key={user._id} className="flex items-center space-x-2 bg-blue-500/20 rounded-lg px-3 py-1">
                      <Avatar src={user.avatar} name={user.name} size="xs" />
                      <span className="text-sm text-white">{user.name}</span>
                      <button onClick={() => handleUserToggle(user)}>
                        <X className="w-3 h-3 text-blue-300 hover:text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {searchQuery.length >= 2 ? (
                availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <UserItem
                      key={user._id}
                      user={user}
                      isSelected={false}
                      onToggle={handleUserToggle}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-300">No users found</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300">Search to add members</p>
                  <p className="text-gray-500 text-sm">Type 2+ characters to find users</p>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default GroupModal;
