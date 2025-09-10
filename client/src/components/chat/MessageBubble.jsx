import React from 'react'
import { motion } from 'framer-motion'
import { Check, CheckCheck } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { formatMessageTime } from '../../utils/formatters'
import { mockUsers } from '../../data/mockUsers'
import { cn } from '../../utils/cn'

const MessageBubble = ({ message, isOwn, showAvatar }) => {
  const sender = mockUsers.find(u => u.id === message.senderId)
  
  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 400
      }
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />
      case 'delivered':
      case 'read':
        return <CheckCheck className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex items-end space-x-2',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwn && showAvatar && (
        <Avatar
          name={sender?.name || 'Unknown'}
          src={sender?.avatar}
          size="sm"
        />
      )}
      
      {!isOwn && !showAvatar && <div className="w-8" />}
      
      <div className={cn(
        'max-w-xs lg:max-w-md',
        isOwn ? 'order-1' : 'order-2'
      )}>
        <div className={cn(
          'relative px-4 py-2 rounded-2xl shadow-sm',
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        )}>
          <p className="text-sm">{message.content}</p>
          
          <div className={cn(
            'flex items-center justify-between mt-1 space-x-2',
            isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            <span className="text-xs">
              {formatMessageTime(message.timestamp)}
            </span>
            
            {isOwn && (
              <span className={cn(
                'text-xs',
                message.status === 'read' ? 'text-blue-200' : 'text-blue-300'
              )}>
                {getStatusIcon(message.status)}
              </span>
            )}
          </div>
        </div>
        
        {!isOwn && showAvatar && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
            {sender?.name}
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default MessageBubble
