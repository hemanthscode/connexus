import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/ui/Layout';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/ui/Loading';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  const { isInitialized, isLoading, isAuthenticated } = useAuth();

  // Show loading screen while initializing auth
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 mx-auto">
            <Loading size="xl" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Connexus</h2>
          <p className="text-gray-300">Initializing your chat experience...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Public Routes - Redirect to chat if already authenticated */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Login />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Register />
            )
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/chat" 
          element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/chat/:conversationId" 
          element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/profile/:userId" 
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          } 
        />
        
        {/* Root redirect */}
        <Route 
          path="/" 
          element={<Navigate to="/chat" replace />} 
        />
        
        {/* 404 - Not Found */}
        <Route path="/404" element={<NotFound />} />
        
        {/* Catch all - redirect to 404 */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
