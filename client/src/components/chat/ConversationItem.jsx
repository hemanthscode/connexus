import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useConversationInfo } from '../../hooks/useConversationInfo';
import Avatar from '../ui/Avatar';

const ConversationItem = memo(forwardRef(({ 
  conversation, 
  isActive, 
  unreadCount, 
  typingText, 
  onClick 
}, ref) => {
  const info = useConversationInfo(conversation);

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(conversation._id)}
      className={`w-full p-4 rounded-xl transition-all duration-200 text-left ${
        isActive 
          ? 'bg-blue-600/20 border border-blue-500/30' 
          : unreadCount > 0
            ? 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15'
            : 'hover:bg-white/5 border border-transparent hover:border-white/10'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar Section - Fixed positioning */}
        <div className="relative flex-shrink-0 mt-0.5">
          <Avatar
            src={info.avatar}
            name={info.name}
            type={info.type}
            size="lg"
            isOnline={info.isOnline}
            showOnlineStatus={info.type === 'direct'}
          />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        {/* Content Section - Perfect Alignment */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Header Row - Name & Time with consistent baseline */}
          <div className="flex items-baseline justify-between mb-1.5">
            <h3 className={`font-semibold text-sm truncate pr-2 leading-tight ${
              isActive ? 'text-blue-100' : 'text-white'
            }`}>
              {info.name}
            </h3>
            {conversation.lastMessage?.timestamp && (
              <span className="text-xs text-gray-400 flex-shrink-0 leading-tight">
                {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: false })}
              </span>
            )}
          </div>

          {/* Message Row - Perfectly aligned with name */}
          <div className="flex items-center">
            <p className={`text-xs truncate leading-relaxed flex-1 ${
              typingText ? 'text-blue-400 italic font-medium' : 
              isActive ? 'text-blue-200/80' : 'text-gray-400'
            }`}>
              {typingText || info.getLastMessagePreview}
            </p>
          </div>
        </div>
      </div>
    </motion.button>
  );
}));

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
