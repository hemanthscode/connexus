import Avatar from '../common/Avatar.jsx'
import { Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, isMe, recipient, isGroup }) {
  const readBy = message?.readBy || []
  const sender = message?.sender || { _id: '', name: '', avatar: '', status: 'offline' }
  const messageStatus = message?.status || 'sent'
  const hasRead = readBy.some(r => r.user === recipient?._id)
  const hasDelivered = ['delivered', 'read'].includes(messageStatus)
  const userStatus = recipient?.status || 'offline'

  const renderTick = () => {
    if (!isMe) return null
    if (userStatus === 'offline') {
      return <Check size={14} className="text-gray-400" aria-label="Sent" />
    }
    if (hasRead) {
      return <CheckCheck size={14} className="text-green-400" aria-label="Read" />
    }
    if (hasDelivered) {
      return <CheckCheck size={14} className="text-gray-400" aria-label="Delivered" />
    }
    return <Check size={14} className="text-gray-400" aria-label="Sent" />
  }

  return (
    <div
      className={`relative flex max-w-xs md:max-w-md mb-2 p-3 rounded-lg shadow text-sm gap-2 ${
        isMe
          ? 'self-end bg-blue-600 text-white flex-row-reverse'
          : 'self-start bg-white text-gray-900 border border-gray-300'
      }`}
      aria-label={`Message from ${isMe ? 'you' : sender.name}`}
      style={{ wordBreak: 'break-word' }}
    >
      {!isMe && isGroup && <Avatar src={sender.avatar} alt={sender.name} status={sender.status} size={32} />}
      <div className={`flex-1 ${isMe ? 'pr-6' : ''}`}>
        {!isMe && isGroup && <div className="text-blue-600 font-semibold">{sender.name || 'Unknown'}</div>}
        <div>{message.content}</div>
        <div className="text-xs mt-1 text-gray-400 text-right">
          {message?.createdAt && new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isMe && <span className="absolute bottom-1 right-2 flex items-center space-x-1" aria-label="Message status">{renderTick()}</span>}
    </div>
  )
}
