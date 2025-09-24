import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { clsx } from 'clsx'

const Dropdown = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  placement = 'bottom-start',
  offset = 8,
  closeOnClick = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  disabled = false,
  className = '',
  menuClassName = '',
  ...props
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  
  const setIsOpen = (open) => {
    if (!isControlled) {
      setInternalIsOpen(open)
    }
    onOpenChange?.(open)
  }
  
  // Calculate menu position
  const calculatePosition = () => {
    if (!triggerRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    
    let top = 0
    let left = 0
    
    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + scrollY + offset
        left = triggerRect.left + scrollX
        break
      case 'bottom-end':
        top = triggerRect.bottom + scrollY + offset
        left = triggerRect.right + scrollX
        break
      case 'top-start':
        top = triggerRect.top + scrollY - offset
        left = triggerRect.left + scrollX
        break
      case 'top-end':
        top = triggerRect.top + scrollY - offset
        left = triggerRect.right + scrollX
        break
      case 'right-start':
        top = triggerRect.top + scrollY
        left = triggerRect.right + scrollX + offset
        break
      case 'left-start':
        top = triggerRect.top + scrollY
        left = triggerRect.left + scrollX - offset
        break
      default:
        top = triggerRect.bottom + scrollY + offset
        left = triggerRect.left + scrollX
    }
    
    setPosition({ top, left })
  }
  
  // Handle outside clicks
  useEffect(() => {
    if (!closeOnOutsideClick || !isOpen) return
    
    const handleClickOutside = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return
      }
      setIsOpen(false)
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, closeOnOutsideClick])
  
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape])
  
  // Update position when opened
  useEffect(() => {
    if (isOpen) {
      calculatePosition()
    }
  }, [isOpen, placement])
  
  const handleTriggerClick = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }
  
  const handleMenuClick = (event) => {
    if (closeOnClick) {
      setIsOpen(false)
    }
  }
  
  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: placement.startsWith('top') ? 10 : -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.15,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: placement.startsWith('top') ? 10 : -10,
      transition: {
        duration: 0.1,
        ease: 'easeIn',
      },
    },
  }
  
  const menu = isOpen && (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        className={clsx(
          'glass rounded-lg shadow-2xl border border-gray-600/30',
          'z-50 absolute min-w-[160px] py-2',
          'backdrop-blur-xl',
          menuClassName
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={handleMenuClick}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
  
  return (
    <div className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      >
        {trigger}
      </div>
      
      {/* Menu Portal */}
      {menu && createPortal(menu, document.body)}
    </div>
  )
}

// Dropdown Item Component
export const DropdownItem = ({
  children,
  onClick,
  disabled = false,
  selected = false,
  leftIcon = null,
  rightIcon = null,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'text-gray-300 hover:text-white hover:bg-white/10',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
    success: 'text-green-400 hover:text-green-300 hover:bg-green-500/10',
  }
  
  return (
    <motion.button
      type="button"
      className={clsx(
        'w-full px-4 py-2 text-left text-sm flex items-center gap-3',
        'transition-colors duration-200 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected && 'bg-cyan-500/20 text-cyan-400',
        !disabled && variants[variant],
        className
      )}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* Left Icon */}
      {leftIcon && (
        <span className="flex-shrink-0 w-4 h-4">
          {leftIcon}
        </span>
      )}
      
      {/* Content */}
      <span className="flex-1 truncate">
        {children}
      </span>
      
      {/* Selected Indicator */}
      {selected && (
        <Check className="flex-shrink-0 w-4 h-4" />
      )}
      
      {/* Right Icon */}
      {rightIcon && !selected && (
        <span className="flex-shrink-0 w-4 h-4">
          {rightIcon}
        </span>
      )}
    </motion.button>
  )
}

// Dropdown Separator Component
export const DropdownSeparator = ({ className = '' }) => {
  return (
    <div className={clsx('my-1 h-px bg-gray-600/30', className)} />
  )
}

// Dropdown Label Component
export const DropdownLabel = ({ children, className = '' }) => {
  return (
    <div className={clsx(
      'px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider',
      className
    )}>
      {children}
    </div>
  )
}

// Select Dropdown Component
export const SelectDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  error = null,
  className = '',
  ...props
}) => {
  const selectedOption = options.find(option => option.value === value)
  
  const trigger = (
    <div className={clsx(
      'input-glass flex items-center justify-between gap-3 cursor-pointer',
      error && 'border-red-500/70 focus:border-red-400/70',
      disabled && 'cursor-not-allowed opacity-50',
      className
    )}>
      <span className={clsx(
        'truncate',
        selectedOption ? 'text-white' : 'text-gray-400'
      )}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </div>
  )
  
  return (
    <div>
      <Dropdown
        trigger={trigger}
        disabled={disabled}
        {...props}
      >
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            selected={value === option.value}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </DropdownItem>
        ))}
      </Dropdown>
      
      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

// Context Menu Component
export const ContextMenu = ({
  children,
  items = [],
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  const handleContextMenu = (event) => {
    event.preventDefault()
    setPosition({ x: event.clientX, y: event.clientY })
    setIsOpen(true)
  }
  
  const menu = isOpen && (
    <AnimatePresence>
      <motion.div
        className="glass rounded-lg shadow-2xl border border-gray-600/30 z-50 fixed min-w-[160px] py-2 backdrop-blur-xl"
        style={{
          top: position.y,
          left: position.x,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => setIsOpen(false)}
      >
        {items.map((item, index) => (
          item.type === 'separator' ? (
            <DropdownSeparator key={index} />
          ) : (
            <DropdownItem
              key={index}
              onClick={item.onClick}
              variant={item.variant}
              leftIcon={item.icon}
            >
              {item.label}
            </DropdownItem>
          )
        ))}
      </motion.div>
    </AnimatePresence>
  )
  
  return (
    <div className={className} onContextMenu={handleContextMenu} {...props}>
      {children}
      {menu && createPortal(menu, document.body)}
    </div>
  )
}

export default Dropdown
