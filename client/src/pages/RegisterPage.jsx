import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, UserPlus } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import SocialLogin from '@/components/auth/SocialLogin.jsx'
import PasswordStrength from '@/components/auth/PasswordStrength.jsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useRegister } from '@/hooks/useAuth.jsx'
import { createPasswordToggle, getSocialProviders, getFormAnimationProps } from '@/utils/authHelpers.jsx'

// Configuration constants
const REGISTER_CONFIG = {
  TITLE: 'Create your account',
  SUBTITLE: 'Join Connexus and start connecting with others',
  SUBMIT_TEXT: 'Create Account',
  FOOTER_TEXT: 'Already have an account?',
  FOOTER_LINK_TEXT: 'Sign in here',
  FOOTER_LINK_TO: '/login'
}

const FORM_FIELDS = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    icon: User,
    required: true
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email address',
    icon: Mail,
    required: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Create a strong password',
    icon: Lock,
    required: true,
    hasToggle: true,
    showStrength: true
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Confirm your password',
    icon: Lock,
    required: true,
    hasToggle: true,
    toggleKey: 'confirmPassword'
  }
]

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

  const socialProviders = getSocialProviders('sign up')

  // Clear errors on component mount
  useEffect(() => {
    clearError()
  }, [clearError])

  const getFieldToggleState = (field) => {
    if (field.toggleKey === 'confirmPassword') return showConfirmPassword
    return showPassword
  }

  const getToggleHandler = (field) => {
    if (field.toggleKey === 'confirmPassword') {
      return () => togglePasswordVisibility('confirmPassword')
    }
    return () => togglePasswordVisibility('password')
  }

  return (
    <AuthLayout title={REGISTER_CONFIG.TITLE} subtitle={REGISTER_CONFIG.SUBTITLE}>
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
          {FORM_FIELDS.map((field, index) => {
            const showToggle = getFieldToggleState(field)
            const fieldProps = {
              type: field.hasToggle ? (showToggle ? 'text' : 'password') : field.type,
              placeholder: field.placeholder,
              value: formData[field.name],
              onChange: (e) => handleInputChange(field.name, e.target.value),
              leftIcon: <field.icon className="w-5 h-5" />,
              error: validationErrors[field.name],
              disabled: isLoading,
              className: "w-full"
            }

            if (field.hasToggle) {
              fieldProps.rightIcon = createPasswordToggle(showToggle, getToggleHandler(field))
            }

            return (
              <motion.div key={field.name} {...getFormAnimationProps(index)}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <Input {...fieldProps} />
                
                {/* Password Strength Indicator */}
                {field.showStrength && fieldProps.value && (
                  <div className="mt-2">
                    <PasswordStrength password={fieldProps.value} />
                  </div>
                )}
              </motion.div>
            )
          })}
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
            {REGISTER_CONFIG.SUBMIT_TEXT}
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
            {REGISTER_CONFIG.FOOTER_TEXT}{' '}
            <Link
              to={REGISTER_CONFIG.FOOTER_LINK_TO}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {REGISTER_CONFIG.FOOTER_LINK_TEXT}
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
