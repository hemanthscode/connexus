import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Shield, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const PasswordStrength = ({
  password = '',
  showRequirements = true,
  showStrengthBar = true,
  requirements = null,
  className = '',
  ...props
}) => {
  // Default password requirements
  const defaultRequirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      test: (pwd) => pwd.length >= 8
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      id: 'number',
      label: 'One number',
      test: (pwd) => /\d/.test(pwd)
    },
    {
      id: 'special',
      label: 'One special character',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  ]

  const passwordRequirements = requirements || defaultRequirements

  // Calculate password strength
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        strength: 'none',
        color: 'gray',
        label: '',
        requirements: passwordRequirements.map(req => ({
          ...req,
          met: false
        }))
      }
    }

    const metRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.test(password)
    }))

    const metCount = metRequirements.filter(req => req.met).length
    const score = (metCount / passwordRequirements.length) * 100

    let strength, color, label, icon

    if (score < 40) {
      strength = 'weak'
      color = 'red'
      label = 'Weak'
      icon = <AlertTriangle className="w-4 h-4" />
    } else if (score < 70) {
      strength = 'medium'
      color = 'yellow'
      label = 'Medium'
      icon = <Shield className="w-4 h-4" />
    } else if (score < 100) {
      strength = 'strong'
      color = 'blue'
      label = 'Strong'
      icon = <Shield className="w-4 h-4" />
    } else {
      strength = 'very-strong'
      color = 'green'
      label = 'Very Strong'
      icon = <Shield className="w-4 h-4" />
    }

    return {
      score,
      strength,
      color,
      label,
      icon,
      requirements: metRequirements
    }
  }, [password, passwordRequirements])

  if (!password) return null

  const colorClasses = {
    red: {
      bg: 'bg-red-500',
      text: 'text-red-400',
      border: 'border-red-500/30'
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30'
    },
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-400',
      border: 'border-green-500/30'
    },
    gray: {
      bg: 'bg-gray-500',
      text: 'text-gray-400',
      border: 'border-gray-500/30'
    }
  }

  const colors = colorClasses[analysis.color]

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx('space-y-3', className)}
      {...props}
    >
      {/* Strength Bar */}
      {showStrengthBar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">
              Password Strength
            </span>
            <div className={clsx('flex items-center gap-1', colors.text)}>
              {analysis.icon}
              <span className="text-sm font-medium">
                {analysis.label}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', colors.bg)}
              initial={{ width: 0 }}
              animate={{ width: `${analysis.score}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-300">
            Password must contain:
          </span>
          
          <ul className="space-y-1">
            <AnimatePresence>
              {analysis.requirements.map((requirement, index) => (
                <motion.li
                  key={requirement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <div className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center',
                    requirement.met 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-600/20 text-gray-500'
                  )}>
                    {requirement.met ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </div>
                  
                  <span className={clsx(
                    'text-sm',
                    requirement.met 
                      ? 'text-green-400' 
                      : 'text-gray-400'
                  )}>
                    {requirement.label}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Security Tips */}
      {analysis.strength === 'weak' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-400">
                Make your password stronger
              </p>
              <p className="text-xs text-yellow-400/80">
                Consider using a mix of letters, numbers, and special characters.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {analysis.strength === 'very-strong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <p className="text-sm font-medium text-green-400">
              Excellent! Your password is very secure.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Simplified password strength indicator (just the bar)
export const PasswordStrengthBar = ({
  password = '',
  className = '',
  ...props
}) => {
  return (
    <PasswordStrength
      password={password}
      showRequirements={false}
      showStrengthBar={true}
      className={className}
      {...props}
    />
  )
}

// Password requirements checklist only
export const PasswordRequirements = ({
  password = '',
  requirements = null,
  className = '',
  ...props
}) => {
  return (
    <PasswordStrength
      password={password}
      showRequirements={true}
      showStrengthBar={false}
      requirements={requirements}
      className={className}
      {...props}
    />
  )
}

// Real-time password validation hook
export const usePasswordValidation = (password, requirements = null) => {
  const defaultRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ]

  const reqs = requirements || defaultRequirements

  return useMemo(() => {
    if (!password) {
      return {
        isValid: false,
        score: 0,
        strength: 'none',
        requirements: reqs.map(req => ({ ...req, met: false }))
      }
    }

    const metRequirements = reqs.map(req => ({
      ...req,
      met: req.test(password)
    }))

    const metCount = metRequirements.filter(req => req.met).length
    const score = (metCount / reqs.length) * 100
    const isValid = metCount === reqs.length

    let strength
    if (score < 40) strength = 'weak'
    else if (score < 70) strength = 'medium'
    else if (score < 100) strength = 'strong'
    else strength = 'very-strong'

    return {
      isValid,
      score,
      strength,
      requirements: metRequirements
    }
  }, [password, reqs])
}

export default PasswordStrength
