import React from 'react'
import { cn } from '../../utils/cn'

const Avatar = ({ 
  name = '', 
  src, 
  size = 'md', 
  status,
  className 
}) => {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg'
  }

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center rounded-full',
      'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium',
      sizes[size],
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
      
      {status && (
        <span 
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2',
            'border-white dark:border-gray-800',
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
}

export default Avatar
