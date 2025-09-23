import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';

const ChatInput = ({ conversationId, onSend }) => {
  const [message, setMessage] = useState('');
  const { emitTypingStart, emitTypingStop } = useSocket();
  const typingTimeout = useRef(null);
  const isTyping = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTyping.current) {
      emitTypingStop(conversationId);
      isTyping.current = false;
    }
  }, [emitTypingStop, conversationId]);

  const sendMessage = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (onSend) onSend(trimmed);
    setMessage('');
    stopTyping();
  }, [message, onSend, stopTyping]);

  const handleChange = (e) => {
    setMessage(e.target.value);

    if (!isTyping.current) {
      emitTypingStart(conversationId);
      isTyping.current = true;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      stopTyping();
    };
  }, [stopTyping]);

  return (
    <div className="flex items-center p-4 border-t border-gray-300 bg-gray-50 rounded-b-md">
      <textarea
        className="flex-1 p-3 border rounded resize-none focus:outline-blue-600 focus:ring-2 focus:ring-blue-600 transition"
        placeholder="Type a message..."
        rows={1}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Message input"
      />
      <button
        onClick={sendMessage}
        disabled={!message.trim()}
        className="ml-4 px-5 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
