import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import ProfileModal from '../components/profile/ProfileModal';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user: currentUser } = useAuth();
  const { searchUsers, searchResults } = useChat();

  const isOwnProfile = !userId || userId === currentUser?._id;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    if (userId && userId !== currentUser?._id) {
      // Load user profile by ID
      loadUserProfile(userId);
    }
  }, [userId, currentUser]);

  const loadUserProfile = async (id) => {
    setIsLoading(true);
    try {
      // Search for user by ID (you might need a dedicated API for this)
      await searchUsers(id);
      const foundUser = searchResults.find(u => u._id === id);
      setProfileUser(foundUser || null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      navigate('/404');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chat')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            {isOwnProfile ? 'My Profile' : `${displayUser?.name || 'User'}'s Profile`}
          </h1>
        </div>
        
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <ProfileModal
            user={displayUser}
            isOpen={true}
            onClose={() => navigate('/chat')}
            isOwnProfile={isOwnProfile}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
