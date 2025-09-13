import Avatar from '../common/Avatar.jsx'
import { Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, isMe, recipient }) {
  // Defensive checks
  const readBy = message?.readBy || []
  const sender = message?.sender || { _id: '', name: '', avatar: '', status: 'offline' }
  const messageStatus = message?.status || 'sent'

  const hasRead = readBy.some(r => r.user === recipient?._id)
  const hasDelivered = messageStatus === 'delivered' || messageStatus === 'read'

  // Tick rendering logic
  const renderTick = () => {
    if (!isMe) return null
    if (!hasDelivered) {
      return <Check size={14} className="text-gray-400" />
    }
    if (hasRead) {
      return <CheckCheck size={14} className="text-blue-500" />
    }
    return <CheckCheck size={14} className="text-gray-400" />
  }

  return (
   <div
  className={`max-w-xs md:max-w-md rounded-lg p-3 shadow backdrop-blur-sm text-sm flex ${
    isMe
      ? 'bg-teal-500 text-white self-end flex-row-reverse'
      : 'bg-slate-100 text-slate-900 self-start'
  } relative`}
  role="article"
  aria-label={`Message from ${isMe ? 'You' : sender.name}`}
>
  {!isMe && (
    <Avatar src={sender.avatar} alt={sender.name || 'User'} size={32} status={sender.status || 'offline'} />
  )}

  <div className={`mx-2 break-words ${isMe ? 'pr-8' : ''}`}>
    {!isMe && <div className="font-semibold">{sender.name || 'Unknown'}</div>}
    <div>{message?.content || ''}</div>
    {message.editedAt && <small className="text-xs italic text-muted">edited</small>}
    <div className="text-xs text-gray-400 mt-1 text-right">
      {message?.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : ''}
    </div>
  </div>

  {isMe && (
    <span
      className="absolute bottom-1 right-2 flex items-center space-x-0.5"
      title="Message status"
      aria-live="polite"
    >
      {renderTick()}
    </span>
  )}
</div>
  )
}
