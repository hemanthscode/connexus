import React from 'react'
import { motion } from 'framer-motion'

const MessageBubble = ({ message, isOwn }) => {
  const baseClasses = "max-w-md break-words px-4 py-3 relative"
  const ownClipPath = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
  const otherClipPath = "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)"
  
  return (
    <motion.div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`${baseClasses} ${isOwn ? 'bg-cyan-700 text-white border border-cyan-400' : 'bg-gray-900 text-gray-300 border border-gray-700'}`}
        style={{
          clipPath: isOwn ? ownClipPath : otherClipPath,
          boxShadow: isOwn ? '0 0 15px #22d3ee' : '0 0 5px rgba(100,100,100,0.3)',
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="block text-xs opacity-60 mt-1 text-right font-mono">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

export default MessageBubble
