import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import authService from '@/services/authService.js'
import { DEBUG } from '@/utils/constants.js'

// Initial state
const initialState = {
  // User data
  user: null,
  isAuthenticated: false,
  
  // Loading states
  isLoading: false,
  isInitializing: true,
  
  // Form states
  isLoggingIn: false,
  isRegistering: false,
  isChangingPassword: false,
  
  // Error states
  error: null,
  loginError: null,
  registerError: null,
  
  // Session info
  lastLoginAt: null,
  sessionExpiry: null,
  
  // Settings
  rememberMe: true,
  autoLogin: true,
}

// Create auth store
const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        actions: {
          /**
           * Initialize authentication state
           */
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

                if (DEBUG.ENABLED) {
                  console.log('Auth initialized with user:', userData)
                }
              } else {
                set({
                  user: null,
                  isAuthenticated: false,
                  isInitializing: false
                })
              }
            } catch (error) {
              console.error('Auth initialization failed:', error)
              set({
                user: null,
                isAuthenticated: false,
                error: error.message || 'Authentication initialization failed',
                isInitializing: false
              })
            }
          },

          /**
           * Login user
           */
          login: async (credentials) => {
            set({
              isLoggingIn: true,
              loginError: null,
              error: null
            })

            try {
              const result = await authService.loginUser(credentials)
              
              // Calculate session expiry properly
              let sessionExpiry = null
              if (result.data.expiresIn) {
                // If expiresIn is in seconds, convert to milliseconds
                const expiresInMs = typeof result.data.expiresIn === 'number' 
                  ? result.data.expiresIn * 1000 
                  : parseInt(result.data.expiresIn) * 1000
                
                if (!isNaN(expiresInMs) && expiresInMs > 0) {
                  sessionExpiry = new Date(Date.now() + expiresInMs).toISOString()
                }
              }
              
              set({
                user: result.data.user,
                isAuthenticated: true,
                lastLoginAt: new Date().toISOString(),
                sessionExpiry,
                isLoggingIn: false,
                loginError: null
              })

              if (DEBUG.ENABLED) {
                console.log('Login successful:', result.data.user)
              }

              return { success: true, data: result.data }
            } catch (error) {
              console.error('Login failed:', error)
              
              set({
                loginError: error.message || 'Login failed',
                isLoggingIn: false
              })

              return { success: false, error: error.message || 'Login failed' }
            }
          },

          /**
           * Register new user
           */
          register: async (userData) => {
            set({
              isRegistering: true,
              registerError: null,
              error: null
            })

            try {
              const result = await authService.registerUser(userData)
              
              // Calculate session expiry properly
              let sessionExpiry = null
              if (result.data.expiresIn) {
                const expiresInMs = typeof result.data.expiresIn === 'number' 
                  ? result.data.expiresIn * 1000 
                  : parseInt(result.data.expiresIn) * 1000
                
                if (!isNaN(expiresInMs) && expiresInMs > 0) {
                  sessionExpiry = new Date(Date.now() + expiresInMs).toISOString()
                }
              }
              
              set({
                user: result.data.user,
                isAuthenticated: true,
                lastLoginAt: new Date().toISOString(),
                sessionExpiry,
                isRegistering: false,
                registerError: null
              })

              if (DEBUG.ENABLED) {
                console.log('Registration successful:', result.data.user)
              }

              return { success: true, data: result.data }
            } catch (error) {
              console.error('Registration failed:', error)
              
              set({
                registerError: error.message || 'Registration failed',
                isRegistering: false
              })

              return { success: false, error: error.message || 'Registration failed' }
            }
          },

          /**
           * Logout user
           */
          logout: async () => {
            set({ isLoading: true })

            try {
              await authService.logoutUser()
            } catch (error) {
              console.warn('Logout API call failed:', error)
            } finally {
              // Clear state regardless of API call success
              set({
                ...initialState,
                isInitializing: false,
                isLoading: false
              })

              if (DEBUG.ENABLED) {
                console.log('User logged out')
              }
            }
          },

          /**
           * Change user password
           */
          changePassword: async (passwordData) => {
            set({
              isChangingPassword: true,
              error: null
            })

            try {
              const result = await authService.changePassword(passwordData)
              
              set({ isChangingPassword: false })

              return { success: true, data: result.data }
            } catch (error) {
              console.error('Password change failed:', error)
              
              set({
                error: error.message || 'Password change failed',
                isChangingPassword: false
              })

              return { success: false, error: error.message || 'Password change failed' }
            }
          },

          /**
           * Update user profile
           */
          updateProfile: async (profileData) => {
            set({
              isLoading: true,
              error: null
            })

            try {
              // Import userService dynamically to avoid circular dependency
              const { updateUserProfile } = await import('@/services/userService.js')
              const result = await updateUserProfile(profileData)
              
              const currentState = get()
              set({
                user: { ...currentState.user, ...result.data },
                isLoading: false
              })

              return { success: true, data: result.data }
            } catch (error) {
              console.error('Profile update failed:', error)
              
              set({
                error: error.message || 'Profile update failed',
                isLoading: false
              })

              return { success: false, error: error.message || 'Profile update failed' }
            }
          },

          /**
           * Clear specific error
           */
          clearError: (errorType = null) => {
            if (errorType) {
              set({ [errorType]: null })
            } else {
              set({
                error: null,
                loginError: null,
                registerError: null
              })
            }
          },

          /**
           * Set user online status
           */
          setUserStatus: (status) => {
            const currentState = get()
            if (currentState.user) {
              set({
                user: { ...currentState.user, status }
              })
            }
          },

          /**
           * Update user avatar
           */
          updateAvatar: (avatarUrl) => {
            const currentState = get()
            if (currentState.user) {
              set({
                user: { ...currentState.user, avatar: avatarUrl }
              })
            }
          },

          /**
           * Check if session is expired
           */
          isSessionExpired: () => {
            const state = get()
            if (!state.sessionExpiry) return false
            return new Date() > new Date(state.sessionExpiry)
          },

          /**
           * Refresh user data
           */
          refreshUser: async () => {
            try {
              const result = await authService.getCurrentUser()
              
              set({ user: result.data })

              return { success: true, data: result.data }
            } catch (error) {
              console.error('User refresh failed:', error)
              return { success: false, error: error.message }
            }
          },

          /**
           * Toggle remember me setting
           */
          toggleRememberMe: () => {
            const currentState = get()
            set({ rememberMe: !currentState.rememberMe })
          },

          /**
           * Set auto login preference
           */
          setAutoLogin: (enabled) => {
            set({ autoLogin: enabled })
          },
        },

        // Computed values (selectors)
        computed: {
          /**
           * Get user display name
           */
          getUserDisplayName: () => {
            const state = get()
            if (!state.user) return 'Guest'
            return state.user.name || state.user.email || 'Unknown User'
          },

          /**
           * Get user initials for avatar
           */
          getUserInitials: () => {
            const state = get()
            const name = state.computed.getUserDisplayName()
            return name
              .split(' ')
              .map(word => word.charAt(0).toUpperCase())
              .slice(0, 2)
              .join('')
          },

          /**
           * Check if user has specific role/permission
           */
          hasRole: (role) => {
            const state = get()
            return state.user?.roles?.includes(role) || false
          },

          /**
           * Get session time remaining
           */
          getSessionTimeRemaining: () => {
            const state = get()
            if (!state.sessionExpiry) return null
            
            const remaining = new Date(state.sessionExpiry) - new Date()
            return remaining > 0 ? remaining : 0
          },

          /**
           * Check if user is online
           */
          isUserOnline: () => {
            const state = get()
            return state.user?.status === 'online'
          },
        },
      }),
      {
        name: 'auth-store',
        // Disable encryption for now to fix the errors
        storage: {
          getItem: (name) => {
            try {
              const item = localStorage.getItem(name)
              return item
            } catch (error) {
              console.warn('Failed to get auth store data:', error)
              return null
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, value)
            } catch (error) {
              console.warn('Failed to set auth store data:', error)
            }
          },
          removeItem: (name) => {
            localStorage.removeItem(name)
          },
        },
        // Only persist certain fields
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
    {
      name: 'auth-store',
      enabled: DEBUG.ENABLED,
    }
  )
)

// Export selectors for easier access
export const useAuth = () => useAuthStore()
export const useAuthActions = () => useAuthStore(state => state.actions)
export const useAuthComputed = () => useAuthStore(state => state.computed)

// Export individual selectors
export const useUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useIsLoading = () => useAuthStore(state => state.isLoading)
export const useAuthError = () => useAuthStore(state => state.error)

// Named export for AuthContext
export { useAuthStore }

export default useAuthStore
