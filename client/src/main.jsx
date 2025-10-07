/**
 * Application Entry Point - ENHANCED
 * Better error boundaries and performance optimization
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Enhanced Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Connexus Error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Analytics/Error reporting would go here
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center">
          <div className="text-center max-w-lg p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-4xl">💥</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h1>
            <p className="text-red-200 mb-6 leading-relaxed">
              We apologize for the inconvenience. The Connexus app encountered an unexpected error.
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <br />
                  <code className="text-sm text-red-300 mt-3 block font-mono bg-black/20 p-2 rounded">
                    {this.state.error.message}
                  </code>
                </>
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
              >
                Reload App
              </button>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 cursor-pointer hover:text-white text-sm">
                  🔍 Error Details (Development Mode)
                </summary>
                <pre className="text-xs text-red-300 mt-3 p-4 bg-black/30 rounded-lg overflow-auto max-h-48 font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-6 text-gray-500 text-sm">
              <p>Need help? Contact our support team at support@connexus.com</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring
const startTime = performance.now();

// Root element validation
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.');
}

// Render with enhanced error boundary
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// Performance logging (development only)
if (process.env.NODE_ENV === 'development') {
  const loadTime = performance.now() - startTime;
  console.log(`🚀 Connexus loaded in ${loadTime.toFixed(2)}ms`);
}
