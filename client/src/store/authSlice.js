import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import authService from '@/services/authService.js'
import { DEBUG } from '@/utils/constants.js'

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  isLoggingIn: false,
  isRegistering: false,
  isChangingPassword: false,
  error: null,
  loginError: null,
  registerError: null,
  lastLoginAt: null,
  sessionExpiry: null,
  rememberMe: true,
  autoLogin: true,
}

// Helper to calculate session expiry
const calculateSessionExpiry = (expiresIn) => {
  if (!expiresIn) return null
  const expiresInMs = (typeof expiresIn === 'number' ? expiresIn : parseInt(expiresIn)) * 1000
  return !isNaN(expiresInMs) && expiresInMs > 0 
    ? new Date(Date.now() + expiresInMs).toISOString() 
    : null
}

// Helper for successful auth
const handleAuthSuccess = (result, set) => {
  const sessionExpiry = calculateSessionExpiry(result.data.expiresIn)
  
  set({
    user: result.data.user,
    isAuthenticated: true,
    lastLoginAt: new Date().toISOString(),
    sessionExpiry,
    error: null,
    loginError: null,
    registerError: null,
  })

  if (DEBUG.ENABLED) {
    console.log('Auth success:', result.data.user?.name)
  }

  return { success: true, data: result.data }
}

// Helper for auth errors
const handleAuthError = (error, set, errorField) => {
  const errorMessage = error.message || `${errorField} failed`
  
  set({ [errorField]: errorMessage })
  console.error(`${errorField}:`, error)
  
  return { success: false, error: errorMessage }
}

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        initialize: async () => {
          set({ isInitializing: true, error: null })

          try {
            const userData = await authService.refreshAuth()
            
            if (userData) {
              set({
                user: userData,
                isAuthenticated: true,
                lastLoginAt: new Date().toISOString(),
                isInitializing: false
              })
            } else {
              set({ ...initialState, isInitializing: false })
            }
          } catch (error) {
            set({
              ...initialState,
              error: error.message || 'Authentication initialization failed',
              isInitializing: false
            })
          }
        },

        login: async (credentials) => {
          set({ isLoggingIn: true, loginError: null, error: null })

          try {
            const result = await authService.loginUser(credentials)
            set({ isLoggingIn: false })
            return handleAuthSuccess(result, set)
          } catch (error) {
            set({ isLoggingIn: false })
            return handleAuthError(error, set, 'loginError')
          }
        },

        register: async (userData) => {
          set({ isRegistering: true, registerError: null, error: null })

          try {
            const result = await authService.registerUser(userData)
            set({ isRegistering: false })
            return handleAuthSuccess(result, set)
          } catch (error) {
            set({ isRegistering: false })
            return handleAuthError(error, set, 'registerError')
          }
        },

        logout: async () => {
          set({ isLoading: true })

          try {
            await authService.logoutUser()
          } catch (error) {
            console.warn('Logout API failed:', error)
          } finally {
            set({ ...initialState, isInitializing: false, isLoading: false })
          }
        },

        changePassword: async (passwordData) => {
          set({ isChangingPassword: true, error: null })

          try {
            const result = await authService.changePassword(passwordData)
            set({ isChangingPassword: false })
            return { success: true, data: result.data }
          } catch (error) {
            set({ isChangingPassword: false })
            return handleAuthError(error, set, 'error')
          }
        },

        updateProfile: async (profileData) => {
          set({ isLoading: true, error: null })

          try {
            const { updateUserProfile } = await import('@/services/userService.js')
            const result = await updateUserProfile(profileData)
            
            const currentUser = get().user
            set({
              user: { ...currentUser, ...result.data },
              isLoading: false
            })

            return { success: true, data: result.data }
          } catch (error) {
            set({ isLoading: false })
            return handleAuthError(error, set, 'error')
          }
        },

        // Utility actions
        clearError: (errorType = null) => {
          if (errorType) {
            set({ [errorType]: null })
          } else {
            set({ error: null, loginError: null, registerError: null })
          }
        },

        setUserStatus: (status) => {
          const user = get().user
          if (user) set({ user: { ...user, status } })
        },

        updateAvatar: (avatarUrl) => {
          const user = get().user
          if (user) set({ user: { ...user, avatar: avatarUrl } })
        },

        refreshUser: async () => {
          try {
            const result = await authService.getCurrentUser()
            set({ user: result.data })
            return { success: true, data: result.data }
          } catch (error) {
            return { success: false, error: error.message }
          }
        },

        toggleRememberMe: () => {
          set({ rememberMe: !get().rememberMe })
        },

        setAutoLogin: (enabled) => {
          set({ autoLogin: enabled })
        },

        // Computed getters
        getUserDisplayName: () => {
          const user = get().user
          return user?.name || user?.email || 'Guest'
        },

        getUserInitials: () => {
          const name = get().getUserDisplayName()
          return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('')
        },

        hasRole: (role) => {
          return get().user?.roles?.includes(role) || false
        },

        isSessionExpired: () => {
          const { sessionExpiry } = get()
          return sessionExpiry ? new Date() > new Date(sessionExpiry) : false
        },

        getSessionTimeRemaining: () => {
          const { sessionExpiry } = get()
          if (!sessionExpiry) return null
          const remaining = new Date(sessionExpiry) - new Date()
          return remaining > 0 ? remaining : 0
        },

        isUserOnline: () => {
          return get().user?.status === 'online'
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastLoginAt: state.lastLoginAt,
          sessionExpiry: state.sessionExpiry,
          rememberMe: state.rememberMe,
          autoLogin: state.autoLogin,
        }),
      }
    ),
    { name: 'auth-store', enabled: DEBUG.ENABLED }
  )
)

// Selectors
export const useAuth = () => useAuthStore()
export const useUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useAuthError = () => useAuthStore(state => state.error)

export default useAuthStore
