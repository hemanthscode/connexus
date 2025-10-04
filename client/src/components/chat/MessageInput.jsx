/**
 * Message Input Component
 * Streamlined message composition with enhanced Input and useTyping hook
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useTyping } from '../../hooks/useTyping';
import Button from '../ui/Button';
import Input from '../ui/Input';

const EMOJI_OPTIONS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '🔥', '💯', '🎉', '👀', '🤔', '💪', '🙌', '👏'
];

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const inputRef = useRef(null);
  
  const { 
    sendTextMessage, 
    replyToMessage, 
    clearReplyToMessage 
  } = useChat();
  
  const {
    startTyping,
    stopTyping,
    handleInputChange: handleTypingChange,
    handleKeyPress: handleTypingKeyPress
  } = useTyping(conversationId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !conversationId) return;
    
    stopTyping();
    
    try {
      await sendTextMessage(message.trim(), replyToMessage?._id);
      setMessage('');
      
      if (replyToMessage) {
        clearReplyToMessage();
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTypingChange(e);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else {
      handleTypingKeyPress(e);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (!conversationId) return null;

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
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rightIcon={
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
              }
              className="pr-12"
              containerClassName="flex-1"
            />

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 grid grid-cols-8 gap-2 shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
                >
                  {EMOJI_OPTIONS.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!message.trim()}
            className="p-3 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
