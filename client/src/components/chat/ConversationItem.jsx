import React from 'react'
import { motion } from 'framer-motion'
import Avatar from '../ui/Avatar'

const ConversationItem = ({ convo, selected, onSelect }) => {
  return (
    <motion.div
      onClick={() => onSelect(convo)}
      layoutId={selected ? "selectedConvo" : undefined}
      className={`cursor-pointer p-4 border-b border-gray-800 flex items-center space-x-3 relative ${
        selected ? 'bg-cyan-900 bg-opacity-50' : 'hover:bg-cyan-900 hover:bg-opacity-20'
      }`}
      whileHover={{ x: 6 }}
    >
      {selected && (
        <motion.div
          layoutId="selectedConvo"
          className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-tr rounded-br"
          style={{ boxShadow: '0 0 10px #22d3ee' }}
        />
      )}
      <Avatar src={convo.avatar} name={convo.name} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h4 className="text-white truncate font-semibold">{convo.name}</h4>
          <span className="text-xs text-gray-400">
            {new Date(convo.lastMessage?.timestamp || convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-gray-400 text-sm truncate">{convo.lastMessage?.content || 'No messages yet'}</p>
      </div>
      {convo.unreadCount > 0 && (
        <span className="inline-flex items-center justify-center bg-cyan-400 text-black text-xs rounded-full px-2 py-0.5 ml-2">
          {convo.unreadCount}
        </span>
      )}
    </motion.div>
  )
}

export default ConversationItem
