/**
 * Typing Indicator Hook - OPTIMIZED WITH UTILITIES
 * Enhanced typing management using constants and typingHelpers
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { TIME } from '../utils/constants';
import { typingHelpers } from '../utils/chatHelpers';

export const useTyping = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const { 
    startTyping, 
    stopTyping, 
    getTypingUsers, 
    getTypingIndicatorText, 
    isConnected 
  } = useSocket();
  const { user } = useAuth();
  
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const currentConversationRef = useRef(conversationId);
  
  // Use constants from utilities instead of hardcoded values
  const TYPING_TIMEOUT = TIME.TYPING_TIMEOUT; // 3000ms
  const TYPING_THROTTLE = TIME.TYPING_THROTTLE; // 1000ms

  // Update conversation ref when it changes
  useEffect(() => {
    if (currentConversationRef.current && 
        currentConversationRef.current !== conversationId && 
        isTyping) {
      console.log('🔤 Conversation changed, stopping typing in previous:', currentConversationRef.current);
      stopTyping(currentConversationRef.current);
      setIsTyping(false);
    }
    
    currentConversationRef.current = conversationId;
  }, [conversationId, isTyping, stopTyping]);

  const handleStartTyping = useCallback(() => {
    if (!conversationId || !user || !isConnected || conversationId.startsWith('temp_')) {
      return;
    }
    
    const now = Date.now();
    
    // Throttle typing events
    if (now - lastTypingTimeRef.current < TYPING_THROTTLE) {
      // Still extend the timeout even if we don't send the event
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, TYPING_TIMEOUT);
      
      return;
    }
    
    if (!isTyping) {
      console.log('🔤 Starting to type in conversation:', conversationId);
      setIsTyping(true);
      startTyping(conversationId);
      lastTypingTimeRef.current = now;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, TYPING_TIMEOUT);
    
  }, [conversationId, user, isConnected, isTyping, startTyping, TYPING_TIMEOUT, TYPING_THROTTLE]);

  const handleStopTyping = useCallback(() => {
    if (isTyping && conversationId) {
      console.log('🔤 Stopping typing in conversation:', conversationId);
      setIsTyping(false);
      stopTyping(conversationId);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isTyping, stopTyping, conversationId]);

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && currentConversationRef.current) {
        console.log('🔤 Cleanup: stopping typing in conversation:', currentConversationRef.current);
        stopTyping(currentConversationRef.current);
      }
    };
  }, []); // Only run on unmount

  // ENHANCED: Use typingHelpers for typing user operations
  const typingUsers = getTypingUsers(conversationId);
  const othersTyping = typingHelpers.getTypingUserNames(typingUsers, user?._id);
  const typingIndicatorText = getTypingIndicatorText(conversationId, user?._id);

  return {
    // Current user typing state
    isTyping,
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
    
    // Others typing state - ENHANCED WITH UTILITIES
    othersTyping,
    isAnyoneElseTyping: typingHelpers.hasTypingUsers(typingUsers, user?._id),
    typingIndicatorText,
    
    // Utility methods with better logic
    handleInputChange: (e) => {
      if (e.target.value.trim()) {
        handleStartTyping();
      } else {
        handleStopTyping();
      }
    },
    
    handleKeyPress: (e) => {
      if (e.key === 'Enter') {
        handleStopTyping();
      } else if (e.key.length === 1) { // Only for printable characters
        handleStartTyping();
      }
    },

    // NEW: Additional utilities using typingHelpers
    getTypingCount: () => {
      return typingHelpers.getTypingUserNames(typingUsers, user?._id).length;
    },
    
    getTypingNames: (maxNames = 2) => {
      return typingHelpers.getTypingUserNames(typingUsers, user?._id, maxNames);
    },
  };
};

export default useTyping;
