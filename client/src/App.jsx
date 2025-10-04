/**
 * Main App Component
 * Root application with routing and auth protection
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './utils/constants';
import AuthGuard from './components/auth/AuthGuard';
import Loading from './components/ui/Loading';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Inner component that uses auth hooks (must be inside Router context)
function AppContent() {
  const { isInitialized } = useAuth();

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Loading size="xl" text="Initializing Connexus..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />

      {/* Protected Routes */}
      <Route path={ROUTES.CHAT} element={
        <AuthGuard>
          <Chat />
        </AuthGuard>
      } />
      
      <Route path={`${ROUTES.PROFILE}/:userId?`} element={
        <AuthGuard>
          <Profile />
        </AuthGuard>
      } />
      
      <Route path={ROUTES.SETTINGS} element={
        <AuthGuard>
          <Settings />
        </AuthGuard>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to={ROUTES.CHAT} replace />} />
      <Route path="/404" element={<NotFound />} />
      
      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main App component (provides Router context)
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
