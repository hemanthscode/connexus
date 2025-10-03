import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getInitials } from '../../utils/formatters';
import Button from '../ui/Button';

const ReactionModal = ({ isOpen, onClose, message, reactions = [] }) => {
  if (!isOpen || !message || !reactions.length) return null;

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((groups, reaction) => {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = [];
    }
    groups[reaction.emoji].push(reaction);
    return groups;
  }, {});

  const sortedEmojis = Object.keys(reactionGroups).sort((a, b) => {
    return reactionGroups[b].length - reactionGroups[a].length; // Sort by count descending
  });

  const totalReactions = reactions.length;
  const uniqueUsers = new Set(reactions.map(r => {
    // Handle both populated and non-populated user data
    return r.user?._id || r.user;
  })).size;

  // ENHANCED: Helper function to get user details safely
  const getUserDetails = (reaction) => {
    // Handle different data structures from backend
    if (reaction.userDetails) {
      return reaction.userDetails;
    } else if (reaction.user && typeof reaction.user === 'object') {
      return reaction.user;
    } else {
      return {
        _id: reaction.user,
        name: 'Unknown User',
        email: '',
        avatar: null
      };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-semibold text-white">Reactions</h3>
              <p className="text-sm text-gray-400">
                {totalReactions} reaction{totalReactions !== 1 ? 's' : ''} from {uniqueUsers} user{uniqueUsers !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Message Preview */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {message.sender?.avatar ? (
                  <img 
                    src={message.sender.avatar} 
                    alt={message.sender.name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">
                      {getInitials(message.sender?.name || 'U')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 mb-1">
                  {message.sender?.name || 'Unknown'}
                </p>
                <p className="text-sm text-white bg-white/10 rounded-lg px-3 py-2 break-words">
                  {message.content}
                </p>
              </div>
            </div>
          </div>

          {/* Reactions List */}
          <div className="flex-1 overflow-y-auto max-h-96">
            <div className="p-4 space-y-4">
              {sortedEmojis.map((emoji) => {
                const emojiReactions = reactionGroups[emoji];
                
                return (
                  <motion.div
                    key={emoji}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Emoji Header */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-white/5 rounded-full px-3 py-2">
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-sm font-medium text-white">
                          {emojiReactions.length}
                        </span>
                      </div>
                    </div>

                    {/* Users who reacted */}
                    <div className="space-y-2 pl-4">
                      {emojiReactions.map((reaction, index) => {
                        const userDetails = getUserDetails(reaction);
                        
                        return (
                          <motion.div
                            key={`${userDetails._id}-${reaction.emoji}-${index}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            {/* User Avatar */}
                            <div className="flex-shrink-0">
                              {userDetails.avatar ? (
                                <img 
                                  src={userDetails.avatar} 
                                  alt={userDetails.name} 
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">
                                    {getInitials(userDetails.name)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {userDetails.name}
                              </p>
                              {(reaction.reactedAt || reaction.timestamp) && (
                                <p className="text-xs text-gray-400">
                                  {new Date(reaction.reactedAt || reaction.timestamp).toLocaleTimeString()}
                                </p>
                              )}
                            </div>

                            {/* Reaction Emoji */}
                            <div className="flex-shrink-0">
                              <span className="text-lg">{emoji}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReactionModal;
