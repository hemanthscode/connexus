import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './contexts/ThemeContext'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import { Loader2 } from 'lucide-react'

/**
 * Main Application Component
 */
function App() {
  const { user, loading } = useAuth()
  const { theme } = useTheme()

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" replace /> : <Login />} 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Chat />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
