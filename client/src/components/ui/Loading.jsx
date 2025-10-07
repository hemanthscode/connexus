/**
 * Enhanced Loading Component - OPTIMIZED WITH UTILITIES
 * Uses animation constants for consistent timing
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { ANIMATION } from '../../utils/constants';
import clsx from 'clsx';

const loadingSizes = {
  xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16',
};

const Loading = ({ size = 'md', variant = 'spinner', color = 'white', text, className = '', ...props }) => {
  const colorClasses = {
    white: 'border-white/30 border-t-white', blue: 'border-blue-500/30 border-t-blue-500',
    purple: 'border-purple-500/30 border-t-purple-500', green: 'border-green-500/30 border-t-green-500',
    red: 'border-red-500/30 border-t-red-500',
  };

  if (variant === 'dots') {
    return (
      <div className={clsx('flex items-center space-x-1', className)} {...props}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx('rounded-full', {
              'w-1 h-1': size === 'xs', 'w-1.5 h-1.5': size === 'sm',
              'w-2 h-2': size === 'md', 'w-3 h-3': size === 'lg', 'w-4 h-4': size === 'xl',
              'bg-white': color === 'white', 'bg-blue-500': color === 'blue',
              'bg-purple-500': color === 'purple', 'bg-green-500': color === 'green', 'bg-red-500': color === 'red'
            })}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
          />
        ))}
        {text && <span className="ml-3 text-sm text-gray-300">{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx('flex items-center justify-center', className)} {...props}>
        <motion.div
          className={clsx('rounded-full', loadingSizes[size], {
            'bg-white': color === 'white', 'bg-blue-500': color === 'blue',
            'bg-purple-500': color === 'purple', 'bg-green-500': color === 'green', 'bg-red-500': color === 'red'
          })}
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {text && <span className="ml-3 text-sm text-gray-300">{text}</span>}
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center justify-center', className)} {...props}>
      <motion.div
        className={clsx('border-2 rounded-full', loadingSizes[size], colorClasses[color] || colorClasses.white)}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <span className="ml-3 text-sm text-gray-300">{text}</span>}
    </div>
  );
};

export default memo(Loading);
