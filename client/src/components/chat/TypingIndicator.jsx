/**
 * Typing Indicator - ULTRA OPTIMIZED
 * Fixed avatar inconsistencies, maximized Avatar component usage
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { typingHelpers, userHelpers } from '../../utils/chatHelpers';
import Avatar from '../ui/Avatar';

const TypingIndicator = ({ conversationId }) => {
  const { getTypingUsers } = useSocket();
  const { user } = useAuth();
  
  const allTypingUsers = getTypingUsers(conversationId) || [];
  const typingUsers = allTypingUsers.filter(typingUser => !userHelpers.isSameUser(typingUser, user));
  
  // ENHANCED: Use typingHelpers for consistent text
  const typingText = typingHelpers.formatTypingText(typingUsers, user?._id);

  if (!typingHelpers.hasTypingUsers(typingUsers, user?._id)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center space-x-3 mb-4"
      >
        {/* FIXED: Consistent Avatar usage */}
        <div className="flex -space-x-1">
          {typingUsers.slice(0, 3).map((typingUser, index) => {
            const userDetails = userHelpers.getUserDetails(typingUser);
            
            return (
              <motion.div
                key={`typing-${userDetails._id}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Avatar
                  src={userDetails.avatar}
                  name={userDetails.name}
                  size="sm"
                  className="border-2 border-white"
                />
              </motion.div>
            );
          })}
        </div>

        {/* OPTIMIZED: Typing bubble */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white/10 px-4 py-2 rounded-2xl flex items-center space-x-2"
        >
          <span className="text-gray-300 text-sm">{typingText}</span>
          
          {/* OPTIMIZED: Animated dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="w-1 h-1 bg-gray-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: dot * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;
