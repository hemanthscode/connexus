/**
 * Enhanced Input Component - OPTIMIZED WITH UTILITIES
 * Better validation integration and error handling
 */
import { forwardRef, memo, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { validatePassword } from '../../utils/validation';
import clsx from 'clsx';

const inputVariants = {
  default: 'bg-white/10 backdrop-blur-sm border-white/20 focus:border-blue-400 focus:ring-blue-400/30',
  error: 'bg-red-500/10 border-red-400/50 focus:border-red-400 focus:ring-red-400/30',
  success: 'bg-green-500/10 border-green-400/50 focus:border-green-400 focus:ring-green-400/30',
  warning: 'bg-yellow-500/10 border-yellow-400/50 focus:border-yellow-400 focus:ring-yellow-400/30',
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm', md: 'px-4 py-3 text-sm', lg: 'px-5 py-4 text-base',
};

const Input = forwardRef(({
  label, icon, rightIcon, error, success, warning, helperText, required = false,
  disabled = false, size = 'md', variant, type = 'text', showPasswordStrength = false,
  className = '', containerClassName = '', placeholder, ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const currentVariant = variant || (error ? 'error' : success ? 'success' : warning ? 'warning' : 'default');
  const isPasswordType = type === 'password';
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;
  const StatusIcon = error ? AlertCircle : success ? Check : null;

  // ENHANCED: Password strength indicator using validation utility
  const getPasswordStrength = (password) => {
    if (!showPasswordStrength || !isPasswordType || !password) return null;
    const strength = validatePassword(password);
    const colors = { weak: 'text-red-400', medium: 'text-yellow-400', strong: 'text-green-400' };
    return (
      <div className="mt-1 text-xs">
        <span className={colors[strength.strength] || colors.weak}>
          Password strength: {strength.strength || 'weak'}
        </span>
      </div>
    );
  };

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className={clsx('block text-sm font-medium mb-2 transition-colors', {
          'text-red-300': error,
          'text-green-300': success,
          'text-yellow-300': warning,
          'text-gray-200': !error && !success && !warning
        })}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={clsx('transition-colors', {
              'text-red-400': error,
              'text-green-400': success,
              'text-yellow-400': warning,
              'text-blue-400': isFocused && !error && !success && !warning,
              'text-gray-400': !isFocused && !error && !success && !warning
            })}>
              {icon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            'w-full rounded-xl border transition-all duration-200 placeholder-gray-400 text-white focus:outline-none focus:ring-2',
            inputVariants[currentVariant], inputSizes[size],
            icon && 'pl-10',
            (rightIcon || isPasswordType || StatusIcon) && 'pr-10',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-500/10',
            isFocused && 'ring-2',
            className
          )}
          onFocus={(e) => { setIsFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); props.onBlur?.(e); }}
          {...props}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {StatusIcon && <StatusIcon className={clsx('w-5 h-5 mr-2', error ? 'text-red-400' : 'text-green-400')} />}
          {isPasswordType && (
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors p-1"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightIcon && !StatusIcon && <span className="text-gray-400">{rightIcon}</span>}
        </div>
      </div>
      
      {/* ENHANCED: Password strength + other messages */}
      <div className="mt-2 space-y-1">
        {error && <p className="text-red-400 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
        {success && <p className="text-green-400 text-sm flex items-center"><Check className="w-4 h-4 mr-1" />{success}</p>}
        {warning && <p className="text-yellow-400 text-sm">{warning}</p>}
        {helperText && !error && !success && !warning && <p className="text-gray-400 text-sm">{helperText}</p>}
        {getPasswordStrength(props.value)}
      </div>
    </div>
  );
});

Input.displayName = 'Input';
export default memo(Input);
