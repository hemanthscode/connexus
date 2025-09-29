import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { clsx } from 'clsx'

// Animation variants
const MENU_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1, ease: 'easeIn' } },
}

// Position calculator utility
const calculatePosition = (triggerRect, placement = 'bottom-start', offset = 8) => {
  const { scrollX, scrollY, innerWidth, innerHeight } = window
  const menuWidth = 200
  const menuHeight = 300
  const padding = 16

  let top = 0, left = 0

  // Calculate initial position
  switch (placement) {
    case 'bottom-start':
      top = triggerRect.bottom + scrollY + offset
      left = triggerRect.left + scrollX
      break
    case 'bottom-end':
      top = triggerRect.bottom + scrollY + offset
      left = triggerRect.right + scrollX - menuWidth
      break
    case 'top-start':
      top = triggerRect.top + scrollY - menuHeight - offset
      left = triggerRect.left + scrollX
      break
    case 'top-end':
      top = triggerRect.top + scrollY - menuHeight - offset
      left = triggerRect.right + scrollX - menuWidth
      break
    case 'right-start':
      top = triggerRect.top + scrollY
      left = triggerRect.right + scrollX + offset
      break
    case 'left-start':
      top = triggerRect.top + scrollY
      left = triggerRect.left + scrollX - menuWidth - offset
      break
    default:
      top = triggerRect.bottom + scrollY + offset
      left = triggerRect.left + scrollX
  }

  // Adjust for viewport boundaries
  left = Math.max(padding, Math.min(left, innerWidth - menuWidth - padding))
  
  if (top < scrollY + padding) {
    top = triggerRect.bottom + scrollY + offset
  } else if (top + menuHeight > scrollY + innerHeight - padding) {
    top = Math.max(scrollY + padding, triggerRect.top + scrollY - menuHeight - offset)
  }

  return { top, left }
}

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
  
  const setIsOpen = useCallback((open) => {
    if (!isControlled) setInternalIsOpen(open)
    onOpenChange?.(open)
  }, [isControlled, onOpenChange])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const newPosition = calculatePosition(triggerRect, placement, offset)
    setPosition(newPosition)
  }, [placement, offset])

  // Handle clicks and keyboard
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (closeOnOutsideClick && 
          !triggerRef.current?.contains(e.target) && 
          !menuRef.current?.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnOutsideClick, closeOnEscape, setIsOpen])

  // Update position when opened
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [isOpen, updatePosition])

  const handleTriggerClick = () => {
    if (!disabled) setIsOpen(!isOpen)
  }

  const handleMenuClick = () => {
    if (closeOnClick) setIsOpen(false)
  }

  const menuClass = useMemo(() => clsx(
    'glass rounded-lg shadow-2xl border border-gray-600/30',
    'z-50 fixed min-w-[180px] max-w-[280px] py-2',
    'backdrop-blur-xl max-h-[400px] overflow-y-auto',
    menuClassName
  ), [menuClassName])

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
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            className={menuClass}
            style={{ top: position.top, left: position.left }}
            variants={MENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleMenuClick}
            {...props}
          >
            {children}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

// Dropdown components
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
      {leftIcon && <span className="flex-shrink-0 w-4 h-4">{leftIcon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {selected && <Check className="flex-shrink-0 w-4 h-4" />}
      {rightIcon && !selected && <span className="flex-shrink-0 w-4 h-4">{rightIcon}</span>}
    </motion.button>
  )
}

export const DropdownSeparator = ({ className = '' }) => (
  <div className={clsx('my-1 h-px bg-gray-600/30', className)} />
)

export const DropdownLabel = ({ children, className = '' }) => (
  <div className={clsx('px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider', className)}>
    {children}
  </div>
)

// Select dropdown component
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
      <span className={clsx('truncate', selectedOption ? 'text-white' : 'text-gray-400')}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </div>
  )

  return (
    <div>
      <Dropdown trigger={trigger} disabled={disabled} {...props}>
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
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}

// Context menu component
export const ContextMenu = ({ children, items = [], className = '', ...props }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleContextMenu = (e) => {
    e.preventDefault()

    const { clientX: x, clientY: y } = e
    const { innerWidth, innerHeight } = window
    const menuWidth = 180
    const menuHeight = 200
    const padding = 16

    const adjustedX = Math.max(padding, Math.min(x, innerWidth - menuWidth - padding))
    const adjustedY = Math.max(padding, Math.min(y, innerHeight - menuHeight - padding))

    setPosition({ x: adjustedX, y: adjustedY })
    setIsOpen(true)
  }

  return (
    <div className={className} onContextMenu={handleContextMenu} {...props}>
      {children}
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            className="glass rounded-lg shadow-2xl border border-gray-600/30 z-50 fixed min-w-[160px] max-w-[240px] py-2 backdrop-blur-xl max-h-[300px] overflow-y-auto"
            style={{ top: position.y, left: position.x }}
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export default Dropdown
