import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Home, Bug, Copy } from 'lucide-react'
import Button from './Button.jsx'

// Error boundary class component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Report error to tracking service
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleGoHome = () => {
    if (this.props.onGoHome) {
      this.props.onGoHome()
    } else {
      window.location.href = '/'
    }
  }

  handleReportError = async () => {
    const errorReport = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      alert('Error report copied to clipboard. Please share this with support.')
    } catch {
      console.log('Error Report:', errorReport)
      alert('Error report logged to console. Please check developer tools.')
    }
  }

  render() {
    if (this.state.hasError) {
      const { 
        fallback, 
        showDetails = false,
        showRetry = true,
        showGoHome = true,
        showReport = true,
        title = 'Something went wrong',
        message = 'An unexpected error occurred. Please try again.',
        className = ''
      } = this.props

      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.handleRetry)
          : fallback
      }

      return (
        <div className={`min-h-screen bg-dark-bg flex items-center justify-center p-4 ${className}`}>
          <motion.div
            className="max-w-md w-full text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Error Icon */}
            <motion.div
              className="w-24 h-24 mx-auto mb-6 rounded-full glass flex items-center justify-center"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3, delay: 0.2 }}
            >
              <Bug className="w-12 h-12 text-red-400" />
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
              <p className="text-gray-400 mb-6">{message}</p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {showRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </Button>
              )}
              
              {showGoHome && (
                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  leftIcon={<Home className="w-4 h-4" />}
                >
                  Go Home
                </Button>
              )}
            </motion.div>

            {/* Report Error Button */}
            {showReport && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  leftIcon={<Copy className="w-4 h-4" />}
                >
                  Copy Error Report
                </Button>
              </motion.div>
            )}

            {/* Error Details (Development) */}
            {showDetails && this.state.error && (
              <motion.details
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400 mb-2">
                  Error Details
                </summary>
                <div className="glass rounded-lg p-4 text-xs text-gray-400 font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.details>
            )}

            {/* Retry Count */}
            {this.state.retryCount > 0 && (
              <motion.p
                className="mt-4 text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Retry attempts: {this.state.retryCount}
              </motion.p>
            )}
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  const [error, setError] = useState(null)

  const resetError = useCallback(() => setError(null), [])
  const captureError = useCallback((error) => {
    console.error('Error captured:', error)
    setError(error)
  }, [])

  useEffect(() => {
    const handleError = (event) => captureError(event.error)
    const handleUnhandledRejection = (event) => captureError(event.reason)

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [captureError])

  return { error, resetError, captureError }
}

// Async error boundary wrapper
export const AsyncErrorBoundary = ({ children, onError, fallback }) => {
  const { error, resetError } = useErrorHandler()

  useEffect(() => {
    if (error && onError) onError(error)
  }, [error, onError])

  if (error) {
    if (fallback) {
      return typeof fallback === 'function' ? fallback(error, resetError) : fallback
    }

    return (
      <ErrorBoundary hasError={true} error={error} onRetry={resetError}>
        {children}
      </ErrorBoundary>
    )
  }

  return children
}

export default ErrorBoundary
