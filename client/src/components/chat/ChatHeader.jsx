import React, { useState } from 'react'
import { Info } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { formatLastSeen } from '../../utils/formatters'

/**
 * Chat Header Component - Removed hamburger menu completely
 */
const ChatHeader = ({ conversation }) => {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar
              name={conversation.name}
              src={conversation.avatar}
              status={conversation.isOnline ? 'online' : 'offline'}
              size="md"
              className="flex-shrink-0"
            />
            
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-gray-900 dark:text-white truncate">
                {conversation.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conversation.isOnline ? 'Active now' : formatLastSeen(conversation.lastActivity)}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(true)}
              aria-label="Conversation info"
              className="p-2"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <Modal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        title="Conversation Info"
      >
        <div className="space-y-4">
          <div className="text-center">
            <Avatar
              name={conversation.name}
              src={conversation.avatar}
              size="xl"
              className="mx-auto mb-2"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {conversation.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Last active: {formatLastSeen(conversation.lastActivity)}
            </p>
            {conversation.type === 'group' && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {conversation.participants?.length || 0} participants
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ChatHeader
