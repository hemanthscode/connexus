import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext.jsx'
import { SocketProvider } from '@/context/SocketContext.jsx'
import { ChatProvider } from '@/context/ChatContext.jsx'
import ErrorBoundary from '@/components/ui/ErrorBoundary.jsx'
import ProtectedRoute from '@/routes/ProtectedRoute.jsx'
import PublicRoute from '@/routes/PublicRoute.jsx'

// Import Pages
import LoginPage from '@/pages/LoginPage.jsx'
import RegisterPage from '@/pages/RegisterPage.jsx'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx'
import WelcomePage from '@/pages/WelcomePage.jsx'
import ChatPage from '@/pages/ChatPage.jsx'
import SettingsPage from '@/pages/SettingsPage.jsx'
import ProfilePage from '@/pages/ProfilePage.jsx'

// Toast configuration
const toastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: 'rgba(17, 24, 39, 0.95)',
    backdropFilter: 'blur(16px)',
    color: '#ffffff',
    border: '1px solid rgba(55, 65, 81, 0.5)',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#ffffff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#ffffff',
    },
  },
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 0,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-dark-bg font-sans antialiased">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <ProtectedRoute requireAuth={false}>
                        <LoginPage />
                      </ProtectedRoute>
                    </PublicRoute>
                  }
                />
                
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <ProtectedRoute requireAuth={false}>
                        <RegisterPage />
                      </ProtectedRoute>
                    </PublicRoute>
                  }
                />
                
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ProtectedRoute requireAuth={false}>
                        <ForgotPasswordPage />
                      </ProtectedRoute>
                    </PublicRoute>
                  }
                />

                {/* Onboarding Route */}
                <Route
                  path="/welcome"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <WelcomePage />
                    </ProtectedRoute>
                  }
                />

                {/* Main App Routes with Socket Context - REMOVED requireOnboarded */}
                <Route
                  path="/chat/*"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <SocketProvider>
                        <ChatProvider>
                          <Routes>
                            <Route path="/" element={<ChatPage />} />
                            <Route path="/:conversationId" element={<ChatPage />} />
                          </Routes>
                        </ChatProvider>
                      </SocketProvider>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile/:userId?"
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/chat" replace />} />
                
                {/* 404 Fallback */}
                <Route 
                  path="*" 
                  element={
                    <div className="h-screen bg-dark-bg flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
                        <p className="text-gray-400 mb-8">Page not found</p>
                        <a 
                          href="/chat" 
                          className="text-cyan-400 hover:text-cyan-300 underline"
                        >
                          Go to Chat
                        </a>
                      </div>
                    </div>
                  } 
                />
              </Routes>

              {/* Global Toast Notifications */}
              <Toaster toastOptions={toastOptions} />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
