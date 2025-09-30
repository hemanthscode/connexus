import { useState, useEffect, useCallback } from 'react';
import { useChat } from './useChat';

export const useInfiniteMessages = (conversationId) => {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { messages, loadMessages } = useChat();
  const conversationMessages = messages.get(conversationId) || [];

  const loadMore = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const previousLength = conversationMessages.length;
      
      await loadMessages(conversationId, nextPage);
      
      // Check if we got new messages
      const newLength = messages.get(conversationId)?.length || 0;
      const loadedNew = newLength > previousLength;
      
      if (loadedNew) {
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, page, isLoadingMore, hasMore, loadMessages, conversationMessages.length, messages]);

  // Reset when conversation changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [conversationId]);

  return {
    messages: conversationMessages,
    hasMore,
    isLoadingMore,
    loadMore,
  };
};
