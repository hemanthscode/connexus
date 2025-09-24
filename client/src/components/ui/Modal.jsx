import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

const Modal = ({
  isOpen = false,
  onClose,
  children,
  title = null,
  description = null,
  size = 'md',
  closable = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footer = null,
  ...props
}) => {
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)
  
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return
    
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement
      
      // Focus the modal after animation
      setTimeout(() => {
        modalRef.current?.focus()
      }, 100)
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus()
    }
  }, [isOpen])
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])
  
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose?.()
    }
  }
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  }
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }
  
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  }
  
  if (!isOpen) return null
  
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={clsx('fixed inset-0 z-50', className)}>
          {/* Overlay */}
          <motion.div
            className={clsx(
              'fixed inset-0 bg-black/50 backdrop-blur-sm',
              overlayClassName
            )}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleOverlayClick}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                ref={modalRef}
                className={clsx(
                  'glass rounded-xl shadow-2xl w-full relative',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                  sizes[size],
                  contentClassName
                )}
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                tabIndex={-1}
                {...props}
              >
                {/* Header */}
                {(title || description || showCloseButton) && (
                  <div className={clsx(
                    'flex items-start justify-between p-6 pb-0',
                    headerClassName
                  )}>
                    <div className="flex-1 min-w-0">
                      {title && (
                        <h2 className="text-xl font-semibold text-white mb-1">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p className="text-sm text-gray-400">
                          {description}
                        </p>
                      )}
                    </div>
                    
                    {/* Close Button */}
                    {showCloseButton && closable && (
                      <motion.button
                        onClick={onClose}
                        className={clsx(
                          'ml-4 p-2 rounded-lg text-gray-400',
                          'hover:text-white hover:bg-white/10',
                          'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                          'transition-colors duration-200'
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                )}
                
                {/* Body */}
                <div className={clsx(
                  'px-6',
                  (title || description) ? 'pt-4 pb-6' : 'py-6',
                  footer && 'pb-0',
                  bodyClassName
                )}>
                  {children}
                </div>
                
                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 border-t border-gray-600/30">
                    {footer}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
  
  return createPortal(modalContent, document.body)
}

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  ...props
}) => {
  const variants = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500',
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <div className="space-y-4">
        <p className="text-gray-300">{message}</p>
        
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-gray-600 text-white hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg text-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              'flex items-center gap-2',
              variants[variant]
            )}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Alert Modal Component
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  variant = 'info',
  buttonLabel = 'OK',
  ...props
}) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      {...props}
    >
      <div className="text-center space-y-4">
        <div className="text-4xl">{icons[variant]}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-gray-300">{message}</p>
        
        <button
          type="button"
          onClick={onClose}
          className={clsx(
            'px-6 py-2 text-sm font-medium rounded-lg',
            'bg-cyan-600 text-white hover:bg-cyan-700',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500',
            'transition-colors duration-200'
          )}
        >
          {buttonLabel}
        </button>
      </div>
    </Modal>
  )
}

export default Modal
