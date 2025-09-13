import Avatar from '../common/Avatar.jsx'
import Badge from '../common/Badge.jsx'

export default function ConversationItem({
  conversation,
  active,
  onClick,
  currentUserId,
  unreadCount
}) {
  const isGroup = conversation.type === 'group'
  const name = isGroup
    ? conversation.name
    : conversation.participants.find(p => p.user._id !== currentUserId)?.user.name || 'Unknown'

  const participant = conversation.participants.find(p => p.user._id === currentUserId)
  const roleBadgeVariant = participant?.role
    ? `role${participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}`
    : 'roleMember'

  return (
    <li
      onClick={onClick}
      className={`p-3 cursor-pointer rounded flex items-center gap-3 transition ${
        active ? 'bg-[#39FF14]/50 text-black' : 'hover:bg-[#39FF14]/30 text-white'
      }`}
    >
      <Avatar
        src={
          isGroup
            ? conversation.avatar || null
            : conversation.participants.find(p => p.user._id !== currentUserId)?.user.avatar
        }
        alt={name}
        size={48}
        status={
          !isGroup &&
          conversation.participants.find(p => p.user._id !== currentUserId)?.user.status
        }
      />
      <div className="flex-1 flex flex-col truncate">
        <div className="flex justify-between items-center">
          <span className="font-semibold truncate">{name}</span>
          <Badge count={unreadCount} variant="unread" />
        </div>
        <small className="text-gray-400 truncate">
          {conversation.lastMessage?.content || 'No messages yet'}
        </small>
      </div>
      {participant && participant.role !== 'member' && (
        <Badge count={1} variant={roleBadgeVariant} />
      )}
    </li>
  )
}
