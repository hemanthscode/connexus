/**
 * Settings Page Component
 * App settings and preferences with enhanced components
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  Palette, 
  Globe,
  Shield,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'Manage your profile information',
          onClick: () => navigate(ROUTES.PROFILE),
        },
        {
          icon: Lock,
          label: 'Privacy & Security',
          description: 'Control your privacy settings',
          onClick: () => toast.info('Privacy settings coming soon'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          onClick: () => toast.info('Notification settings coming soon'),
        },
        {
          icon: Palette,
          label: 'Appearance',
          description: 'Customize your app appearance',
          onClick: () => toast.info('Appearance settings coming soon'),
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'Change your language preference',
          onClick: () => toast.info('Language settings coming soon'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'Get help and contact support',
          onClick: () => toast.info('Help center coming soon'),
        },
        {
          icon: Shield,
          label: 'About',
          description: 'App version and information',
          onClick: () => toast.info('About page coming soon'),
        },
      ],
    },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.CHAT)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          />
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">{group.title}</h2>
              </div>
              
              <div className="divide-y divide-white/10">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className="w-full flex items-center space-x-4 p-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-300" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Logout Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center space-x-4 p-4 hover:bg-red-500/10 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-medium">Logout</p>
                <p className="text-red-300/70 text-sm">Sign out from your account</p>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        confirmText="Logout"
        type="warning"
      >
        <div className="p-6">
          <p className="text-gray-300">
            Are you sure you want to logout? You'll need to sign in again to access your conversations.
          </p>
        </div>
      </ConfirmModal>
    </Layout>
  );
};

export default Settings;
