/**
 * Enhanced Input Component
 * Supports labels, icons, validation, different types
 */

import { forwardRef, memo, useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import clsx from 'clsx';

const inputVariants = {
  default: 'bg-white/10 backdrop-blur-sm border-white/20 focus:border-blue-400 focus:ring-blue-400/30',
  error: 'bg-red-500/10 border-red-400/50 focus:border-red-400 focus:ring-red-400/30',
  success: 'bg-green-500/10 border-green-400/50 focus:border-green-400 focus:ring-green-400/30',
  warning: 'bg-yellow-500/10 border-yellow-400/50 focus:border-yellow-400 focus:ring-yellow-400/30',
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-4 text-base',
};

const Input = forwardRef(({
  label,
  icon,
  rightIcon,
  error,
  success,
  warning,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  variant,
  type = 'text',
  className = '',
  containerClassName = '',
  placeholder,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine variant based on state
  const currentVariant = variant || 
    (error ? 'error' : success ? 'success' : warning ? 'warning' : 'default');

  // Handle password visibility toggle
  const isPasswordType = type === 'password';
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  // Status icon
  const StatusIcon = error ? AlertCircle : success ? Check : null;

  const inputClasses = clsx(
    // Base styles
    'w-full rounded-xl border transition-all duration-200',
    'placeholder-gray-400 text-white',
    'focus:outline-none focus:ring-2',
    
    // Variant styles
    inputVariants[currentVariant],
    
    // Size styles
    inputSizes[size],
    
    // Icon padding
    icon && 'pl-10',
    (rightIcon || isPasswordType || StatusIcon) && 'pr-10',
    
    // State styles
    disabled && 'opacity-50 cursor-not-allowed bg-gray-500/10',
    isFocused && 'ring-2',
    
    className
  );

  return (
    <div className={clsx('w-full', containerClassName)}>
      {/* Label */}
      {label && (
        <label className={clsx(
          'block text-sm font-medium mb-2 transition-colors',
          error ? 'text-red-300' : 
          success ? 'text-green-300' : 
          warning ? 'text-yellow-300' : 
          'text-gray-200'
        )}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={clsx(
              'transition-colors',
              error ? 'text-red-400' : 
              success ? 'text-green-400' : 
              warning ? 'text-yellow-400' :
              isFocused ? 'text-blue-400' : 'text-gray-400'
            )}>
              {icon}
            </span>
          </div>
        )}
        
        {/* Input Field */}
        <input
          ref={ref}
          type={inputType}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {/* Right Icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {/* Status Icon */}
          {StatusIcon && (
            <StatusIcon className={clsx(
              'w-5 h-5 mr-2',
              error ? 'text-red-400' : 'text-green-400'
            )} />
          )}
          
          {/* Password Toggle */}
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
          
          {/* Custom Right Icon */}
          {rightIcon && !StatusIcon && (
            <span className="text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>
      </div>
      
      {/* Helper/Error Text */}
      {(error || success || warning || helperText) && (
        <div className="mt-2 text-sm">
          {error && <p className="text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
          {success && <p className="text-green-400 flex items-center"><Check className="w-4 h-4 mr-1" />{success}</p>}
          {warning && <p className="text-yellow-400">{warning}</p>}
          {helperText && !error && !success && !warning && (
            <p className="text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default memo(Input);
