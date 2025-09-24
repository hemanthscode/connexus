import { useAuth } from '@/hooks/useAuth.jsx'
import Loading from '@/components/ui/Loading.jsx'

const PublicRoute = ({ children }) => {
  const { isLoading } = useAuth()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  return children
}

export default PublicRoute
