/**
 * Typing Indicator Hook
 * Manages typing state and indicators - ENHANCED
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useTyping = (conversationId) => {
  const [isTyping, setIsTyping] = useState(false);
  const { startTyping, stopTyping, getTypingUsers, getTypingIndicatorText, isConnected } = useSocket();
  const { user } = useAuth();
  
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const currentConversationRef = useRef(conversationId);
  
  const TYPING_TIMEOUT = 3000; // Stop typing after 3 seconds of inactivity
  const TYPING_THROTTLE = 1000; // Only send typing events every 1 second

  // Update conversation ref when it changes
  useEffect(() => {
    // Stop typing in previous conversation
    if (currentConversationRef.current && currentConversationRef.current !== conversationId && isTyping) {
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
    
  }, [conversationId, user, isConnected, isTyping, startTyping]);

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

  // Get other users typing
  const othersTyping = getTypingUsers(conversationId)
    .filter(typingUser => typingUser._id !== user?._id);
  
  const typingIndicatorText = getTypingIndicatorText(conversationId, user?._id);

  return {
    // Current user typing state
    isTyping,
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
    
    // Others typing state
    othersTyping,
    isAnyoneElseTyping: othersTyping.length > 0,
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
  };
};

export default useTyping;
