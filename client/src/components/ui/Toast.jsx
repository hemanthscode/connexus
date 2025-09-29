import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { clsx } from 'clsx'

// Toast management
let toastId = 0
const toasts = new Map()
const listeners = new Set()

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts.values()]))
}

// Configuration
const TOAST_TYPES = {
  success: { icon: CheckCircle, style: 'border-green-500/30 bg-green-500/10 text-green-400' },
  error: { icon: XCircle, style: 'border-red-500/30 bg-red-500/10 text-red-400' },
  warning: { icon: AlertTriangle, style: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
  info: { icon: Info, style: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' },
  loading: { icon: null, style: 'border-gray-500/30 bg-gray-500/10 text-gray-400' },
  custom: { icon: null, style: 'border-gray-500/30 bg-gray-500/10 text-white' },
}

const POSITIONS = {
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
}

const ANIMATIONS = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.5 },
}

// Core toast function
const showToast = (message, options = {}) => {
  const id = ++toastId
  const toastData = {
    id,
    message,
    type: options.type || 'info',
    duration: options.duration !== undefined ? options.duration : 4000,
    closable: options.closable !== false,
    action: options.action || null,
    position: options.position || 'top-right',
    ...options
  }
  
  toasts.set(id, toastData)
  notifyListeners()
  
  // Auto dismiss
  if (toastData.duration > 0) {
    setTimeout(() => toast.dismiss(id), toastData.duration)
  }
  
  return id
}

// Toast API
export const toast = {
  success: (message, options = {}) => showToast(message, { ...options, type: 'success' }),
  error: (message, options = {}) => showToast(message, { ...options, type: 'error' }),
  warning: (message, options = {}) => showToast(message, { ...options, type: 'warning' }),
  info: (message, options = {}) => showToast(message, { ...options, type: 'info' }),
  loading: (message, options = {}) => showToast(message, { ...options, type: 'loading', duration: 0 }),
  custom: (component, options = {}) => showToast(component, { ...options, type: 'custom' }),
  dismiss: (id) => {
    if (toasts.has(id)) {
      toasts.delete(id)
      notifyListeners()
    }
  },
  dismissAll: () => {
    toasts.clear()
    notifyListeners()
  }
}

// Individual Toast Component
const ToastItem = ({ toast: toastData, onDismiss }) => {
  const { id, message, type, closable, action, duration } = toastData
  const config = TOAST_TYPES[type]
  const Icon = config.icon

  const renderContent = () => {
    if (typeof message === 'string') {
      return <p className="text-sm font-medium">{message}</p>
    }
    return message
  }

  return (
    <motion.div
      layout
      variants={ANIMATIONS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={clsx(
        'glass rounded-lg p-4 shadow-lg backdrop-blur-sm border',
        'min-w-[300px] max-w-[500px] relative group',
        config.style
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {type === 'loading' ? (
          <div className="flex-shrink-0 mt-0.5">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-current" />
          </div>
        ) : Icon ? (
          <Icon className="flex-shrink-0 w-5 h-5 mt-0.5" />
        ) : null}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>

        {/* Action Button */}
        {action && (
          <button
            onClick={() => {
              action.onClick?.(id)
              onDismiss(id)
            }}
            className="flex-shrink-0 text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        {closable && (
          <button
            onClick={() => onDismiss(id)}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current rounded-b-lg origin-left"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

// Toast Container Component
const ToastContainer = ({ position }) => {
  const [toastList, setToastList] = useState([])

  useEffect(() => {
    const handleUpdate = (newToasts) => setToastList(newToasts)
    listeners.add(handleUpdate)
    return () => listeners.delete(handleUpdate)
  }, [])

  const filteredToasts = useMemo(() => 
    toastList.filter(t => (t.position || 'top-right') === position),
    [toastList, position]
  )

  if (filteredToasts.length === 0) return null

  return (
    <div className={clsx(
      'fixed z-[9999] flex flex-col gap-2 pointer-events-none',
      POSITIONS[position]
    )}>
      <AnimatePresence>
        {filteredToasts.map((toastData) => (
          <div key={toastData.id} className="pointer-events-auto">
            <ToastItem toast={toastData} onDismiss={toast.dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Custom Toast Content Components
export const ToastWithAction = ({ title, description, actionLabel, onAction }) => (
  <div className="space-y-1">
    <p className="font-semibold text-sm">{title}</p>
    {description && <p className="text-sm opacity-90">{description}</p>}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="text-sm font-medium underline hover:no-underline mt-2"
      >
        {actionLabel}
      </button>
    )}
  </div>
)

export const ToastProgress = ({ title, progress, total, description }) => {
  const percentage = Math.round((progress / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{title}</p>
        <span className="text-sm opacity-75">{percentage}%</span>
      </div>
      {description && <p className="text-sm opacity-90">{description}</p>}
      <div className="w-full bg-white/20 rounded-full h-2">
        <motion.div
          className="bg-current h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// Hook for using toasts
export const useToast = () => toast

// Main Toast Component (place in app root)
const Toast = () => (
  <>
    {Object.keys(POSITIONS).map(position => (
      <ToastContainer key={position} position={position} />
    ))}
  </>
)

export default Toast
