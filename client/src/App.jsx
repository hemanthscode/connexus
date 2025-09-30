import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/ui/Layout'
import AuthGuard from './components/auth/AuthGuard'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/chat" element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          } />
          
          {/* Redirect root to chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          
          {/* Catch all - redirect unknown routes to chat */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
