import Avatar from '../common/Avatar.jsx'
import Badge from '../common/Badge.jsx'
import clsx from 'clsx'
import { useChat } from '../../contexts/ChatContext.jsx'

export default function ConversationItem({
  conversation,
  active,
  onClick,
  currentUserId,
  unreadCount = 0,
}) {
  const { getUserStatus } = useChat()
  const isGroup = conversation.type === 'group'
  const other = conversation.participants.find((p) => p.user?._id !== currentUserId)?.user
  const name = isGroup ? conversation.name : other?.name ?? 'Unknown'
  const avatarSrc = isGroup ? conversation.avatar : other?.avatar
  const statusUserId = isGroup ? null : other?._id
  const realStatusObj = getUserStatus(statusUserId)
  const status = !isGroup && realStatusObj?.status === 'online' ? 'online' : null
  const participant = conversation.participants.find((p) => p.user?._id === currentUserId)
  const role = participant?.role || 'member'
  const roleBadgeVariant = {
    admin: 'roleAdmin',
    moderator: 'roleMod',
    member: 'roleMember',
  }[role] || 'roleMember'

  const count = conversation.unreadCount ?? unreadCount ?? 0

  return (
    <li
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Conversation with ${name} with ${count} unread messages`}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={clsx(
        'group cursor-pointer rounded-md p-3 flex items-center gap-3 truncate transition',
        active ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-gray-100 text-[var(--color-text-dark)]'
      )}
    >
      <div className="relative">
        <Avatar src={avatarSrc} alt={name} size={48} status={status} />
        {!isGroup && status && (
          <span
            title={status}
            className={clsx(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
              status === 'online' ? 'bg-[var(--color-status-online)]' : 'bg-[var(--color-status-offline)]'
            )}
          />
        )}
      </div>
      <div className="flex-1 flex flex-col truncate">
        <div className="flex justify-between items-center">
          <span
            className={clsx(
              'font-semibold truncate',
              active ? 'text-white' : 'text-[var(--color-text-dark)]'
            )}
          >
            {name}
          </span>
          {count > 0 && <Badge count={count} variant="unread" />}
        </div>
        <span
          className={clsx(
            'truncate text-sm',
            active ? 'text-blue-200' : 'text-gray-600'
          )}
        >
          {conversation.lastMessage?.content || 'No messages yet'}
        </span>
      </div>
      {role !== 'member' && <Badge count={1} variant={roleBadgeVariant} />}
    </li>
  )
}
