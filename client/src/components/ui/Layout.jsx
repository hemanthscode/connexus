import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Toaster } from 'react-hot-toast';

const Layout = ({ children, className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, connectionError } = useSocket();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 ${className}`}>
      {/* Connection Status Bar */}
      {isAuthenticated && !isConnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm text-yellow-900 text-center py-2 text-sm font-medium"
        >
          {connectionError ? `Connection failed: ${connectionError}` : 'Connecting...'}
        </motion.div>
      )}

      {/* Main Content */}
      <main className={isAuthenticated && !isConnected ? 'pt-10' : ''}>
        {children}
      </main>

      {/* Global Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;
