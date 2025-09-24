import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.jsx'
import Loading from '@/components/ui/Loading.jsx'

const ProtectedRoute = ({ children, requireAuth = true, requireOnboarded = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Redirect to onboarding if user hasn't completed setup
  if (requireAuth && isAuthenticated && requireOnboarded && !user?.isOnboarded) {
    return <Navigate to="/welcome" replace />
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from || '/chat'
    return <Navigate to={from} replace />
  }

  return children
}

export default ProtectedRoute
