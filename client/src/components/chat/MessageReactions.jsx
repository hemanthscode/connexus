import React, { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const MessageReactions = ({ reactions = [], currentUser, messageId }) => {
  const [localReactions, setLocalReactions] = useState(reactions);
  const { emitAddReaction, emitRemoveReaction } = useSocket();

  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  const userHasReacted = (emoji) =>
    localReactions.some(r => r.user === currentUser && r.emoji === emoji);

  const handleToggleReaction = (emoji) => {
    if (userHasReacted(emoji)) {
      setLocalReactions(localReactions.filter(r => !(r.user === currentUser && r.emoji === emoji)));
      emitRemoveReaction(messageId, emoji);
    } else {
      setLocalReactions([...localReactions, { user: currentUser, emoji }]);
      emitAddReaction(messageId, emoji);
    }
  };

  return (
    <div className="flex space-x-3 mt-1" aria-label="Message reactions">
      {reactionEmojis.map(emoji => {
        const count = localReactions.filter(r => r.emoji === emoji).length;
        const reacted = userHasReacted(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleToggleReaction(emoji)}
            type="button"
            className={`px-2 py-1 rounded select-none focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              reacted ? 'bg-blue-200' : 'hover:bg-gray-200'
            }`}
            aria-pressed={reacted}
            aria-label={`${reacted ? 'Remove' : 'Add'} reaction ${emoji}`}
          >
            <span className="text-lg">{emoji}</span> {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;
