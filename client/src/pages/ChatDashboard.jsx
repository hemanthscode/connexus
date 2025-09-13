import Sidebar from '../components/layout/Sidebar.jsx'
import ChatWindow from '../components/layout/ChatWindow.jsx'

export default function ChatDashboard({ darkMode, toggleDarkMode }) {
  return (
    <div className={`flex min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-gray-100`}>
      <Sidebar />
      <ChatWindow darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  )
}
