import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import SocialLogin from '@/components/auth/SocialLogin.jsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useLogin } from '@/hooks/useAuth.jsx'
import { createPasswordToggle, getSocialProviders, getFormAnimationProps } from '@/utils/authHelpers.jsx'

// Configuration constants
const LOGIN_CONFIG = {
  TITLE: 'Welcome back',
  SUBTITLE: 'Sign in to your Connexus account',
  SUBMIT_TEXT: 'Sign In',
  FOOTER_TEXT: "Don't have an account?",
  FOOTER_LINK_TEXT: 'Sign up for free',
  FOOTER_LINK_TO: '/register'
}

const FORM_FIELDS = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    icon: Mail,
    required: true
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    icon: Lock,
    required: true,
    hasToggle: true
  }
]

const LoginPage = () => {
  const {
    formData,
    validationErrors,
    isLoading,
    error,
    showPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
  } = useLogin()

  const socialProviders = getSocialProviders()

  return (
    <AuthLayout title={LOGIN_CONFIG.TITLE} subtitle={LOGIN_CONFIG.SUBTITLE}>
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
            const fieldProps = {
              type: field.hasToggle && field.name === 'password' 
                ? (showPassword ? 'text' : 'password') 
                : field.type,
              placeholder: field.placeholder,
              value: formData[field.name],
              onChange: (e) => handleInputChange(field.name, e.target.value),
              leftIcon: <field.icon className="w-5 h-5" />,
              error: validationErrors[field.name],
              disabled: isLoading,
              className: "w-full"
            }

            if (field.hasToggle) {
              fieldProps.rightIcon = createPasswordToggle(showPassword, togglePasswordVisibility)
            }

            return (
              <motion.div key={field.name} {...getFormAnimationProps(index)}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <Input {...fieldProps} />
              </motion.div>
            )
          })}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <motion.label
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-400 focus:ring-cyan-400 focus:ring-2"
            />
            <span className="text-sm text-gray-300">Remember me</span>
          </motion.label>

          <Link
            to="/forgot-password"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full"
          >
            {LOGIN_CONFIG.SUBMIT_TEXT}
          </Button>
        </motion.div>

        {/* Social Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-dark-surface text-gray-400">Or continue with</span>
          </div>
        </div>

        <SocialLogin providers={socialProviders} disabled={isLoading} />

        {/* Sign Up Link */}
        <motion.div
          className="text-center pt-6 border-t border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400">
            {LOGIN_CONFIG.FOOTER_TEXT}{' '}
            <Link
              to={LOGIN_CONFIG.FOOTER_LINK_TO}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {LOGIN_CONFIG.FOOTER_LINK_TEXT}
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
