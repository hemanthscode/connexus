import { LucideSun, LucideMoon } from 'lucide-react'
import Avatar from '../common/Avatar.jsx'

export default function Header({ participant, darkMode, toggleDarkMode }) {
  if (!participant) return null

  return (
    <header className="flex items-center justify-between border-b border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <Avatar src={participant.avatar} alt={participant.name} size={48} status={participant.status} />
        <div>
          <h2 className="text-xl font-semibold text-[#39FF14]">{participant.name}</h2>
          <p className="text-gray-400 text-sm">Last seen: {participant.lastSeen ? new Date(participant.lastSeen).toLocaleString() : 'Unknown'}</p>
        </div>
      </div>
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded bg-[#39FF14] text-black hover:bg-[#2AC10B] transition"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <LucideSun size={20} /> : <LucideMoon size={20} />}
      </button>
    </header>
  )
}
