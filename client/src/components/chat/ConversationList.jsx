import React, { useMemo } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Avatar from '../common/Avatar.jsx';

const ConversationList = ({ selectedId, onSelectConversation, conversations }) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  const filteredConversations = useMemo(() => conversations || [], [conversations]);

  return (
    <>
      {filteredConversations.length === 0 && (
        <div className="p-4 text-gray-500 select-none">No conversations found.</div>
      )}
      {filteredConversations.map(conv => {
        const isSelected = selectedId === conv._id;
        const otherParticipants = conv.participants.filter(p => p.user._id !== user._id);
        const displayName =
          conv.name || otherParticipants.map(p => p.user.name).join(', ') || 'Conversation';
        const unreadCount = conv.unreadCount || 0;
        const isOnline = otherParticipants.some(p => onlineUsers.has(p.user._id));

        return (
          <div
            key={conv._id}
            onClick={() => onSelectConversation(conv)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelectConversation(conv)}
            className={`p-4 cursor-pointer border-b border-gray-200 truncate flex justify-between items-center ${
              isSelected ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-50'
            }`}
            aria-current={isSelected ? 'true' : undefined}
            aria-label={`Conversation with ${displayName}`}
          >
            <div className="flex items-center space-x-3 truncate">
              <Avatar
                src={otherParticipants[0]?.user.avatar}
                alt={otherParticipants[0]?.user.name}
                size={32}
                isOnline={isOnline}
                initials={
                  !otherParticipants[0]?.user.avatar
                    ? otherParticipants[0]?.user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                    : undefined
                }
              />
              <span className="truncate">{displayName}</span>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 ? (
                <span
                  className="inline-block min-w-[20px] px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-medium text-center select-none"
                  aria-label={`${unreadCount} new messages`}
                >
                  {unreadCount}
                </span>
              ) : (
                <span
                  className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                  title={isOnline ? 'Online' : 'Offline'}
                  aria-label={isOnline ? 'Online' : 'Offline'}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ConversationList;
