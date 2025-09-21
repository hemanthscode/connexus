import React from 'react'
import { ToastContainer, toast } from 'react-hot-toast'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    toast.error("An unexpected error occurred.")
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
          <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong.</h1>
          <p className="mb-6">Please try refreshing the page.</p>
          <button
            onClick={this.handleReload}
            className="btn-primary px-6 py-3 rounded"
          >
            Reload Page
          </button>
          <ToastContainer />
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
