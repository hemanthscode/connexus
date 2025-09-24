import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Github, Chrome } from 'lucide-react'
import { clsx } from 'clsx'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import SocialLogin from '@/components/auth/SocialLogin.jsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useLogin } from '@/hooks/useAuth.jsx'

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

  const formFields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter your email',
      icon: <Mail className="w-5 h-5" />,
      value: formData.email,
      error: validationErrors.email,
      required: true
    },
    {
      name: 'password',
      label: 'Password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Enter your password',
      icon: <Lock className="w-5 h-5" />,
      rightIcon: (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      ),
      value: formData.password,
      error: validationErrors.password,
      required: true
    }
  ]

  const socialProviders = [
    {
      name: 'Google',
      icon: <Chrome className="w-5 h-5" />,
      color: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400',
      onClick: () => {/* Handle Google login */}
    },
    {
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      color: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/50 text-gray-400',
      onClick: () => {/* Handle GitHub login */}
    }
  ]

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Connexus account"
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
            </motion.div>
          ))}
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
            Sign In
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
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
