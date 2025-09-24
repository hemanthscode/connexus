import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Github, Chrome } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import SocialLogin from '@/components/auth/SocialLogin.jsx'
import PasswordStrength from '@/components/auth/PasswordStrength.jsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useRegister } from '@/hooks/useAuth.jsx'

const RegisterPage = () => {
  const {
    formData,
    validationErrors,
    isLoading,
    error,
    showPassword,
    showConfirmPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    clearError
  } = useRegister()

  // Clear errors on component mount
  useEffect(() => {
    clearError()
  }, [clearError])

  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      icon: <User className="w-5 h-5" />,
      value: formData.name,
      error: validationErrors.name,
      required: true
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
      icon: <Mail className="w-5 h-5" />,
      value: formData.email,
      error: validationErrors.email,
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Create a strong password',
      icon: <Lock className="w-5 h-5" />,
      rightIcon: (
        <button
          type="button"
          onClick={() => togglePasswordVisibility('password')}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      ),
      value: formData.password,
      error: validationErrors.password,
      required: true,
      showStrength: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: showConfirmPassword ? 'text' : 'password',
      placeholder: 'Confirm your password',
      icon: <Lock className="w-5 h-5" />,
      rightIcon: (
        <button
          type="button"
          onClick={() => togglePasswordVisibility('confirmPassword')}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      ),
      value: formData.confirmPassword,
      error: validationErrors.confirmPassword,
      required: true
    }
  ]

  const socialProviders = [
    {
      name: 'Google',
      icon: <Chrome className="w-5 h-5" />,
      color: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400',
      onClick: () => {/* Handle Google signup */}
    },
    {
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      color: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/50 text-gray-400',
      onClick: () => {/* Handle GitHub signup */}
    }
  ]

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Connexus and start connecting with others"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Form Fields */}
        <div className="space-y-4">
          {formFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <Input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                leftIcon={field.icon}
                rightIcon={field.rightIcon}
                error={field.error}
                disabled={isLoading}
                className="w-full"
              />
              
              {/* Password Strength Indicator */}
              {field.showStrength && field.value && (
                <div className="mt-2">
                  <PasswordStrength password={field.value} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Terms & Conditions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-start gap-3"
        >
          <input
            type="checkbox"
            id="terms"
            required
            disabled={isLoading}
            className="w-4 h-4 mt-1 rounded border-gray-600 bg-gray-700 text-cyan-400 focus:ring-cyan-400 focus:ring-2"
          />
          <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
            I agree to the{' '}
            <Link to="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </motion.div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={<UserPlus className="w-5 h-5" />}
            className="w-full"
          >
            Create Account
          </Button>
        </motion.div>

        {/* Social Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-dark-surface text-gray-400">Or sign up with</span>
          </div>
        </div>

        <SocialLogin providers={socialProviders} disabled={isLoading} />

        {/* Sign In Link */}
        <motion.div
          className="text-center pt-6 border-t border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
