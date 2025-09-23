import { useState, useCallback } from 'react';

export default function useChat(initialMessages = []) {
  const [messages, setMessages] = useState(initialMessages);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, setMessages, addMessage };
}
