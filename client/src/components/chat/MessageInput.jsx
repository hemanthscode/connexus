/**
 * Message Input - ULTRA OPTIMIZED & SMOOTH
 * Fixed emoji modal performance + perfect sizing
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useTyping } from '../../hooks/useTyping';
import { EMOJIS } from '../../utils/constants';
import { sanitizers } from '../../utils/validation';
import { userHelpers } from '../../utils/chatHelpers';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const inputRef = useRef(null);
  
  const { user } = useAuth();
  const { sendTextMessage, replyToMessage, clearReplyToMessage } = useChat();
  const { handleInputChange: handleTypingChange, stopTyping } = useTyping(conversationId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitized = sanitizers.message(message);
    if (!sanitized || !conversationId) return;
    
    stopTyping();
    try {
      await sendTextMessage(sanitized, replyToMessage?._id);
      setMessage('');
      if (replyToMessage) clearReplyToMessage();
    } catch (error) {
      console.error('Send failed:', error);
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
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiModal(false);
    inputRef.current?.focus();
  };

  if (!conversationId) return null;

  const isValid = sanitizers.message(message);

  return (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 border-b border-white/10 bg-blue-500/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-1 h-8 bg-blue-500 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-300 font-medium">
                    Replying to {userHelpers.isSameUser(replyToMessage.sender, user) ? 'You' : replyToMessage.sender?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-300 truncate">{replyToMessage.content}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearReplyToMessage} className="p-1">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center bg-white/10 rounded-2xl border border-white/20 focus-within:border-blue-500/50 transition-colors">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none max-h-32 min-h-[48px]"
              style={{ fieldSizing: 'content' }}
            />

            <div className="flex items-center pr-2 space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiModal(true)}
                className="p-2"
              >
                <Smile className="w-5 h-5" />
              </Button>

              <Button
                type="submit"
                variant={isValid ? "primary" : "ghost"}
                size="sm"
                disabled={!isValid}
                className="p-2"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* OPTIMIZED Emoji Modal - ZERO LAG */}
      <Modal
        isOpen={showEmojiModal}
        onClose={() => setShowEmojiModal(false)}
        title="Choose Emoji"
        size="lg"
        contentClassName="p-0"
      >
        <div className="p-6 max-h-[500px] overflow-hidden">
          <div 
            className="grid grid-cols-6 gap-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 pr-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {EMOJIS.INPUT.map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleEmojiClick(emoji)}
                className="w-14 h-14 text-2xl hover:bg-white/20 hover:scale-105 rounded-xl p-0 transition-all duration-150 flex items-center justify-center"
                style={{ 
                  contain: 'layout style',
                  willChange: 'transform'
                }}
              >
                <span className="select-none pointer-events-none">{emoji}</span>
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessageInput;
