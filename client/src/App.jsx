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

  if (loading)
    return (
      <div className="text-center text-[var(--color-primary)] mt-20 font-semibold text-lg">
        Loading...
      </div>
    )

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
      const saved = localStorage.getItem('darkMode')
      return saved !== null ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
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
