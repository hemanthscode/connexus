/**
 * Avatar Component
 * Reusable avatar with online status, fallbacks, and consistent styling
 */

import { memo } from 'react';
import { getInitials } from '../../utils/formatters';
import { Hash } from 'lucide-react';
import clsx from 'clsx';

const avatarSizes = {
  xs: 'w-4 h-4 text-xs',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
  '2xl': 'w-20 h-20 text-lg',
};

const onlineIndicatorSizes = {
  xs: 'w-1 h-1',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
  '2xl': 'w-6 h-6',
};

const Avatar = ({ 
  src, 
  name = '', 
  size = 'md',
  isOnline = false,
  showOnlineStatus = false,
  type = 'user', // 'user' | 'group'
  className = '',
  ...props 
}) => {
  const sizeClasses = avatarSizes[size];
  const indicatorSize = onlineIndicatorSizes[size];

  const renderFallback = () => {
    if (type === 'group') {
      return (
        <div className={clsx(
          'bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md',
          sizeClasses,
          className
        )} {...props}>
          <Hash className={clsx(
            'text-white',
            size === 'xs' ? 'w-2 h-2' :
            size === 'sm' ? 'w-3 h-3' :  
            size === 'md' ? 'w-4 h-4' :
            size === 'lg' ? 'w-6 h-6' :
            size === 'xl' ? 'w-8 h-8' : 'w-10 h-10'
          )} />
        </div>
      );
    }

    return (
      <div className={clsx(
        'bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md',
        sizeClasses,
        className
      )} {...props}>
        <span className="text-white font-semibold">
          {getInitials(name)}
        </span>
      </div>
    );
  };

  return (
    <div className="relative flex-shrink-0">
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className={clsx(
            'rounded-xl object-cover shadow-md',
            sizeClasses,
            className
          )}
          {...props}
        />
      ) : (
        renderFallback()
      )}
      
      {showOnlineStatus && isOnline && (
        <div className={clsx(
          'absolute -bottom-0.5 -right-0.5 bg-green-500 border-2 border-white rounded-full shadow-sm',
          indicatorSize
        )}></div>
      )}
    </div>
  );
};

export default memo(Avatar);
