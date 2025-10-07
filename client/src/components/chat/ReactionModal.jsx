/**
 * Reaction Modal - ULTRA OPTIMIZED
 * Enhanced with Button components and better structure
 */
import { motion } from 'framer-motion';
import { reactionHelpers, userHelpers } from '../../utils/chatHelpers';
import { formatChatTime } from '../../utils/formatters';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const ReactionModal = ({ isOpen, onClose, message, reactions = [] }) => {
  if (!reactions.length) return null;

  const reactionGroups = reactionHelpers.groupReactionsByEmoji(reactions);
  const sortedEmojis = Object.keys(reactionGroups).sort((a, b) => 
    reactionGroups[b].length - reactionGroups[a].length
  );
  const totalUsers = new Set(reactions.map(r => r.user?._id)).size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reactions"
      size="md"
      className="max-h-[80vh]"
    >
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Message</h4>
            <span className="text-xs text-gray-400">
              {reactions.length} reaction{reactions.length !== 1 ? 's' : ''} • {totalUsers} user{totalUsers !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-white text-sm bg-white/10 rounded-lg px-3 py-2">
            {message?.content}
          </p>
        </div>

        {/* Reactions by Emoji */}
        <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {sortedEmojis.map((emoji, index) => {
            const emojiReactions = reactionGroups[emoji];
            
            return (
              <motion.div
                key={emoji}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-4"
              >
                {/* OPTIMIZED: Emoji Header using Button */}
                <div className="flex items-center space-x-3 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/10 px-3 py-1 cursor-default"
                    disabled
                  >
                    <span className="text-xl mr-2">{emoji}</span>
                    <span className="text-sm font-medium text-white">
                      {emojiReactions.length}
                    </span>
                  </Button>
                </div>

                {/* Users Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {emojiReactions.slice(0, 5).map((reaction, i) => {
                    const userDetails = userHelpers.getUserDetails(reaction.user);
                    
                    return (
                      <div
                        key={`${userDetails._id}-${i}`}
                        className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={userDetails.avatar}
                            name={userDetails.name}
                            size="sm"
                          />
                          <span className="text-sm text-white">{userDetails.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {reaction.reactedAt && (
                            <span className="text-xs text-gray-400">
                              {formatChatTime(reaction.reactedAt)}
                            </span>
                          )}
                          <span className="text-base">{emoji}</span>
                        </div>
                      </div>
                    );
                  })}

                  {emojiReactions.length > 5 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-400">
                        +{emojiReactions.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* All Reactions Summary */}
        {sortedEmojis.length > 1 && (
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <h4 className="text-sm font-medium text-blue-300 mb-2">All Reactions</h4>
            <div className="flex items-center space-x-2">
              {sortedEmojis.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="xs"
                  className="bg-white/10 px-2 py-1 cursor-default"
                  disabled
                >
                  <span className="text-sm mr-1">{emoji}</span>
                  <span className="text-xs text-gray-300">{reactionGroups[emoji].length}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReactionModal;
