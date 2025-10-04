/**
 * Enhanced Modal Component
 * Accessible modal with various sizes and customization options
 */

import { useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import Button from './Button';
import clsx from 'clsx';

const modalSizes = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]'
};

const modalVariants = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  modal: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  }
};

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  type,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  footer,
  className = '',
  overlayClassName = '',
  contentClassName = ''
}) => {
  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape && isOpen) {
      onClose();
    }
  }, [closeOnEscape, isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Setup event listeners and body scroll
  useEffect(() => {
    if (isOpen) {
      if (closeOnEscape) {
        document.addEventListener('keydown', handleEscape);
      }
      
      if (preventBodyScroll) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
          if (closeOnEscape) {
            document.removeEventListener('keydown', handleEscape);
          }
        };
      }
    }
    
    return () => {
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
    };
  }, [isOpen, handleEscape, closeOnEscape, preventBodyScroll]);

  // Don't render if not open
  if (!isOpen) return null;

  const TypeIcon = type ? typeIcons[type] : null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'bg-black/50 backdrop-blur-sm',
          overlayClassName
        )}
        onClick={handleBackdropClick}
        variants={modalVariants.overlay}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={clsx(
            'w-full relative',
            'bg-white/10 backdrop-blur-lg',
            'border border-white/20 rounded-2xl',
            'shadow-2xl overflow-hidden',
            modalSizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          variants={modalVariants.modal}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: 'spring', duration: 0.4 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Header */}
          {(title || showCloseButton || type) && (
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                {TypeIcon && (
                  <TypeIcon className={clsx('w-6 h-6', typeColors[type])} />
                )}
                {title && (
                  <h2 id="modal-title" className="text-xl font-bold text-white">
                    {title}
                  </h2>
                )}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 -mr-2"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={clsx('flex-1', contentClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
};

// Preset modal types for common use cases
export const ConfirmModal = ({ onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', ...props }) => (
  <Modal
    footer={
      <div className="flex justify-end space-x-3">
        <Button variant="ghost" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    }
    {...props}
  />
);

export const AlertModal = ({ type = 'info', onOk, okText = 'OK', ...props }) => (
  <Modal
    type={type}
    footer={
      <div className="flex justify-end">
        <Button variant="primary" onClick={onOk}>
          {okText}
        </Button>
      </div>
    }
    {...props}
  />
);

export default memo(Modal);
