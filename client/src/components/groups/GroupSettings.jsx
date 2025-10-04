/**
 * Group Settings Component - COMPLETE GROUP MANAGEMENT
 * Enhanced with all group operations and real-time coordination
 */

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Shield, 
  Crown, 
  UserMinus, 
  UserPlus,
  Trash2,
  Save,
  AlertTriangle,
  Hash,
  Search,
  X,
  Download,
  Eye,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

// Enhanced Add Members Modal
const AddMembersModal = memo(({ isOpen, onClose, group, onMembersAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { searchUsers, searchResults, currentUser, addGroupParticipants } = useChat();
  const { isUserOnline } = useSocket();

  // Search users with debouncing
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers]);

  // Filter available users (exclude current members and current user)
  const availableUsers = useMemo(() => {
    const memberIds = group?.participants?.map(p => p.user._id) || [];
    return searchResults.filter(user => 
      !memberIds.includes(user._id) && 
      user._id !== currentUser?._id
    );
  }, [searchResults, group?.participants, currentUser?._id]);

  const handleUserToggle = useCallback((user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u._id === user._id);
      if (exists) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  }, []);

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to add');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Adding members to group:', selectedUsers.map(u => u._id));
      
      const updatedGroup = await addGroupParticipants(
        group._id, 
        selectedUsers.map(u => u._id)
      );
      
      console.log('Members added successfully:', updatedGroup);
      
      onMembersAdded?.(updatedGroup, selectedUsers);
      toast.success(`Added ${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''} successfully!`);
      handleClose();
    } catch (error) {
      console.error('Failed to add members:', error);
      toast.error(error.message || 'Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title="Add Members"
      className="max-h-[90vh]"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add New Members</h3>
            <p className="text-gray-300 text-sm">Search and add users to {group?.name}</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Selected Users Preview */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-blue-300">
                Selected Members ({selectedUsers.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers([])}
                className="text-blue-400 hover:text-blue-300"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user._id} className="flex items-center space-x-2 bg-blue-500/20 rounded-lg px-3 py-1.5">
                  <Avatar src={user.avatar} name={user.name} size="xs" />
                  <span className="text-sm text-white">{user.name}</span>
                  <button
                    onClick={() => handleUserToggle(user)}
                    className="text-blue-300 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Users List */}
        {searchQuery.length >= 2 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Available Users ({availableUsers.length})
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableUsers.length > 0 ? (
                availableUsers.map(user => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    onClick={() => handleUserToggle(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={user.avatar}
                        name={user.name}
                        size="lg"
                        isOnline={isUserOnline(user._id)}
                        showOnlineStatus={true}
                      />
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedUsers.find(u => u._id === user._id) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 border-2 border-gray-500 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
                          <UserPlus className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">No users found</p>
                  <p className="text-gray-500 text-sm">Try different search terms</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchQuery.length < 2 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-300 font-medium mb-2">Search for Users</h3>
            <p className="text-gray-500 text-sm">Type at least 2 characters to find users to add</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || isLoading}
            loading={isLoading}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="flex-1"
          >
            Add {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}Member{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
});
AddMembersModal.displayName = 'AddMembersModal';

// Enhanced Participant Item Component
const ParticipantItem = memo(({ 
  participant, 
  currentUserId, 
  isAdmin, 
  canManage, 
  isOnline,
  onChangeRole, 
  onRemove,
  onViewProfile
}) => {
  const isCurrentUser = participant.user._id === currentUserId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar
          src={participant.user.avatar}
          name={participant.user.name}
          size="lg"
          isOnline={isOnline}
          showOnlineStatus={true}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <p className="text-white font-medium truncate">
              {participant.user.name}
            </p>
            {isCurrentUser && (
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                You
              </span>
            )}
            {isOnline && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-400 text-sm truncate">
              {participant.user.email}
            </p>
            <div className="flex items-center space-x-1">
              {participant.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400" />}
              {participant.role === 'moderator' && <Shield className="w-3 h-3 text-purple-400" />}
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                participant.role === 'admin' 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : participant.role === 'moderator'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
              }`}>
                {participant.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* View Profile Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewProfile?.(participant.user)}
          className="text-gray-400 hover:text-white"
          title="View Profile"
        >
          <Eye className="w-4 h-4" />
        </Button>

        {/* Role Selector for Admins */}
        {canManage && !isCurrentUser && isAdmin && (
          <select
            value={participant.role}
            onChange={(e) => onChangeRole(participant.user._id, e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="member" className="bg-gray-800">Member</option>
            <option value="moderator" className="bg-gray-800">Moderator</option>
            <option value="admin" className="bg-gray-800">Admin</option>
          </select>
        )}

        {/* Remove Button */}
        {canManage && !isCurrentUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(participant.user._id, participant.user.name)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            title="Remove Member"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});
ParticipantItem.displayName = 'ParticipantItem';

// Main Group Settings Component
const GroupSettings = ({ group, isOpen, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState({ show: false, participant: null });
  
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Participant filtering
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { user } = useAuth();
  const { 
    updateGroupInfo,
    removeGroupParticipant,
    changeParticipantRole,
    leaveGroup,
    deleteGroup,
    isGroupAdmin,
    canManageGroup
  } = useChat();

  const { isUserOnline } = useSocket();

  // Memoized user permissions and data
  const { userParticipant, isAdmin, isModerator, canManage, participantCount } = useMemo(() => {
    const userPart = group?.participants?.find(p => p.user._id === user._id);
    const isAdm = isGroupAdmin(group?._id, user._id);
    const isMod = userPart?.role === 'moderator';
    const canMng = canManageGroup(group?._id, user._id);
    const count = group?.participants?.length || 0;
    
    return {
      userParticipant: userPart,
      isAdmin: isAdm,
      isModerator: isMod,
      canManage: canMng,
      participantCount: count
    };
  }, [group?.participants, user._id, group?._id, isGroupAdmin, canManageGroup]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    if (!group?.participants) return [];
    
    return group.participants.filter(participant => {
      const matchesSearch = !memberSearch || 
        participant.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        participant.user.email.toLowerCase().includes(memberSearch.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || participant.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [group?.participants, memberSearch, roleFilter]);

  // Initialize form data
  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
      setHasChanges(false);
    }
  }, [group]);

  // Track changes
  useEffect(() => {
    const nameChanged = groupName !== (group?.name || '');
    const descChanged = groupDescription !== (group?.description || '');
    setHasChanges(nameChanged || descChanged);
  }, [groupName, groupDescription, group]);

  const handleSaveGeneral = async () => {
    if (!canManage || !groupName.trim()) return;

    setIsLoading(true);
    try {
      const updatedGroup = await updateGroupInfo(group._id, {
        name: groupName.trim(),
        description: groupDescription.trim()
      });
      
      onUpdate?.(updatedGroup);
      setHasChanges(false);
      toast.success('Group settings updated successfully');
    } catch (error) {
      toast.error('Failed to update group settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (participantId, newRole) => {
    if (!isAdmin) {
      toast.error('Only admins can change member roles');
      return;
    }

    try {
      await changeParticipantRole(group._id, participantId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to change member role');
    }
  };

  const handleRemoveParticipant = async (participantId, participantName) => {
    if (!canManage) return;

    try {
      await removeGroupParticipant(group._id, participantId);
      toast.success(`${participantName} removed from group`);
      setShowRemoveConfirm({ show: false, participant: null });
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(group._id);
      toast.success('Left the group successfully');
      setShowLeaveConfirm(false);
      onClose();
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error('Only admins can delete groups');
      return;
    }

    try {
      await deleteGroup(group._id);
      toast.success('Group deleted successfully');
      setShowDeleteConfirm(false);
      onDelete?.();
      onClose();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleReset = () => {
    setGroupName(group?.name || '');
    setGroupDescription(group?.description || '');
  };

  const handleMembersAdded = (updatedGroup, addedMembers) => {
    console.log('Members added callback:', addedMembers);
    onUpdate?.(updatedGroup);
    
    const memberNames = addedMembers.map(m => m.name).join(', ');
    console.log(`Successfully added: ${memberNames}`);
  };

  const handleViewProfile = (user) => {
    toast.success(`Opening ${user.name}'s profile (feature coming soon)`);
  };

  // Export member list
  const handleExportMembers = () => {
    const membersList = group?.participants?.map(p => ({
      name: p.user.name,
      email: p.user.email,
      role: p.role
    })) || [];
    
    const dataStr = JSON.stringify(membersList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${group?.name || 'group'}_members.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Member list exported successfully');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'participants', label: `Members (${participantCount})`, icon: Users },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  const renderGeneralTab = () => (
    <motion.div
      key="general"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-6 space-y-6"
    >
      {/* Group Preview */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
        <div className="flex items-center space-x-4">
          <Avatar
            name={groupName || group?.name || 'Group'}
            type="group"
            size="lg"
          />
          <div>
            <p className="text-white font-medium">{groupName || 'Untitled Group'}</p>
            <p className="text-gray-400 text-sm">{participantCount} members</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportMembers}
            leftIcon={<Download className="w-4 h-4" />}
            title="Export Member List"
          >
            Export
          </Button>
        </div>
      </div>

      <Input
        label="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Enter group name"
        disabled={!canManage}
        maxLength={100}
        icon={<Hash className="w-4 h-4" />}
        variant={canManage ? 'default' : 'disabled'}
      />

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Description
        </label>
        <textarea
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="What's this group about?"
          disabled={!canManage}
          maxLength={500}
          rows={3}
          className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
            !canManage ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-400">
            {groupDescription.length}/500 characters
          </p>
          {!canManage && (
            <p className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
              <Shield className="w-3 h-3 inline mr-1" />
              Admin access required
            </p>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <Button 
            variant="ghost" 
            onClick={handleReset}
            disabled={!hasChanges || isLoading}
          >
            Reset
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveGeneral} 
            disabled={!hasChanges || isLoading || !groupName.trim()}
            loading={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      )}
    </motion.div>
  );

  const renderParticipantsTab = () => (
    <motion.div
      key="participants"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              Group Members
            </h3>
            <p className="text-gray-400 text-sm">
              {participantCount} member{participantCount !== 1 ? 's' : ''} in this group
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {canManage && (
            <Button 
              variant="primary" 
              size="sm" 
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setShowAddMembers(true)}
            >
              Add Members
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        >
          <option value="all" className="bg-gray-800">All Roles</option>
          <option value="admin" className="bg-gray-800">Admins</option>
          <option value="moderator" className="bg-gray-800">Moderators</option>
          <option value="member" className="bg-gray-800">Members</option>
        </select>
      </div>

      {/* Members List */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <AnimatePresence>
          {filteredParticipants.map((participant) => (
            <ParticipantItem
              key={participant.user._id}
              participant={participant}
              currentUserId={user._id}
              isAdmin={isAdmin}
              canManage={canManage}
              isOnline={isUserOnline(participant.user._id)}
              onChangeRole={handleChangeRole}
              onRemove={(participantId, participantName) => setShowRemoveConfirm({ 
                show: true, 
                participant: { id: participantId, name: participantName }
              })}
              onViewProfile={handleViewProfile}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          {memberSearch || roleFilter !== 'all' ? (
            <>
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-300 font-medium mb-2">No members found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            </>
          ) : (
            <>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-300 font-medium mb-2">No members found</h3>
              <p className="text-gray-500 text-sm">This shouldn't happen! Please refresh.</p>
            </>
          )}
        </div>
      )}
    </motion.div>
  );

  const renderDangerZone = () => (
    <motion.div
      key="danger"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6"
    >
      <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
            <p className="text-red-300/70 text-sm">Irreversible actions</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div>
              <p className="text-white font-medium">Leave Group</p>
              <p className="text-gray-400 text-sm">You will no longer have access to this group</p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowLeaveConfirm(true)}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Leave Group
            </Button>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div>
                <p className="text-white font-medium">Delete Group</p>
                <p className="text-gray-400 text-sm">Permanently delete this group and all messages</p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Group
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title="Group Settings"
        className="max-h-[90vh]"
      >
        {/* Enhanced Header */}
        <div className="flex items-center space-x-4 p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <Avatar
            name={group?.name}
            type="group"
            size="lg"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Group Settings</h2>
            <p className="text-gray-300 text-sm">{group?.name}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-400">{participantCount} members</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                userParticipant?.role === 'admin' 
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : userParticipant?.role === 'moderator'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-gray-500/20 text-gray-300'
              }`}>
                {userParticipant?.role || 'member'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex border-b border-white/10 bg-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
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
          <AnimatePresence mode="wait">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'participants' && renderParticipantsTab()}
            {activeTab === 'danger' && renderDangerZone()}
          </AnimatePresence>
        </div>
      </Modal>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        group={group}
        onMembersAdded={handleMembersAdded}
      />

      {/* Leave Group Confirmation */}
      {showLeaveConfirm && (
        <Modal
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          size="md"
          title="Leave Group"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <LogOut className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Leave "{group?.name}"?</h3>
                <p className="text-gray-400">You will no longer have access to this group.</p>
              </div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-amber-300 text-sm font-medium mb-2">After leaving:</p>
              <ul className="text-amber-300/80 text-sm space-y-1 ml-4">
                <li>• You won't receive new messages</li>
                <li>• You'll lose access to group files</li>
                <li>• You can only rejoin if added back by an admin</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleLeaveGroup}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="flex-1"
              >
                Leave Group
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Group Confirmation */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          size="md"
          title="Delete Group"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete "{group?.name}"?</h3>
                <p className="text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm mb-2 font-medium">This will permanently:</p>
              <ul className="text-red-300/80 text-sm space-y-1 ml-4">
                <li>• Delete all messages and files</li>
                <li>• Remove all {participantCount} members</li>
                <li>• Clear all group data</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteGroup}
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="flex-1"
              >
                Delete Group
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove Member Confirmation */}
      {showRemoveConfirm.show && (
        <Modal
          isOpen={showRemoveConfirm.show}
          onClose={() => setShowRemoveConfirm({ show: false, participant: null })}
          size="md"
          title="Remove Member"
        >
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Remove {showRemoveConfirm.participant?.name}?
                </h3>
                <p className="text-gray-400">They will lose access to this group.</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowRemoveConfirm({ show: false, participant: null })}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRemoveParticipant(
                  showRemoveConfirm.participant?.id,
                  showRemoveConfirm.participant?.name
                )}
                leftIcon={<UserMinus className="w-4 h-4" />}
                className="flex-1"
              >
                Remove Member
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default GroupSettings;
