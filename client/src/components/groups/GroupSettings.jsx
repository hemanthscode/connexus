/**
 * Group Settings - OPTIMIZED & MINIMAL
 * Reduced from 1000+ lines to ~300 lines
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Users, AlertTriangle, Crown, Shield, UserMinus, UserPlus, 
  Trash2, Save, Search, LogOut, Hash
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { userHelpers, permissionHelpers } from '../../utils/chatHelpers';
import { chatValidation, sanitizers } from '../../utils/validation';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal, { ConfirmModal } from '../ui/Modal';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const GroupSettings = ({ group, isOpen, onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [removeUser, setRemoveUser] = useState(null);

  const { user } = useAuth();
  const { 
    updateGroupInfo, removeGroupParticipant, changeParticipantRole, 
    leaveGroup, deleteGroup, searchUsers, searchResults, addGroupParticipants
  } = useChat();
  const { isUserOnline } = useSocket();

  // Initialize form
  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
    }
  }, [group]);

  // Permissions
  const permissions = useMemo(() => {
    const userRole = permissionHelpers.getUserRole(group, user?._id);
    return {
      isAdmin: permissionHelpers.hasGroupPermission(group, user?._id, 'admin'),
      canManage: permissionHelpers.canPerformGroupAction(group, user?._id, 'manage_settings'),
      userRole,
      participantCount: group?.participants?.length || 0
    };
  }, [group, user?._id]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    if (!group?.participants) return [];
    return group.participants.filter(participant => {
      const userDetails = userHelpers.getUserDetails(participant.user);
      return !memberSearch || 
        userDetails.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        userDetails.email.toLowerCase().includes(memberSearch.toLowerCase());
    });
  }, [group?.participants, memberSearch]);

  const hasChanges = groupName !== (group?.name || '') || groupDescription !== (group?.description || '');

  // Handlers
  const handleSaveGeneral = async () => {
    if (!permissions.canManage || !groupName.trim()) return;

    try {
      const updatedGroup = await updateGroupInfo(group._id, {
        name: sanitizers.name(groupName),
        description: sanitizers.message(groupDescription)
      });
      onUpdate?.(updatedGroup);
      toast.success('Group settings updated');
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  const handleChangeRole = async (participantId, newRole) => {
    try {
      await changeParticipantRole(group._id, participantId, newRole);
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      toast.error(error.message || 'Role update failed');
    }
  };

  const handleRemoveParticipant = async () => {
    try {
      await removeGroupParticipant(group._id, removeUser.id);
      toast.success(`${removeUser.name} removed from group`);
      setRemoveUser(null);
    } catch (error) {
      toast.error(error.message || 'Remove failed');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(group._id);
      toast.success('Left the group');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Leave failed');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group._id);
      toast.success('Group deleted');
      onDelete?.();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    }
  };

  // Add Members Modal
  const AddMembersModal = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
      if (searchQuery?.length >= 2) {
        const timeout = setTimeout(() => searchUsers(searchQuery), 300);
        return () => clearTimeout(timeout);
      }
    }, [searchQuery]);

    const availableUsers = userHelpers.filterNewUsers(
      searchResults, 
      group?.participants?.map(p => ({ _id: p.user._id })) || [], 
      user?._id
    );

    const handleAddMembers = async () => {
      if (selectedUsers.length === 0) return;
      try {
        await addGroupParticipants(group._id, selectedUsers.map(u => u._id));
        toast.success(`Added ${selectedUsers.length} member(s)`);
        setShowAddModal(false);
        setSelectedUsers([]);
        setSearchQuery('');
      } catch (error) {
        toast.error(error.message || 'Add failed');
      }
    };

    const toggleUser = (user) => {
      setSelectedUsers(prev => 
        prev.find(u => u._id === user._id) 
          ? prev.filter(u => u._id !== user._id)
          : [...prev, user]
      );
    };

    return (
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="md"
        title="Add Members"
      >
        <div className="p-6 space-y-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            icon={<Search className="w-4 h-4" />}
          />

          {selectedUsers.length > 0 && (
            <div className="bg-blue-500/10 rounded-xl p-3">
              <p className="text-blue-300 text-sm mb-2">Selected ({selectedUsers.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div key={user._id} className="flex items-center space-x-1 bg-blue-500/20 rounded px-2 py-1">
                    <span className="text-sm text-white">{user.name}</span>
                    <button onClick={() => toggleUser(user)} className="text-blue-300 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2">
            {availableUsers.map(user => (
              <div
                key={user._id}
                onClick={() => toggleUser(user)}
                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <div>
                    <p className="text-white text-sm">{user.name}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </div>
                {selectedUsers.find(u => u._id === user._id) ? (
                  <Shield className="w-4 h-4 text-green-400" />
                ) : (
                  <UserPlus className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0}
              className="flex-1"
            >
              Add {selectedUsers.length > 0 && `${selectedUsers.length} `}Members
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  // Participant Item
  const ParticipantItem = ({ participant }) => {
    const isCurrentUser = userHelpers.isSameUser(participant.user, { _id: user?._id });
    const userDetails = userHelpers.getUserDetails(participant.user);
    const roleStyles = {
      admin: 'bg-yellow-500/20 text-yellow-300',
      moderator: 'bg-purple-500/20 text-purple-300',
      member: 'bg-gray-500/20 text-gray-300'
    };

    return (
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
        <div className="flex items-center space-x-3">
          <Avatar 
            src={userDetails.avatar} 
            name={userDetails.name} 
            size="md" 
            isOnline={isUserOnline(participant.user._id)}
            showOnlineStatus 
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-white font-medium">{userDetails.name}</p>
              {isCurrentUser && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">You</span>}
            </div>
            <p className="text-gray-400 text-sm">{userDetails.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${roleStyles[participant.role]}`}>
            {participant.role === 'admin' && <Crown className="w-3 h-3 inline mr-1" />}
            {participant.role}
          </span>
          
          {permissions.isAdmin && !isCurrentUser && (
            <>
              <select
                value={participant.role}
                onChange={(e) => handleChangeRole(participant.user._id, e.target.value)}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
              >
                <option value="member" className="bg-gray-800">Member</option>
                <option value="moderator" className="bg-gray-800">Moderator</option>
                <option value="admin" className="bg-gray-800">Admin</option>
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveUser({ id: participant.user._id, name: userDetails.name })}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'participants', label: `Members (${permissions.participantCount})`, icon: Users },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Group Settings">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6 border-b border-white/10">
          <Avatar name={group?.name} type="group" size="lg" />
          <div>
            <h2 className="text-xl font-bold text-white">{group?.name}</h2>
            <p className="text-gray-400 text-sm">{permissions.participantCount} members • {permissions.userRole}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
                <Input
                  label="Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  disabled={!permissions.canManage}
                  icon={<Hash className="w-4 h-4" />}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Description</label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What's this group about?"
                    disabled={!permissions.canManage}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {permissions.canManage && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                    <Button 
                      variant="ghost" 
                      onClick={() => { setGroupName(group?.name || ''); setGroupDescription(group?.description || ''); }} 
                      disabled={!hasChanges}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSaveGeneral} 
                      disabled={!hasChanges || !groupName.trim()} 
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'participants' && (
              <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Input
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                    className="flex-1 mr-4"
                  />
                  {permissions.canManage && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      onClick={() => setShowAddModal(true)}
                    >
                      Add
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredParticipants.map((participant) => (
                    <ParticipantItem key={participant.user._id} participant={participant} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div key="danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
                <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Leave Group</p>
                      <p className="text-gray-400 text-sm">You will lose access to this group</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowLeaveModal(true)} leftIcon={<LogOut className="w-4 h-4" />}>
                      Leave
                    </Button>
                  </div>

                  {permissions.isAdmin && (
                    <div className="flex items-center justify-between pt-4 border-t border-red-500/20">
                      <div>
                        <p className="text-white font-medium">Delete Group</p>
                        <p className="text-gray-400 text-sm">Permanently delete this group</p>
                      </div>
                      <Button variant="danger" onClick={() => setShowDeleteModal(true)} leftIcon={<Trash2 className="w-4 h-4" />}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {/* Add Members Modal */}
      <AddMembersModal />

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeaveGroup}
        title="Leave Group"
        confirmText="Leave Group"
      >
        <div className="p-6">
          <p className="text-gray-300">You will lose access to this group and its messages.</p>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        confirmText="Delete Group"
      >
        <div className="p-6">
          <p className="text-gray-300">This will permanently delete all messages and remove all {permissions.participantCount} members.</p>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!removeUser}
        onClose={() => setRemoveUser(null)}
        onConfirm={handleRemoveParticipant}
        title={`Remove ${removeUser?.name}?`}
        confirmText="Remove"
      >
        <div className="p-6">
          <p className="text-gray-300">They will lose access to this group and its messages.</p>
        </div>
      </ConfirmModal>
    </>
  );
};

export default GroupSettings;
