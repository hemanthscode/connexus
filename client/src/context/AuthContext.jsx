import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuthStore, useAuthActions, useAuthComputed } from '@/store/authSlice.js'
import socketService from '@/services/socketService.js'
import { DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Create context
const AuthContext = createContext(null)

// Custom hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Auth provider component
export const AuthProvider = ({ children }) => {
  const authStore = useAuthStore()
  const authActions = useAuthActions()
  const authComputed = useAuthComputed()
  
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  
  const toast = useToast()

  // Initialize auth on app start
  useEffect(() => {
    authActions.initialize()
  }, [authActions])

  // Handle socket connection when user is authenticated
  useEffect(() => {
    const connectSocket = async () => {
      if (authStore.isAuthenticated && !isSocketConnected && connectionAttempts < 3) {
        try {
          if (DEBUG.ENABLED) {
            console.log('Attempting to connect socket...')
          }

          await socketService.initializeSocket()
          setIsSocketConnected(true)
          setConnectionAttempts(0)
          
          if (DEBUG.ENABLED) {
            console.log('Socket connected successfully')
          }

          toast.success('Connected to chat server')
        } catch (error) {
          console.error('Failed to connect socket:', error)
          setConnectionAttempts(prev => prev + 1)
          
          // Retry after delay
          setTimeout(() => {
            if (connectionAttempts < 2) {
              connectSocket()
            } else {
              toast.error('Failed to connect to chat server')
            }
          }, 2000)
        }
      }
    }

    const disconnectSocket = () => {
      if (isSocketConnected) {
        socketService.disconnect()
        setIsSocketConnected(false)
        setConnectionAttempts(0)
        
        if (DEBUG.ENABLED) {
          console.log('Socket disconnected')
        }
      }
    }

    if (authStore.isAuthenticated) {
      connectSocket()
    } else {
      disconnectSocket()
    }

    return () => {
      disconnectSocket()
    }
  }, [authStore.isAuthenticated, isSocketConnected, connectionAttempts, toast])

  // Auto-logout on session expiry
  useEffect(() => {
    if (!authStore.isAuthenticated) return

    const checkSessionExpiry = () => {
      if (authActions.isSessionExpired()) {
        if (DEBUG.ENABLED) {
          console.log('Session expired, logging out...')
        }
        
        toast.warning('Session expired. Please login again.')
        authActions.logout()
      }
    }

    // Check immediately
    checkSessionExpiry()

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000)
    
    return () => clearInterval(interval)
  }, [authStore.isAuthenticated, authStore.sessionExpiry, authActions, toast])

  // Update user status on visibility change
  useEffect(() => {
    if (!authStore.isAuthenticated) return

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online'
      authActions.setUserStatus(status)
      
      if (isSocketConnected) {
        socketService.updateUserStatus(status)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authStore.isAuthenticated, isSocketConnected, authActions])

  // Handle page unload - set offline status
  useEffect(() => {
    if (!authStore.isAuthenticated || !isSocketConnected) return

    const handleBeforeUnload = () => {
      authActions.setUserStatus('offline')
      socketService.updateUserStatus('offline')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [authStore.isAuthenticated, isSocketConnected, authActions])

  // Memoized auth functions
  const login = useCallback(async (credentials) => {
    const result = await authActions.login(credentials)
    
    if (result.success) {
      toast.success('Welcome back!')
    } else {
      toast.error(result.error || 'Login failed')
    }
    
    return result
  }, [authActions, toast])

  const register = useCallback(async (userData) => {
    const result = await authActions.register(userData)
    
    if (result.success) {
      toast.success('Account created successfully!')
    } else {
      toast.error(result.error || 'Registration failed')
    }
    
    return result
  }, [authActions, toast])

  const logout = useCallback(async () => {
    await authActions.logout()
    toast.info('You have been logged out')
  }, [authActions, toast])

  const changePassword = useCallback(async (passwordData) => {
    const result = await authActions.changePassword(passwordData)
    
    if (result.success) {
      toast.success('Password changed successfully')
    } else {
      toast.error(result.error || 'Password change failed')
    }
    
    return result
  }, [authActions, toast])

  const updateProfile = useCallback(async (profileData) => {
    const result = await authActions.updateProfile(profileData)
    
    if (result.success) {
      toast.success('Profile updated successfully')
    } else {
      toast.error(result.error || 'Profile update failed')
    }
    
    return result
  }, [authActions, toast])

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    if (!authStore.isAuthenticated) return 'disconnected'
    if (isSocketConnected) return 'connected'
    return 'connecting'
  }, [authStore.isAuthenticated, isSocketConnected])

  // Context value
  const contextValue = {
    // Auth state
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    isInitializing: authStore.isInitializing,
    
    // Loading states
    isLoggingIn: authStore.isLoggingIn,
    isRegistering: authStore.isRegistering,
    isChangingPassword: authStore.isChangingPassword,
    
    // Errors
    error: authStore.error,
    loginError: authStore.loginError,
    registerError: authStore.registerError,
    
    // Session info
    lastLoginAt: authStore.lastLoginAt,
    sessionExpiry: authStore.sessionExpiry,
    
    // Settings
    rememberMe: authStore.rememberMe,
    autoLogin: authStore.autoLogin,
    
    // Connection status
    isSocketConnected,
    connectionStatus: getConnectionStatus(),
    
    // Auth actions
    login,
    register,
    logout,
    changePassword,
    updateProfile,
    
    // Utility actions
    clearError: authActions.clearError,
    setUserStatus: authActions.setUserStatus,
    updateAvatar: authActions.updateAvatar,
    refreshUser: authActions.refreshUser,
    toggleRememberMe: authActions.toggleRememberMe,
    setAutoLogin: authActions.setAutoLogin,
    
    // Computed values
    getUserDisplayName: authComputed.getUserDisplayName,
    getUserInitials: authComputed.getUserInitials,
    hasRole: authComputed.hasRole,
    getSessionTimeRemaining: authComputed.getSessionTimeRemaining,
    isUserOnline: authComputed.isUserOnline,
    isSessionExpired: authActions.isSessionExpired,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Export context for direct access if needed
export { AuthContext }

// Default export
export default AuthProvider
