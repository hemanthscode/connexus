/**
 * Application Entry Point
 * Enhanced with better error boundaries and providers
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
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
          <div className="text-center max-w-md p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-3xl">💥</span>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-red-200 mb-6">
              The application encountered an unexpected error. 
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <>
                  <br />
                  <code className="text-sm text-red-300 mt-2 block">
                    {this.state.error.message}
                  </code>
                </>
              )}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 cursor-pointer hover:text-white">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-300 mt-2 p-3 bg-black/20 rounded overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root element check
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.');
}

// Create and render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
