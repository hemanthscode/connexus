import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import './index.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
