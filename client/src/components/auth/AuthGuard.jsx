/**
 * Authentication Guard Component - OPTIMIZED
 * Enhanced route protection with better error handling
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import { formatError } from '../../utils/formatters';
import Layout from '../ui/Layout';
import Loading from '../ui/Loading';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized, error, hasValidSession } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (!isInitialized || isLoading) {
    return (
      <Layout showConnectionStatus={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loading size="lg" text="Checking authentication..." />
        </div>
      </Layout>
    );
  }

  // ENHANCED: Better error handling for auth failures
  if (error) {
    return (
      <Layout showConnectionStatus={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{formatError(error)}</p>
            <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
          </div>
        </div>
      </Layout>
    );
  }

  // ENHANCED: Use hasValidSession for better token validation
  if (!isAuthenticated || !hasValidSession) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return children;
};

export default AuthGuard;
