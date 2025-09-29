import { useCallback, useEffect, useState, useMemo } from 'react'
import useAuthStore from '@/store/authSlice.js'
import { useNavigate } from 'react-router-dom'
import { validateData, authValidation } from '@/utils/validators.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Main auth hook - simplified and optimized
export const useAuth = () => {
  const authStore = useAuthStore()
  
  return useMemo(() => ({
    // Core state
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
    rememberMe: authStore.rememberMe,
    autoLogin: authStore.autoLogin,
    
    // Actions - direct store methods
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    changePassword: authStore.changePassword,
    updateProfile: authStore.updateProfile,
    clearError: authStore.clearError,
    setUserStatus: authStore.setUserStatus,
    updateAvatar: authStore.updateAvatar,
    refreshUser: authStore.refreshUser,
    toggleRememberMe: authStore.toggleRememberMe,
    setAutoLogin: authStore.setAutoLogin,
    
    // Computed values
    getUserDisplayName: authStore.getUserDisplayName,
    getUserInitials: authStore.getUserInitials,
    hasRole: authStore.hasRole,
    isSessionExpired: authStore.isSessionExpired,
    getSessionTimeRemaining: authStore.getSessionTimeRemaining,
    isUserOnline: authStore.isUserOnline,
  }), [authStore])
}

// Generic form hook for auth forms
const useAuthForm = (initialData, validationSchema, submitAction, successMessage, successRedirect) => {
  const navigate = useNavigate()
  const toast = useToast()
  const { clearError } = useAuth()
  
  const [formData, setFormData] = useState(initialData)
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Clear errors on mount
  useEffect(() => {
    clearError()
  }, [clearError])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [validationErrors])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Validate form data
    const validation = validateData(validationSchema, formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors({})
    
    try {
      const result = await submitAction(validation.data)
      
      if (result.success) {
        toast.success(successMessage)
        if (successRedirect) navigate(successRedirect)
      }
      
      return result
    } catch (error) {
      console.error('Form submission error:', error)
      return { success: false, error: error.message }
    }
  }, [formData, validationSchema, submitAction, toast, successMessage, successRedirect, navigate])

  const togglePasswordVisibility = useCallback((field = 'password') => {
    if (field === 'password') {
      setShowPassword(prev => !prev)
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev)
    }
  }, [])

  const clearFormErrors = useCallback(() => {
    clearError()
    setValidationErrors({})
  }, [clearError])

  return {
    formData,
    validationErrors,
    showPassword,
    showConfirmPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearError: clearFormErrors,
  }
}

// Login hook using generic form hook
export const useLogin = () => {
  const { login, isLoggingIn, loginError } = useAuth()
  
  const formHook = useAuthForm(
    { email: '', password: '', rememberMe: false },
    authValidation.login,
    login,
    'Welcome back!',
    '/chat'
  )

  return {
    ...formHook,
    isLoading: isLoggingIn,
    error: loginError,
  }
}

// Register hook using generic form hook  
export const useRegister = () => {
  const { register, isRegistering, registerError } = useAuth()
  
  const formHook = useAuthForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    authValidation.register,
    register,
    'Account created successfully!',
    '/welcome'
  )

  return {
    ...formHook,
    isLoading: isRegistering,
    error: registerError,
  }
}

// Profile update hook - simplified
export const useProfileUpdate = () => {
  const { user, updateProfile, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    avatar: null
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || null
      }
      setFormData(userData)
      setHasChanges(false)
    }
  }, [user])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Check for changes
      if (user) {
        const originalData = {
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          location: user.location || '',
          avatar: user.avatar || null
        }
        
        const changed = Object.keys(newData).some(key => newData[key] !== originalData[key])
        setHasChanges(changed)
      }
      
      return newData
    })
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [user, validationErrors])

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.()
    
    if (!hasChanges) return { success: false, error: 'No changes to save' }
    
    // Note: We'd need to add updateProfile validation to validators
    // For now, using basic validation
    if (!formData.name?.trim()) {
      setValidationErrors({ name: 'Name is required' })
      return { success: false, error: 'Validation failed' }
    }
    
    setValidationErrors({})
    
    try {
      const result = await updateProfile(formData)
      if (result.success) setHasChanges(false)
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [formData, hasChanges, updateProfile])

  const resetForm = useCallback(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || null
      })
      setHasChanges(false)
      setValidationErrors({})
    }
  }, [user])

  return {
    formData,
    validationErrors,
    isLoading,
    hasChanges,
    handleInputChange,
    handleSubmit,
    resetForm,
    clearError: () => setValidationErrors({}),
  }
}

// User preferences hook - simplified placeholder
export const useUserPreferences = () => {
  const [preferences] = useState({
    theme: 'dark',
    language: 'en',
    notifications: {
      messages: true,
      mentions: true,
      sounds: true
    }
  })

  const actions = useMemo(() => ({
    setTheme: (theme) => console.log('Set theme:', theme),
    setLanguage: (language) => console.log('Set language:', language),
    setNotifications: (notifications) => console.log('Set notifications:', notifications),
  }), [])

  return { preferences, actions }
}

export default useAuth
