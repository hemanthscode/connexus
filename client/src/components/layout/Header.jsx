import Avatar from '../common/Avatar.jsx'
import { LucideSun, LucideMoon } from 'lucide-react'
import { useChat } from '../../contexts/ChatContext.jsx'

export default function Header({ participant, darkMode, toggleDarkMode }) {
  const { getUserStatus } = useChat()
  if (!participant) return null

  const realStatusObj = getUserStatus(participant._id)
  const isOnline = realStatusObj.status === 'online'
  const lastSeenText = isOnline
    ? 'Online'
    : realStatusObj.lastSeen
    ? `Last seen: ${new Date(realStatusObj.lastSeen).toLocaleString()}`
    : 'Last seen: Unknown'

  return (
    <header
      className="flex items-center justify-between border-b border-gray-300 p-4 dark:bg-gray-900"
      style={{ backgroundColor: 'var(--color-background-light)' }}
    >
      <div className="flex items-center space-x-4">
        <Avatar
          src={participant.avatar}
          alt={participant.name}
          size={56}
          status={isOnline ? 'online' : 'offline'}
        />
        <div className="text-[var(--color-text-dark)] dark:text-[var(--color-text-dark)]">
          <h2 className="text-2xl font-semibold">{participant.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{lastSeenText}</p>
        </div>
      </div>
      <button
        onClick={toggleDarkMode}
        aria-label="Toggle dark mode"
        className="p-2 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition shadow-md"
      >
        {darkMode ? <LucideSun size={24} /> : <LucideMoon size={24} />}
      </button>
    </header>
  )
}
