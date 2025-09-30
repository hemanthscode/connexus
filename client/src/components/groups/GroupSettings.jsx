import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Crown, 
  Shield, 
  UserMinus, 
  UserPlus,
  Edit,
  Trash2,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const GroupSettings = ({ group, onClose, onUpdate, onLeave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('general');
  const { user } = useAuth();
  
  const isAdmin = group.participants?.find(p => 
    p.user._id === user._id && p.role === 'admin'
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{group.name}</h2>
            <p className="text-gray-300 text-sm">{group.participants?.length} members</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Group Name
              </label>
              <div className="text-white">{group.name}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description
              </label>
              <div className="text-gray-300">{group.description || 'No description'}</div>
            </div>

            {isAdmin && (
              <div className="flex space-x-3">
                <Button variant="secondary" className="flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit Group</span>
                </Button>
                <Button variant="danger" className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Group</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Members</h3>
              {isAdmin && (
                <Button variant="secondary" size="sm">
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {group.participants?.map((participant) => (
                <div key={participant.user._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {participant.user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{participant.user.name}</p>
                      <div className="flex items-center space-x-1">
                        {participant.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400" />}
                        {participant.role === 'moderator' && <Shield className="w-3 h-3 text-blue-400" />}
                        <span className="text-xs text-gray-400 capitalize">{participant.role}</span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && participant.user._id !== user._id && (
                    <Button variant="ghost" size="sm" className="text-red-400">
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 flex justify-between">
        <Button 
          variant="danger" 
          onClick={onLeave}
          className="flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Group</span>
        </Button>
        
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default GroupSettings;
