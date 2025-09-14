import { LucideSun, LucideMoon } from 'lucide-react'
import Avatar from '../common/Avatar.jsx'

export default function Header({ participant, darkMode, toggleDarkMode }) {
  if (!participant) return null

  return (
    <header className="flex items-center justify-between border-b border-gray-300 p-4 bg-light dark:bg-dark">
      <div className="flex items-center space-x-4">
        <Avatar src={participant.avatar} alt={participant.name} size={48} status={participant.status} />
        <div className="text-dark dark:text-light">
          <h2 className="text-xl font-semibold">{participant.name}</h2>
          <p className="text-sm text-muted dark:text-gray-400">
            Last seen: {participant.lastSeen ? new Date(participant.lastSeen).toLocaleString() : 'Unknown'}
          </p>
        </div>
      </div>
      <button
        onClick={toggleDarkMode}
        aria-label="Toggle dark mode"
        className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        {darkMode ? <LucideSun size={20} /> : <LucideMoon size={20} />}
      </button>
    </header>
  )
}
