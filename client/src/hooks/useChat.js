// src/hooks/useChat.js
import { useContext } from 'react'
import { ChatContext } from '../contexts/ChatContext.jsx'

export default function useChat() {
  return useContext(ChatContext)
}
