import React, { useMemo } from 'react';
import Avatar from '../common/Avatar.jsx';

const ChatHeader = ({ otherUser }) => {
  const initials = useMemo(() => {
    if (otherUser?.avatar) return undefined;
    if (!otherUser?.name) return '';
    return otherUser.name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }, [otherUser]);

  if (!otherUser) return null;

  return (
    <header className="flex items-center px-5 py-4 border-b border-gray-300 bg-white shadow-sm select-none">
      <Avatar src={otherUser.avatar} alt={otherUser.name} size={48} initials={initials} />
      <div className="ml-4 truncate">
        <h2
          className="text-xl font-semibold text-gray-900 truncate"
          title={otherUser.name}
          aria-label={`Chat with ${otherUser.name}`}
        >
          {otherUser.name}
        </h2>
        <p className={`text-sm ${otherUser.status === 'online' ? 'text-green-600' : 'text-gray-500'}`}>
          {otherUser.status === 'online' ? 'Online' : 'Offline'}
        </p>
      </div>
    </header>
  );
};

export default ChatHeader;
