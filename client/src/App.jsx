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

// Configuration constants
const APP_CONFIG = {
  TOAST_OPTIONS: {
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
      iconTheme: { primary: '#10b981', secondary: '#ffffff' }
    },
    error: {
      iconTheme: { primary: '#ef4444', secondary: '#ffffff' }
    }
  },
  
  QUERY_CLIENT: {
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
  }
}

// Route configurations
const ROUTES = {
  PUBLIC: [
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/forgot-password', component: ForgotPasswordPage }
  ],
  
  PROTECTED: [
    { path: '/welcome', component: WelcomePage },
    { path: '/settings', component: SettingsPage },
    { path: '/profile/:userId?', component: ProfilePage }
  ]
}

// Create React Query client
const queryClient = new QueryClient(APP_CONFIG.QUERY_CLIENT)

// 404 Component
const NotFoundPage = () => (
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
)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <div className="min-h-screen bg-dark-bg font-sans antialiased">
                <Routes>
                  {/* Public Routes */}
                  {ROUTES.PUBLIC.map(({ path, component: Component }) => (
                    <Route
                      key={path}
                      path={path}
                      element={
                        <PublicRoute>
                          <ProtectedRoute requireAuth={false}>
                            <Component />
                          </ProtectedRoute>
                        </PublicRoute>
                      }
                    />
                  ))}

                  {/* Protected Routes */}
                  {ROUTES.PROTECTED.map(({ path, component: Component }) => (
                    <Route
                      key={path}
                      path={path}
                      element={
                        <ProtectedRoute requireAuth={true}>
                          <Component />
                        </ProtectedRoute>
                      }
                    />
                  ))}

                  {/* Chat Routes with ChatProvider */}
                  <Route
                    path="/chat/*"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <ChatProvider>
                          <Routes>
                            <Route path="/" element={<ChatPage />} />
                            <Route path="/:conversationId" element={<ChatPage />} />
                          </Routes>
                        </ChatProvider>
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirects and 404 */}
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>

                {/* Global Toast Notifications */}
                <Toaster toastOptions={APP_CONFIG.TOAST_OPTIONS} />
              </div>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
