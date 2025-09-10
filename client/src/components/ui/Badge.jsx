import React from 'react'
import { cn } from '../../utils/cn'

const Badge = ({ 
  children, 
  variant = 'default', 
  className 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5',
      'text-xs font-medium transition-colors',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

export default Badge
