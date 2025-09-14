import Avatar from '../common/Avatar.jsx'
import Badge from '../common/Badge.jsx'

export default function ConversationItem({ conversation, active, onClick, currentUserId, unreadCount = 0 }) {
  const isGroup = conversation.type === 'group'
  const other = conversation.participants.find(p => p.user._id !== currentUserId)?.user
  const name = isGroup ? conversation.name : other?.name ?? 'Unknown'
  const avatarSrc = isGroup ? conversation.avatar : other?.avatar
  const status = !isGroup ? other?.status : null
  const participant = conversation.participants.find(p => p.user._id === currentUserId)
  const role = participant?.role || 'member'
  const roleBadgeVariant = { admin: 'roleAdmin', moderator: 'roleMod', member: 'roleMember' }[role] || 'roleMember'

  return (
    <li
      onClick={onClick}
      tabIndex={0}
      aria-pressed={active}
      aria-label={`Conversation with ${name} with ${unreadCount} unread messages`}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`group cursor-pointer rounded-md p-3 flex items-center gap-3 truncate transition ${
        active ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-900'
      }`}
    >
      <div className="relative">
        <Avatar src={avatarSrc} alt={name} size={48} status={status} />
        {!isGroup && status && (
          <span title={status} className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        )}
      </div>
      <div className="flex-1 flex flex-col truncate">
        <div className="flex justify-between items-center">
          <span className={`font-semibold truncate ${active ? 'text-white' : 'text-gray-900'}`}>{name}</span>
          <Badge count={unreadCount} variant="unread" />
        </div>
        <span className={`truncate text-sm ${active ? 'text-blue-200' : 'text-gray-600'}`}>
          {conversation.lastMessage?.content || 'No messages yet'}
        </span>
      </div>
      {role !== 'member' && <Badge count={1} variant={roleBadgeVariant} />}
    </li>
  )
}
