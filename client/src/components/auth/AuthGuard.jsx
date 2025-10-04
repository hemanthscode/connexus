/**
 * Authentication Guard Component
 * Protects routes and handles auth state
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import Layout from '../ui/Layout';
import Loading from '../ui/Loading';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={ROUTES.LOGIN}
        state={{ from: location }} 
        replace 
      />
    );
  }

  return children;
};

export default AuthGuard;
