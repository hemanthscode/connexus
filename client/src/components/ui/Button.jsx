/**
 * Enhanced Button Component - OPTIMIZED WITH UTILITIES
 * Uses animation constants and better state management
 */
import { forwardRef, memo } from 'react';
import { motion } from 'framer-motion';
import { ANIMATION } from '../../utils/constants';
import clsx from 'clsx';
import Loading from './Loading';

const buttonVariants = {
  primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
  secondary: 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:ring-white/50',
  ghost: 'text-white hover:bg-white/10 focus:ring-white/50',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500',
  success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500',
  outline: 'border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/5 focus:ring-white/50',
};

const buttonSizes = {
  xs: 'px-2 py-1.5 text-xs', sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base', xl: 'px-8 py-4 text-lg',
};

const Button = forwardRef(({
  children, variant = 'primary', size = 'md', loading = false, disabled = false,
  fullWidth = false, leftIcon, rightIcon, className = '', onClick, ...props
}, ref) => {
  const isDisabled = disabled || loading;

  const handleClick = (e) => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      ref={ref}
      className={clsx(
        'relative inline-flex items-center justify-center font-medium rounded-xl transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
        buttonVariants[variant], buttonSizes[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ duration: ANIMATION.DURATION.FAST / 1000 }} // Use constant
      {...props}
    >
      {leftIcon && !loading && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
      {loading && <Loading size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} className="mr-2" />}
      <span className={clsx('flex-1 truncate', loading && 'opacity-70')}>{children}</span>
      {rightIcon && !loading && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default memo(Button);
