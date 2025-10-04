/**
 * Infinite Messages Hook
 * Handles pagination for message loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useChatStore from '../store/chatStore';

export const useInfiniteMessages = (conversationId) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { messages, loadMessages } = useChatStore();
  const previousConversationId = useRef(conversationId);
  
  // Get messages for this conversation
  const conversationMessages = messages.get(conversationId) || [];
  
  // Reset pagination when conversation changes
  useEffect(() => {
    if (conversationId !== previousConversationId.current) {
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
      previousConversationId.current = conversationId;
    }
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || 
        conversationId.startsWith('temp_') || 
        isLoadingMore || 
        !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    
    try {
      const currentLength = conversationMessages.length;
      const nextPage = page + 1;
      
      await loadMessages(conversationId, nextPage);
      
      // Check if new messages were loaded
      const newMessages = messages.get(conversationId) || [];
      const hasNewMessages = newMessages.length > currentLength;
      
      if (hasNewMessages) {
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Failed to load more messages:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    conversationId, 
    page, 
    isLoadingMore, 
    hasMore, 
    loadMessages, 
    conversationMessages.length,
    messages
  ]);

  // Auto-load initial messages if none exist
  useEffect(() => {
    if (conversationId && 
        !conversationId.startsWith('temp_') && 
        conversationMessages.length === 0 && 
        !isLoadingMore && 
        page === 1) {
      loadMessages(conversationId, 1);
    }
  }, [conversationId, conversationMessages.length, isLoadingMore, page, loadMessages]);

  return {
    messages: conversationMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    currentPage: page,
    messageCount: conversationMessages.length,
    
    // Utility methods
    canLoadMore: hasMore && !isLoadingMore,
    reset: () => {
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    },
  };
};

export default useInfiniteMessages;
