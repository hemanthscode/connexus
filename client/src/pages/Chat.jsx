import React from 'react'
import ChatWindow from '../components/chat/ChatWindow'

const Chat = ({ onToggleSidebar }) => {
  return (
    <ChatWindow onToggleSidebar={onToggleSidebar} />
  )
}

export default Chat
