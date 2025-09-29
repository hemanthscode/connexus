import { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react'
import useAuthStore from '@/store/authSlice.js'
import socketService from '@/services/socketService.js'
import { DEBUG } from '@/utils/constants.js'
import { useToast } from '@/components/ui/Toast.jsx'

const AuthContext = createContext(null)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const authStore = useAuthStore()
  const toast = useToast()
  
  // FIXED: Add initialization tracking to prevent premature session checks
  const [isInitialized, setIsInitialized] = useState(false)

  // FIXED: Initialize auth on mount with proper tracking
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (DEBUG.ENABLED) console.log('🔐 Initializing auth...')
        
        await authStore.initialize()
        setIsInitialized(true)
        
        if (DEBUG.ENABLED) {
          console.log('🔐 Auth initialized:', {
            isAuthenticated: authStore.isAuthenticated,
            hasUser: !!authStore.user,
            hasToken: !!localStorage.getItem('authToken'), // Debug token presence
            sessionExpiry: authStore.sessionExpiry
          })
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setIsInitialized(true) // Still mark as initialized to prevent hanging
      }
    }

    initializeAuth()
  }, [])

  // Handle socket connection lifecycle
  useEffect(() => {
    if (!isInitialized) return // FIXED: Wait for initialization

    const handleSocketConnection = async () => {
      if (authStore.isAuthenticated && authStore.user) {
        try {
          // FIXED: Pass token to socket service
          const token = localStorage.getItem('authToken')
          if (token) {
            await socketService.initializeSocket(token)
            authStore.setUserStatus('online')
            socketService.updateUserStatus('online')
            if (DEBUG.ENABLED) console.log('🔌 Socket connected with auth')
          }
        } catch (error) {
          console.error('Socket connection failed:', error)
        }
      } else {
        if (DEBUG.ENABLED) console.log('🔌 Disconnecting socket (not authenticated)')
        socketService.disconnect()
      }
    }

    handleSocketConnection()
  }, [authStore.isAuthenticated, authStore.user, isInitialized])

  // FIXED: Enhanced session expiry check with debugging and safeguards
  useEffect(() => {
    if (!isInitialized || !authStore.isAuthenticated) return

    const checkSession = () => {
      try {
        // FIXED: Add comprehensive session validation
        const token = localStorage.getItem('authToken')
        const tokenExpiry = localStorage.getItem('tokenExpiry')
        const currentTime = Date.now()
        
        if (DEBUG.ENABLED) {
          console.log('🕒 Session check:', {
            hasToken: !!token,
            hasUser: !!authStore.user,
            tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : 'none',
            currentTime: new Date(currentTime).toISOString(),
            storeSessionExpiry: authStore.sessionExpiry ? new Date(authStore.sessionExpiry).toISOString() : 'none',
            isStoreSessionExpired: authStore.isSessionExpired?.()
          })
        }

        // FIXED: Multiple validation layers
        let shouldLogout = false
        let logoutReason = ''

        // Check 1: No token
        if (!token) {
          shouldLogout = true
          logoutReason = 'No auth token found'
        }
        // Check 2: Token expiry from localStorage
        else if (tokenExpiry && currentTime > parseInt(tokenExpiry)) {
          shouldLogout = true
          logoutReason = 'Token expired (localStorage)'
        }
        // Check 3: Store session expiry (with safeguard)
        else if (authStore.isSessionExpired && typeof authStore.isSessionExpired === 'function') {
          try {
            if (authStore.isSessionExpired()) {
              shouldLogout = true
              logoutReason = 'Session expired (store)'
            }
          } catch (error) {
            console.error('Error checking session expiry:', error)
            // Don't logout on error - could be a temporary issue
          }
        }

        if (shouldLogout) {
          console.warn(`🚪 Auto-logout triggered: ${logoutReason}`)
          toast.warning(`Session expired: ${logoutReason}. Please login again.`)
          authStore.logout()
        } else if (DEBUG.ENABLED) {
          console.log('✅ Session valid')
        }

      } catch (error) {
        console.error('Session check error:', error)
        // FIXED: Don't logout on session check errors - could be temporary
      }
    }

    // FIXED: Initial check with delay to ensure everything is loaded
    const initialTimeout = setTimeout(checkSession, 5000)
    
    // FIXED: Less frequent checks to prevent issues
    const interval = setInterval(checkSession, 5 * 60 * 1000) // Check every 5 minutes instead of 1
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [isInitialized, authStore.isAuthenticated, toast])

  // User status management
  useEffect(() => {
    if (!isInitialized || !authStore.isAuthenticated) return

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'away' : 'online'
      authStore.setUserStatus?.(status)
      socketService.updateUserStatus?.(status)
    }

    const handleBeforeUnload = () => {
      authStore.setUserStatus?.('offline')
      socketService.updateUserStatus?.('offline')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isInitialized, authStore.isAuthenticated])

  // Enhanced auth actions with toast feedback
  const enhancedActions = useMemo(() => ({
    login: async (credentials) => {
      try {
        if (DEBUG.ENABLED) console.log('🔐 Attempting login...')
        const result = await authStore.login(credentials)
        
        if (result.success) {
          if (DEBUG.ENABLED) {
            console.log('🔐 Login successful:', {
              hasUser: !!result.user,
              hasToken: !!result.token,
              tokenExpiry: result.tokenExpiry ? new Date(result.tokenExpiry).toISOString() : 'none'
            })
          }
          toast.success('Welcome back!')
        } else {
          console.error('Login failed:', result.error)
          toast.error(result.error || 'Login failed')
        }
        
        return result
      } catch (error) {
        console.error('Login error:', error)
        toast.error('Login failed due to an error')
        return { success: false, error: 'Login failed' }
      }
    },

    register: async (userData) => {
      try {
        const result = await authStore.register(userData)
        toast[result.success ? 'success' : 'error'](
          result.success ? 'Account created successfully!' : result.error || 'Registration failed'
        )
        return result
      } catch (error) {
        console.error('Register error:', error)
        toast.error('Registration failed due to an error')
        return { success: false, error: 'Registration failed' }
      }
    },

    logout: async () => {
      try {
        if (DEBUG.ENABLED) console.log('🚪 Logging out...')
        await authStore.logout()
        toast.info('You have been logged out')
      } catch (error) {
        console.error('Logout error:', error)
      }
    },

    changePassword: async (passwordData) => {
      const result = await authStore.changePassword(passwordData)
      toast[result.success ? 'success' : 'error'](
        result.success ? 'Password changed successfully' : result.error || 'Password change failed'
      )
      return result
    },

    updateProfile: async (profileData) => {
      const result = await authStore.updateProfile(profileData)
      toast[result.success ? 'success' : 'error'](
        result.success ? 'Profile updated successfully' : result.error || 'Profile update failed'
      )
      return result
    },

    // FIXED: Manual session refresh function
    refreshSession: async () => {
      try {
        if (DEBUG.ENABLED) console.log('🔄 Refreshing session...')
        const result = await authStore.refreshUser()
        if (!result.success) {
          console.warn('Session refresh failed:', result.error)
        }
        return result
      } catch (error) {
        console.error('Session refresh error:', error)
        return { success: false, error: 'Session refresh failed' }
      }
    }
  }), [authStore, toast])

  // FIXED: Memoized context value with initialization state
  const contextValue = useMemo(() => ({
    // Core auth state
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    isInitializing: authStore.isInitializing || !isInitialized, // Include local init state
    isInitialized,

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
    rememberMe: authStore.rememberMe,
    autoLogin: authStore.autoLogin,

    // Enhanced actions
    ...enhancedActions,

    // Direct store actions (with null checks)
    clearError: authStore.clearError,
    setUserStatus: authStore.setUserStatus,
    updateAvatar: authStore.updateAvatar,
    refreshUser: authStore.refreshUser,
    toggleRememberMe: authStore.toggleRememberMe,
    setAutoLogin: authStore.setAutoLogin,

    // Computed values (with null checks)
    getUserDisplayName: authStore.getUserDisplayName || (() => ''),
    getUserInitials: authStore.getUserInitials || (() => ''),
    hasRole: authStore.hasRole || (() => false),
    isSessionExpired: authStore.isSessionExpired || (() => false),
    getSessionTimeRemaining: authStore.getSessionTimeRemaining || (() => 0),
    isUserOnline: authStore.isUserOnline || (() => false),

    // Connection status
    connectionStatus: authStore.isAuthenticated 
      ? (socketService.isSocketConnected?.() ? 'connected' : 'connecting') 
      : 'disconnected',
  }), [authStore, enhancedActions, isInitialized])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
