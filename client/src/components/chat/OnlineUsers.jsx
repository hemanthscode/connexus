/**
 * Online Users Component
 * Enhanced online status display with socket integration
 */

import { motion } from 'framer-motion';
import { getInitials } from '../../utils/formatters';
import { useSocket } from '../../hooks/useSocket';

const OnlineUsers = ({ className = '', limit = 10 }) => {
  const { onlineUsers, isUserOnline } = useSocket();

  if (!onlineUsers || onlineUsers.length === 0) return null;

  const displayUsers = onlineUsers.slice(0, limit);
  const remainingCount = Math.max(0, onlineUsers.length - limit);

  return (
    <div className={className}>
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        Online ({onlineUsers.length})
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {displayUsers.map((onlineUser) => (
          <motion.div
            key={onlineUser.userId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative group cursor-pointer"
            title={`${onlineUser.name || onlineUser.username || 'User'} - Online`}
          >
            {onlineUser.avatar ? (
              <img 
                src={onlineUser.avatar} 
                alt={onlineUser.name || onlineUser.username} 
                className="w-8 h-8 rounded-full border-2 border-green-500"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-green-500">
                <span className="text-white text-xs font-medium">
                  {getInitials(onlineUser.name || onlineUser.username || 'U')}
                </span>
              </div>
            )}
            
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {onlineUser.name || onlineUser.username || 'User'}
            </div>
          </motion.div>
        ))}
        
        {remainingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20"
            title={`${remainingCount} more users online`}
          >
            <span className="text-white text-xs font-medium">
              +{remainingCount}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
