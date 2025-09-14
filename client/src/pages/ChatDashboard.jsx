import Sidebar from '../components/layout/Sidebar.jsx'
import ChatWindow from '../components/layout/ChatWindow.jsx'

export default function ChatDashboard({ darkMode, toggleDarkMode }) {
  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />
      <ChatWindow darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  )
}
