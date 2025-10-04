/**
 * Enhanced Layout Component
 * Main app layout with connection status and toast management
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import clsx from 'clsx';

const ConnectionStatus = memo(({ isConnected, connectionError }) => {
  if (isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={clsx(
          'fixed top-0 left-0 right-0 z-50 backdrop-blur-sm text-center py-3 text-sm font-medium',
          connectionError 
            ? 'bg-red-500/90 text-red-100' 
            : 'bg-yellow-500/90 text-yellow-900'
        )}
      >
        <div className="flex items-center justify-center space-x-2">
          {connectionError ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Connection failed: {connectionError}</span>
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Wifi className="w-4 h-4" />
              </motion.div>
              <span>Connecting to chat server...</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

const Layout = ({ 
  children, 
  className = '',
  showConnectionStatus = true,
  backgroundVariant = 'default'
}) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, connectionError } = useSocket();

  const backgroundVariants = {
    default: 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900',
    dark: 'bg-gray-900',
    blue: 'bg-gradient-to-br from-blue-900 to-indigo-900',
    purple: 'bg-gradient-to-br from-purple-900 to-pink-900',
  };

  const showStatus = showConnectionStatus && isAuthenticated && !isConnected;

  return (
    <div className={clsx(
      'min-h-screen relative',
      backgroundVariants[backgroundVariant],
      className
    )}>
      {/* Connection Status Bar */}
      {showStatus && (
        <ConnectionStatus 
          isConnected={isConnected} 
          connectionError={connectionError} 
        />
      )}

      {/* Main Content */}
      <main className={clsx(
        'relative',
        showStatus && 'pt-12'
      )}>
        {children}
      </main>

      {/* Global Toast Container */}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: showStatus ? 60 : 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            padding: '12px 16px',
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
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  );
};

export default memo(Layout);
