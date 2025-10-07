/**
 * Conversation Item - ALREADY OPTIMIZED
 * Keeping existing optimized version (no changes needed)
 */
import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useConversationInfo } from '../../hooks/useConversationInfo';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime } from '../../utils/formatters';
import Avatar from '../ui/Avatar';

const ConversationItem = memo(forwardRef(({ 
  conversation, 
  isActive, 
  unreadCount, 
  onClick 
}, ref) => {
  const { user } = useAuth();
  const { isUserOnline, getTypingIndicatorText, getTypingUsers } = useSocket();
  const info = useConversationInfo(conversation);

  const typingText = getTypingIndicatorText(conversation._id, user?._id);
  const hasTyping = getTypingUsers(conversation._id).length > 0;
  const isOnlineNow = conversation.type === 'direct' ? isUserOnline(info.userId) : false;
  const timeDisplay = conversation.lastMessage?.timestamp 
    ? formatRelativeTime(conversation.lastMessage.timestamp, { shortForm: true }) : '';

  // Consolidated styling logic
  const getItemStyle = () => {
    if (isActive) return 'bg-blue-600/20 border border-blue-500/40 shadow-lg shadow-blue-500/10';
    if (unreadCount > 0) return 'bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-400/40';
    return 'border border-transparent hover:bg-white/8 hover:border-white/20 hover:shadow-lg';
  };

  const getTextStyle = (type) => {
    const baseStyles = {
      title: 'font-semibold text-sm truncate pr-2 leading-tight transition-colors duration-200',
      time: 'text-xs flex-shrink-0 leading-tight transition-colors duration-200',
      preview: 'text-xs truncate leading-relaxed flex-1 transition-colors duration-200'
    };

    const colorMap = {
      active: { title: 'text-blue-100', time: 'text-blue-300', preview: 'text-blue-200/80' },
      typing: { preview: 'text-blue-400 italic font-medium' },
      default: { 
        title: 'text-white group-hover:text-blue-100', 
        time: 'text-gray-400 group-hover:text-gray-300',
        preview: 'text-gray-400 group-hover:text-gray-300'
      }
    };

    if (hasTyping && type === 'preview') return `${baseStyles[type]} ${colorMap.typing.preview}`;
    if (isActive) return `${baseStyles[type]} ${colorMap.active[type] || colorMap.active.title}`;
    return `${baseStyles[type]} ${colorMap.default[type]}`;
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
      onClick={() => onClick(conversation._id)}
      className={`w-full p-4 rounded-xl transition-all duration-300 text-left group ${getItemStyle()}`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-105">
          <Avatar
            src={info.avatar}
            name={info.name}
            type={info.type}
            size="lg"
            isOnline={isOnlineNow}
            showOnlineStatus={info.type === 'direct'}
            userId={info.userId}
          />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-baseline justify-between mb-1.5">
            <h3 className={getTextStyle('title')}>{info.name}</h3>
            {timeDisplay && !hasTyping && (
              <span className={getTextStyle('time')}>{timeDisplay}</span>
            )}
          </div>

          <div className="flex items-center">
            {hasTyping && (
              <div className="flex items-center space-x-1 mr-2">
                <div className="flex space-x-1">
                  {[0, 150, 300].map((delay, i) => (
                    <div 
                      key={i}
                      className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" 
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className={getTextStyle('preview')}>
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
