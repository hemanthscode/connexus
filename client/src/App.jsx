import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { ChatProvider } from './contexts/ChatContext.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ChatDashboard from './pages/ChatDashboard.jsx'
import Profile from './pages/Profile.jsx'

function AppRoutes({ darkMode, toggleDarkMode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="text-center text-teal-600 mt-20">Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
      <Route
        path="/"
        element={user ? <ChatDashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('darkMode')
      return stored !== null ? JSON.parse(stored) : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <AppRoutes darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        </Router>
      </ChatProvider>
    </AuthProvider>
  )
}
