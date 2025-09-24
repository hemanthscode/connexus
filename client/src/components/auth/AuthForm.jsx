import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

const AuthForm = forwardRef(({
  fields = [],
  submitButton = {},
  onSubmit,
  children,
  isLoading = false,
  error = null,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.form
      ref={ref}
      onSubmit={onSubmit}
      className={clsx('space-y-6', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...props}
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

      {/* Dynamic Fields */}
      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <FormField
              key={field.name || index}
              field={field}
              index={index}
              disabled={isLoading}
            />
          ))}
        </div>
      )}

      {/* Custom Content */}
      {children}

      {/* Submit Button */}
      {submitButton.label && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            variant={submitButton.variant || 'primary'}
            size={submitButton.size || 'lg'}
            loading={isLoading}
            disabled={isLoading || submitButton.disabled}
            leftIcon={submitButton.leftIcon}
            rightIcon={submitButton.rightIcon}
            className={clsx('w-full', submitButton.className)}
          >
            {submitButton.label}
          </Button>
        </motion.div>
      )}
    </motion.form>
  )
})

// Individual form field component
const FormField = ({ field, index, disabled }) => {
  const {
    name,
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    leftIcon,
    rightIcon,
    error,
    helperText,
    required = false,
    autoComplete,
    validation,
    renderCustom,
    className,
    ...fieldProps
  } = field

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={clsx('space-y-2', className)}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Custom Render */}
      {renderCustom ? (
        renderCustom({ field, disabled })
      ) : (
        /* Standard Input */
        <Input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          error={error}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className="w-full"
          {...fieldProps}
        />
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-400">
          {helperText}
        </p>
      )}
    </motion.div>
  )
}

// Pre-configured auth forms
export const LoginForm = ({
  email,
  password,
  rememberMe,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onTogglePassword,
  onSubmit,
  isLoading,
  error,
  emailError,
  passwordError,
  ...props
}) => {
  const fields = [
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter your email',
      value: email,
      onChange: (e) => onEmailChange(e.target.value),
      error: emailError,
      required: true,
      autoComplete: 'email'
    },
    {
      name: 'password',
      label: 'Password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Enter your password',
      value: password,
      onChange: (e) => onPasswordChange(e.target.value),
      rightIcon: (
        <button
          type="button"
          onClick={onTogglePassword}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showPassword ? '👁️‍🗨️' : '👁️'}
        </button>
      ),
      error: passwordError,
      required: true,
      autoComplete: 'current-password'
    }
  ]

  return (
    <AuthForm
      fields={fields}
      onSubmit={onSubmit}
      isLoading={isLoading}
      error={error}
      submitButton={{
        label: 'Sign In',
        variant: 'primary',
        rightIcon: '→'
      }}
      {...props}
    >
      {/* Remember Me */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => onRememberMeChange(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-400 focus:ring-cyan-400"
          />
          <span className="text-sm text-gray-300">Remember me</span>
        </label>
      </div>
    </AuthForm>
  )
}

export const RegisterForm = ({
  name,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
  isLoading,
  error,
  validationErrors = {},
  ...props
}) => {
  const fields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      value: name,
      onChange: (e) => onNameChange(e.target.value),
      error: validationErrors.name,
      required: true,
      autoComplete: 'name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter your email',
      value: email,
      onChange: (e) => onEmailChange(e.target.value),
      error: validationErrors.email,
      required: true,
      autoComplete: 'email'
    },
    {
      name: 'password',
      label: 'Password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Create a password',
      value: password,
      onChange: (e) => onPasswordChange(e.target.value),
      rightIcon: (
        <button
          type="button"
          onClick={onTogglePassword}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showPassword ? '👁️‍🗨️' : '👁️'}
        </button>
      ),
      error: validationErrors.password,
      required: true,
      autoComplete: 'new-password'
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: showConfirmPassword ? 'text' : 'password',
      placeholder: 'Confirm your password',
      value: confirmPassword,
      onChange: (e) => onConfirmPasswordChange(e.target.value),
      rightIcon: (
        <button
          type="button"
          onClick={onToggleConfirmPassword}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
        </button>
      ),
      error: validationErrors.confirmPassword,
      required: true,
      autoComplete: 'new-password'
    }
  ]

  return (
    <AuthForm
      fields={fields}
      onSubmit={onSubmit}
      isLoading={isLoading}
      error={error}
      submitButton={{
        label: 'Create Account',
        variant: 'primary',
        rightIcon: '→'
      }}
      {...props}
    />
  )
}

AuthForm.displayName = 'AuthForm'
export default AuthForm
