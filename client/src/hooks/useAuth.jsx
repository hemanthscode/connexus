import { useCallback, useEffect, useState } from 'react'
import { useAuthStore, useAuthActions, useAuthComputed } from '@/store/authSlice.js'
import { useNavigate } from 'react-router-dom'
import { validateData, authValidation } from '@/utils/validators.js'
import { useToast } from '@/components/ui/Toast.jsx'

// Main auth hook
export const useAuth = () => {
  const authStore = useAuthStore()
  const authActions = useAuthActions()
  const authComputed = useAuthComputed()

  return {
    // State
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
    
    // Actions
    ...authActions,
    
    // Computed
    ...authComputed,
  }
}

// Login hook
export const useLogin = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { login, clearError, loginError, isLoggingIn } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  // Clear errors when component mounts (only once)
  useEffect(() => {
    clearError('loginError')
  }, []) // Empty dependency array - only run once

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
    const validation = validateData(authValidation.login, formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors({})
    
    try {
      const result = await login(validation.data)
      
      if (result.success) {
        toast.success('Login successful!')
        navigate('/chat')
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }, [formData, login, navigate, toast])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const clearErrorCallback = useCallback(() => {
    clearError('loginError')
    setValidationErrors({})
  }, [clearError])

  return {
    formData,
    validationErrors,
    isLoading: isLoggingIn,
    error: loginError,
    showPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearError: clearErrorCallback, // Use wrapped version
  }
}

// Register hook
export const useRegister = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { register, clearError, registerError, isRegistering } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Clear errors when component mounts (only once)
  useEffect(() => {
    clearError('registerError')
  }, []) // Empty dependency array - only run once

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
    const validation = validateData(authValidation.register, formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors({})
    
    try {
      const result = await register(validation.data)
      
      if (result.success) {
        toast.success('Registration successful!')
        navigate('/welcome')
      }
    } catch (error) {
      console.error('Registration error:', error)
    }
  }, [formData, register, navigate, toast])

  const togglePasswordVisibility = useCallback((field) => {
    if (field === 'password') {
      setShowPassword(prev => !prev)
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(prev => !prev)
    }
  }, [])

  const clearErrorCallback = useCallback(() => {
    clearError('registerError')
    setValidationErrors({})
  }, [clearError])

  return {
    formData,
    validationErrors,
    isLoading: isRegistering,
    error: registerError,
    showPassword,
    showConfirmPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearError: clearErrorCallback, // Use wrapped version
  }
}

// Profile update hook
export const useProfileUpdate = () => {
  const { user, updateProfile, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    avatar: user?.avatar || null
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || null
      })
    }
  }, [user])

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Check if there are changes
      const originalData = {
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        location: user?.location || '',
        avatar: user?.avatar || null
      }
      
      const changed = Object.keys(newData).some(key => newData[key] !== originalData[key])
      setHasChanges(changed)
      
      return newData
    })
    
    // Clear field validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [user, validationErrors])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    if (!hasChanges) return { success: false, error: 'No changes to save' }
    
    // Validate form data
    const validation = validateData(authValidation.updateProfile, formData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return { success: false, error: 'Validation failed' }
    }
    
    setValidationErrors({})
    
    try {
      const result = await updateProfile(validation.data)
      
      if (result.success) {
        setHasChanges(false)
      }
      
      return result
    } catch (error) {
      console.error('Profile update error:', error)
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

  const clearError = useCallback(() => {
    setValidationErrors({})
  }, [])

  return {
    formData,
    validationErrors,
    isLoading,
    hasChanges,
    handleInputChange,
    handleSubmit,
    resetForm,
    clearError,
  }
}

// User preferences hook (placeholder)
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

  const actions = {
    setTheme: (theme) => console.log('Set theme:', theme),
    setLanguage: (language) => console.log('Set language:', language),
    setNotifications: (notifications) => console.log('Set notifications:', notifications),
  }

  return {
    preferences,
    actions
  }
}

export default useAuth
