import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Shield, 
  Crown, 
  UserMinus, 
  UserPlus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Loading from '../ui/Loading';
import toast from 'react-hot-toast';

const GroupSettings = ({ group, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // General settings state
  const [groupName, setGroupName] = useState(group?.name || '');
  const [groupDescription, setGroupDescription] = useState(group?.description || '');
  const [groupAvatar, setGroupAvatar] = useState(group?.avatar || '');
  
  // Participants state
  const [participants, setParticipants] = useState(group?.participants || []);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  
  const { user } = useAuth();
  const { searchUsers, searchResults } = useChat();

  const isAdmin = group?.participants?.find(p => p.user._id === user._id)?.role === 'admin';
  const isModerator = group?.participants?.find(p => p.user._id === user._id)?.role === 'moderator';
  const canManage = isAdmin || isModerator;

  useEffect(() => {
    if (group) {
      setGroupName(group.name || '');
      setGroupDescription(group.description || '');
      setGroupAvatar(group.avatar || '');
      setParticipants(group.participants || []);
    }
  }, [group]);

  const handleSaveGeneral = async () => {
    if (!canManage) {
      toast.error('You do not have permission to edit group settings');
      return;
    }

    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updatedGroup = {
        ...group,
        name: groupName.trim(),
        description: groupDescription.trim(),
        avatar: groupAvatar
      };
      
      // This would call your update group API
      await onUpdate(updatedGroup);
      toast.success('Group settings updated successfully');
      
    } catch (error) {
      console.error('Failed to update group:', error);
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
      const updatedParticipants = participants.map(p => 
        p.user._id === participantId ? { ...p, role: newRole } : p
      );
      setParticipants(updatedParticipants);
      
      // This would call your change role API
      toast.success(`Role updated to ${newRole}`);
      
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error('Failed to change member role');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!canManage) {
      toast.error('You do not have permission to remove members');
      return;
    }

    try {
      const updatedParticipants = participants.filter(p => p.user._id !== participantId);
      setParticipants(updatedParticipants);
      
      // This would call your remove participant API
      toast.success('Member removed from group');
      
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      // This would call your leave group API
      toast.success('Left the group');
      onClose();
      
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error('Only admins can delete the group');
      return;
    }

    try {
      // This would call your delete group API
      toast.success('Group deleted successfully');
      onClose();
      
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group');
    }
  };

  const renderGeneralTab = () => (
    <div className="p-6 space-y-6">
      <div>
        <Input
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          disabled={!canManage}
          maxLength={100}
        />
      </div>

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
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none disabled:opacity-50"
        />
        <p className="text-xs text-gray-400 mt-1">
          {groupDescription.length}/500 characters
        </p>
      </div>

      <div>
        <Input
          label="Group Avatar URL (Optional)"
          value={groupAvatar}
          onChange={(e) => setGroupAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          disabled={!canManage}
        />
      </div>

      {canManage && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveGeneral} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? <Loading size="sm" /> : <Save className="w-4 h-4" />}
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      )}
    </div>
  );

  const renderParticipantsTab = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Members ({participants.length})
        </h3>
        {canManage && (
          <Button variant="primary" size="sm" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add Members</span>
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant.user._id}
            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {participant.user.avatar ? (
                  <img 
                    src={participant.user.avatar} 
                    alt={participant.user.name} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {getInitials(participant.user.name)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-white font-medium truncate">
                    {participant.user.name}
                  </p>
                  {participant.user._id === user._id && (
                    <span className="text-xs text-blue-400">(You)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-400 text-sm truncate">
                    {participant.user.email}
                  </p>
                  <div className="flex items-center space-x-1">
                    {participant.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400" />}
                    {participant.role === 'moderator' && <Shield className="w-3 h-3 text-purple-400" />}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      participant.role === 'admin' 
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : participant.role === 'moderator'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {participant.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {canManage && participant.user._id !== user._id && (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <select
                    value={participant.role}
                    onChange={(e) => handleChangeRole(participant.user._id, e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member" className="bg-gray-800">Member</option>
                    <option value="moderator" className="bg-gray-800">Moderator</option>
                    {isAdmin && <option value="admin" className="bg-gray-800">Admin</option>}
                  </select>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveParticipant(participant.user._id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDangerZone = () => (
    <div className="p-6 space-y-4">
      <div className="border border-red-500/30 rounded-xl p-4 bg-red-500/5">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Leave Group</p>
              <p className="text-gray-400 text-sm">You will no longer have access to this group</p>
            </div>
            <Button
              variant="danger"
              onClick={handleLeaveGroup}
              className="flex items-center space-x-2"
            >
              <UserMinus className="w-4 h-4" />
              <span>Leave Group</span>
            </Button>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-4 border-t border-red-500/20">
              <div>
                <p className="text-white font-medium">Delete Group</p>
                <p className="text-gray-400 text-sm">Permanently delete this group and all messages</p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Group</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'participants', label: 'Members', icon: Users },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        className="max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Group Settings</h2>
              <p className="text-gray-300 text-sm">{group?.name}</p>
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
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'participants' && renderParticipantsTab()}
          {activeTab === 'danger' && renderDangerZone()}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="sm"
        title="Delete Group"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Delete "{group?.name}"?</h3>
              <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">
              All messages, files, and group data will be permanently deleted.
            </p>
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
              className="flex-1"
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GroupSettings;
