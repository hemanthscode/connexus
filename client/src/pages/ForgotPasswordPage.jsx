import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import authService from '@/services/authService.js'
import { validateData, authValidation } from '@/utils/validators.js'
import { useToast } from '@/components/ui/Toast.jsx'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  
  const toast = useToast()

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setError('')
    setValidationError('')
    
    // Validate email
    const validation = validateData(authValidation.forgotPassword, { email })
    if (!validation.isValid) {
      setValidationError(validation.errors.email)
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await authService.forgotPassword({ email })
      
      if (result.success) {
        setIsSuccess(true)
        toast.success('Password reset email sent successfully')
      } else {
        setError(result.error || 'Failed to send reset email')
        toast.error(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      const errorMessage = 'An error occurred. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [email, toast])

  const handleTryAgain = useCallback(() => {
    setIsSuccess(false)
    setEmail('')
    setError('')
    setValidationError('')
  }, [])

  return (
    <AuthLayout
      title={isSuccess ? 'Check your email' : 'Forgot password?'}
      subtitle={
        isSuccess 
          ? 'We sent a password reset link to your email'
          : 'No worries, we\'ll send you reset instructions'
      }
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <SuccessView 
            key="success"
            email={email}
            onTryAgain={handleTryAgain}
          />
        ) : (
          <ResetForm
            key="form"
            email={email}
            setEmail={setEmail}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            validationError={validationError}
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}

// Reset form component
const ResetForm = ({
  email,
  setEmail,
  onSubmit,
  isLoading,
  error,
  validationError
}) => {
  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={onSubmit}
      className="space-y-6"
    >
      {/* Global Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          error={validationError}
          disabled={isLoading}
          className="w-full"
          autoFocus
        />
        <p className="mt-2 text-sm text-gray-400">
          Enter the email associated with your account and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Submit Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading || !email.trim()}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full"
        >
          Send Reset Link
        </Button>
      </motion.div>

      {/* Back to Login */}
      <motion.div
        className="text-center pt-6 border-t border-gray-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </motion.div>
    </motion.form>
  )
}

// Success view component
const SuccessView = ({ email, onTryAgain }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center space-y-6"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="flex justify-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <p className="text-gray-300">
          We've sent a password reset link to:
        </p>
        <p className="text-lg font-medium text-white bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-600/50">
          {email}
        </p>
        <p className="text-sm text-gray-400">
          Check your email and follow the instructions to reset your password. 
          The link will expire in 15 minutes.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <Button
          onClick={onTryAgain}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Send to Different Email
        </Button>
        
        <div className="text-sm text-gray-400">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={onTryAgain}
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
          >
            try again
          </button>
        </div>
      </motion.div>

      {/* Back to Login */}
      <motion.div
        className="pt-6 border-t border-gray-700/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default ForgotPasswordPage
