import React, { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Avatar from '../common/Avatar.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import MessageReactions from './MessageReactions.jsx';
import useSmoothScroll from '../../hooks/useSmoothScroll.js';
import { format } from 'date-fns';
import { getMessages } from '../../services/chatApi.js';
import toast from 'react-hot-toast';

const MessageList = ({ conversationId }) => {
  const { typingUsers, messageUpdates } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localTypingUsers, setLocalTypingUsers] = useState([]);
  const scrollRef = useSmoothScroll([messages]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getMessages(conversationId)
      .then(msgs => {
        setMessages(msgs);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load messages');
        setMessages([]);
        setLoading(false);
      });
  }, [conversationId]);

  // Merge new incoming socket messages avoiding duplicates
  useEffect(() => {
    if (!conversationId) return;
    const newMsgsForConv = messageUpdates.filter(mu => mu.conversationId === conversationId);
    if (newMsgsForConv.length) {
      setMessages(prevMessages => {
        const existingIds = new Set(prevMessages.map(m => m._id));
        const filteredNew = newMsgsForConv
          .map(mu => mu.message)
          .filter(m => !existingIds.has(m._id));
        return [...prevMessages, ...filteredNew];
      });
    }
  }, [messageUpdates, conversationId]);

  // Update typing users referencing this conv
  useEffect(() => {
    if (!conversationId) {
      setLocalTypingUsers([]);
      return;
    }
    const usersTypingSet = typingUsers[conversationId];
    setLocalTypingUsers(usersTypingSet ? Array.from(usersTypingSet) : []);
  }, [typingUsers, conversationId]);

  if (loading) {
    return (
      <div className="p-4 text-gray-600 select-none" aria-live="polite">
        Loading messages...
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="p-4 text-gray-600 select-none" aria-live="polite">
        Select a conversation
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-white scroll-smooth rounded-md h-[calc(100vh-220px)]"
        aria-live="polite"
        aria-relevant="additions"
        role="log"
      >
        {messages.length === 0 && (
          <div className="text-gray-500 select-none">No messages in this conversation.</div>
        )}
        {messages.map(msg => {
          const name = msg.sender?.name || 'Unknown';
          const avatar = msg.sender?.avatar;
          const initials = !avatar
            ? name
                .split(' ')
                .filter(Boolean)
                .map(n => n[0])
                .join('')
                .toUpperCase()
            : undefined;
          const isOwnMessage = user?._id === msg.sender?._id;

          return (
            <article
              key={msg._id}
              className={`flex flex-col max-w-xl ${isOwnMessage ? 'ml-auto' : 'mr-auto'}`}
              aria-label={`${isOwnMessage ? 'Your' : name + "'s"} message`}
            >
              <div className="flex items-center space-x-3 mb-1">
                <Avatar src={avatar} alt={name} size={36} initials={initials} />
                <span className="text-xs text-gray-800 font-semibold truncate max-w-xs">{name}</span>
                <time
                  className="text-xs text-gray-400"
                  dateTime={msg.createdAt}
                  title={new Date(msg.createdAt).toLocaleString()}
                >
                  {format(new Date(msg.createdAt), 'p, MMM d')}
                </time>
              </div>
              <div className="bg-gray-100 rounded-xl p-4 whitespace-pre-wrap break-words shadow max-w-xs">
                {msg.content}
              </div>
              <MessageReactions
                reactions={msg.reactions || []}
                currentUser={user?._id}
                messageId={msg._id}
                conversationId={conversationId}
              />
            </article>
          );
        })}
      </div>
      <TypingIndicator typingUsers={localTypingUsers} />
    </>
  );
};

export default MessageList;
