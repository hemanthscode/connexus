import Sidebar from '../components/layout/Sidebar.jsx'
import ChatWindow from '../components/layout/ChatWindow.jsx'

export default function ChatDashboard({ darkMode, toggleDarkMode }) {
  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? 'bg-backgroundDark text-textLight' : 'bg-[var(--color-background-light)] text-[var(--color-text-dark)]'
      }`}
      role="application"
    >
      <Sidebar />
      <ChatWindow darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  )
}
