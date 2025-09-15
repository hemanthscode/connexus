import Avatar from '../common/Avatar.jsx'
import { Check, CheckCheck } from 'lucide-react'
import clsx from 'clsx'

export default function MessageBubble({
  message,
  isMe,
  recipient,
  activeConversationId,
}) {
  const readBy = message?.readBy || []
  const sender = message?.sender || { _id: '', name: '', avatar: '', status: 'offline' }
  const messageStatus = message?.status || 'sent'
  const userStatus = recipient?.status || 'offline'
  const hasRead = readBy.some((r) => r.user === recipient?._id)
  const hasDelivered = ['delivered', 'read'].includes(messageStatus)
  const isRecipientActiveInChat =
    activeConversationId === message.conversation && userStatus === 'online'

  const renderTick = () => {
    if (!isMe) return null
    if (userStatus === 'offline') {
      return <Check size={16} className="text-gray-400" aria-label="Sent" />
    }
    if (hasRead || isRecipientActiveInChat) {
      return (
        <CheckCheck
          size={16}
          className="text-green-400 transition-colors duration-300"
          aria-label="Read"
        />
      )
    }
    if (hasDelivered) {
      return (
        <CheckCheck
          size={16}
          className="text-gray-400 transition-colors duration-300"
          aria-label="Delivered"
        />
      )
    }
    return <Check size={16} className="text-gray-400" aria-label="Sent" />
  }

  return (
    <div
      className={clsx(
        'relative flex max-w-xs md:max-w-lg mb-3 p-4 rounded-xl shadow text-base gap-3 select-text',
        isMe
          ? 'self-end bg-[var(--color-primary)] text-white flex-row-reverse'
          : 'self-start bg-gray-100 dark:bg-gray-800 text-[var(--color-text-dark)] dark:text-gray-200 border border-gray-300 dark:border-gray-700'
      )}
      aria-label={`Message from ${isMe ? 'you' : sender.name}`}
      style={{ wordBreak: 'break-word' }}
    >
      {!isMe && (
        <Avatar src={sender.avatar} alt={sender.name} status={sender.status} size={36} />
      )}
      <div className={clsx('flex-1', isMe && 'pr-10')}>
        {!isMe && (
          <div className="text-[var(--color-primary)] font-semibold mb-1 text-lg">{sender.name || 'Unknown'}</div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        <div className="text-xs mt-1 text-gray-500 dark:text-gray-400 text-right font-mono select-none">
          {message?.createdAt &&
            new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
        </div>
      </div>
      {isMe && (
        <span className="absolute bottom-2 right-3 flex items-center">{renderTick()}</span>
      )}
    </div>
  )
}
