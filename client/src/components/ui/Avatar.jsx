/**
 * Avatar Component - FIXED ONLINE STATUS UPDATES
 * Enhanced with better reactivity and real-time status updates
 */
import { memo } from 'react';
import { getInitials, generateColorFromString } from '../../utils/formatters';
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
  lg: 'w-3 h-3', // INCREASED SIZE
  xl: 'w-4 h-4', 
  '2xl': 'w-5 h-5',
};

// ENHANCED: Better memoization with proper dependencies
const Avatar = memo(({ 
  src, 
  name = '', 
  size = 'md',
  isOnline = false,
  showOnlineStatus = false,
  type = 'user',
  className = '',
  userId = null, // ADD userId prop for better tracking
  ...props 
}) => {
  const sizeClasses = avatarSizes[size];
  const indicatorSize = onlineIndicatorSizes[size];

  const renderFallback = () => {
    if (type === 'group') {
      return (
        <div 
          className={clsx(
            'bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md',
            sizeClasses, className
          )} 
          {...props}
        >
          <Hash className={clsx('text-white', {
            'w-2 h-2': size === 'xs',
            'w-3 h-3': size === 'sm', 
            'w-4 h-4': size === 'md',
            'w-6 h-6': size === 'lg',
            'w-8 h-8': size === 'xl',
            'w-10 h-10': size === '2xl'
          })} />
        </div>
      );
    }

    const bgColor = generateColorFromString(name, { saturation: 65, lightness: 50 });
    
    return (
      <div 
        className={clsx('rounded-xl flex items-center justify-center shadow-md', sizeClasses, className)}
        style={{ background: bgColor }}
        {...props}
      >
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
          alt={name || 'Avatar'} 
          className={clsx('rounded-full object-cover shadow-md', sizeClasses, className)}
          onError={(e) => { 
            e.target.style.display = 'none'; 
            e.target.nextSibling?.style.setProperty('display', 'flex'); 
          }}
          {...props}
        />
      ) : (
        renderFallback()
      )}
      
      {/* ENHANCED: Better online indicator */}
      {showOnlineStatus && (
        <div 
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 border-2 border-white rounded-full shadow-sm transition-all duration-200',
            indicatorSize,
            {
              'bg-green-500': isOnline,
              'bg-gray-400': !isOnline,
              'animate-pulse': isOnline, // PULSE WHEN ONLINE
            }
          )}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
      
      {/* FALLBACK DIV - Hidden by default */}
      <div style={{ display: 'none' }}>
        {renderFallback()}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // CUSTOM COMPARISON: Re-render if online status changes
  return (
    prevProps.src === nextProps.src &&
    prevProps.name === nextProps.name &&
    prevProps.size === nextProps.size &&
    prevProps.isOnline === nextProps.isOnline && // IMPORTANT: Check online status
    prevProps.showOnlineStatus === nextProps.showOnlineStatus &&
    prevProps.type === nextProps.type &&
    prevProps.userId === nextProps.userId
  );
});

Avatar.displayName = 'Avatar';
export default Avatar;
