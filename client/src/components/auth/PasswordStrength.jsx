import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Shield, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

// Configuration constants
const PASSWORD_CONFIG = {
  STRENGTH_LEVELS: {
    NONE: { score: 0, strength: 'none', color: 'gray', label: '', icon: null },
    WEAK: { score: 40, strength: 'weak', color: 'red', label: 'Weak', icon: AlertTriangle },
    MEDIUM: { score: 70, strength: 'medium', color: 'yellow', label: 'Medium', icon: Shield },
    STRONG: { score: 100, strength: 'strong', color: 'blue', label: 'Strong', icon: Shield },
    VERY_STRONG: { score: 101, strength: 'very-strong', color: 'green', label: 'Very Strong', icon: Shield }
  },
  DEFAULT_REQUIREMENTS: [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', label: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ],
  COLOR_CLASSES: {
    red: { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30' },
    gray: { bg: 'bg-gray-500', text: 'text-gray-400', border: 'border-gray-500/30' }
  }
}

// Utility function to calculate password strength
const calculatePasswordStrength = (password, requirements) => {
  if (!password) {
    return {
      ...PASSWORD_CONFIG.STRENGTH_LEVELS.NONE,
      requirements: requirements.map(req => ({ ...req, met: false }))
    }
  }

  const metRequirements = requirements.map(req => ({ ...req, met: req.test(password) }))
  const metCount = metRequirements.filter(req => req.met).length
  const score = (metCount / requirements.length) * 100

  let level
  if (score < 40) level = PASSWORD_CONFIG.STRENGTH_LEVELS.WEAK
  else if (score < 70) level = PASSWORD_CONFIG.STRENGTH_LEVELS.MEDIUM
  else if (score < 100) level = PASSWORD_CONFIG.STRENGTH_LEVELS.STRONG
  else level = PASSWORD_CONFIG.STRENGTH_LEVELS.VERY_STRONG

  return {
    ...level,
    score,
    icon: <level.icon className="w-4 h-4" />,
    requirements: metRequirements
  }
}

const PasswordStrength = ({
  password = '',
  showRequirements = true,
  showStrengthBar = true,
  requirements = null,
  className = '',
  ...props
}) => {
  const passwordRequirements = requirements || PASSWORD_CONFIG.DEFAULT_REQUIREMENTS

  // Memoized password analysis
  const analysis = useMemo(
    () => calculatePasswordStrength(password, passwordRequirements),
    [password, passwordRequirements]
  )

  if (!password) return null

  const colors = PASSWORD_CONFIG.COLOR_CLASSES[analysis.color]

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
            <span className="text-sm font-medium text-gray-300">Password Strength</span>
            <div className={clsx('flex items-center gap-1', colors.text)}>
              {analysis.icon}
              <span className="text-sm font-medium">{analysis.label}</span>
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
          <span className="text-sm font-medium text-gray-300">Password must contain:</span>
          
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
                    {requirement.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  
                  <span className={clsx(
                    'text-sm',
                    requirement.met ? 'text-green-400' : 'text-gray-400'
                  )}>
                    {requirement.label}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Contextual Messages */}
      {analysis.strength === 'weak' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-400">Make your password stronger</p>
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

// Simplified variants
export const PasswordStrengthBar = ({ password = '', className = '', ...props }) => (
  <PasswordStrength
    password={password}
    showRequirements={false}
    showStrengthBar={true}
    className={className}
    {...props}
  />
)

export const PasswordRequirements = ({ password = '', requirements = null, className = '', ...props }) => (
  <PasswordStrength
    password={password}
    showRequirements={true}
    showStrengthBar={false}
    requirements={requirements}
    className={className}
    {...props}
  />
)

// Password validation hook
export const usePasswordValidation = (password, requirements = null) => {
  const reqs = requirements || PASSWORD_CONFIG.DEFAULT_REQUIREMENTS

  return useMemo(() => {
    const analysis = calculatePasswordStrength(password, reqs)
    
    return {
      isValid: analysis.requirements.every(req => req.met),
      score: analysis.score,
      strength: analysis.strength,
      requirements: analysis.requirements
    }
  }, [password, reqs])
}

export default PasswordStrength
