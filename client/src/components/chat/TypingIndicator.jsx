import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '../../utils/formatters';

const TypingIndicator = ({ typingUsers, conversationId }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const renderTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center space-x-3 mb-4"
      >
        {/* Typing user avatars */}
        <div className="flex -space-x-1">
          {typingUsers.slice(0, 3).map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-6 h-6 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">
                    {getInitials(user.name || 'U')}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Typing bubble */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white/10 px-4 py-2 rounded-2xl flex items-center space-x-2"
        >
          <span className="text-gray-300 text-sm">
            {renderTypingText()}
          </span>
          
          {/* Animated dots */}
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
