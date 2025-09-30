import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic,
  X
} from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import Button from '../ui/Button';

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { 
    sendMessage, 
    replyToMessage, 
    clearReplyToMessage 
  } = useChat();
  
  const { 
    startTyping, 
    stopTyping 
  } = useSocket();

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const maxHeight = 120; // 5 lines max
      inputRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversationId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId);
    }, 3000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isTyping) {
      setIsTyping(false);
      stopTyping(conversationId);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
    
    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !conversationId) return;
    
    handleTypingStop();
    
    try {
      await sendMessage(
        conversationId,
        message.trim(),
        'text',
        replyToMessage?._id
      );
      
      setMessage('');
      adjustTextareaHeight();
      
      if (replyToMessage) {
        clearReplyToMessage();
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        stopTyping(conversationId);
      }
    };
  }, []);

  if (!conversationId) {
    return null;
  }

  return (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-b border-white/10 bg-blue-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-1 h-8 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-300 font-medium">
                    Replying to {replyToMessage.sender?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-300 truncate">
                    {replyToMessage.content}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearReplyToMessage}
                className="p-1 text-gray-400 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 text-gray-400 hover:text-white flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Input container */}
          <div className="flex-1 relative">
            <div className="flex items-end bg-white/10 border border-white/20 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none min-h-[48px] max-h-[120px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
              />

              {/* Emoji picker toggle */}
              <div className="flex-shrink-0 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 grid grid-cols-8 gap-2 shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                >
                  {[
                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                    '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                  ].map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                        inputRef.current?.focus();
                      }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice message button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 text-gray-400 hover:text-white flex-shrink-0"
          >
            <Mic className="w-5 h-5" />
          </Button>

          {/* Send button */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!message.trim()}
            className="p-2 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
