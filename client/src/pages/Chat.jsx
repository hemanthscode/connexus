/**
 * Chat Page Component
 * Main chat interface with enhanced Layout integration
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../hooks/useChat';
import Layout from '../components/ui/Layout';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

const Chat = () => {
  const { isConnected, isConnecting, connectionError } = useSocket();
  const { isLoading } = useChat();

  // Loading state
  if (isConnecting) {
    return (
      <Layout showConnectionStatus={false}>
        <div className="h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loading size="xl" className="mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Connecting to Connexus</h2>
            <p className="text-blue-200">Setting up your real-time chat experience...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Connection error state
  if (connectionError && !isConnected) {
    return (
      <Layout showConnectionStatus={false} backgroundVariant="dark">
        <div className="h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-400 text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Connection Failed</h2>
            <p className="text-red-200 mb-6">{connectionError}</p>
            <Button
              variant="danger"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Main chat interface
  return (
    <Layout>
      <div className="h-screen flex">
        <ChatSidebar />
        <ChatWindow />
      </div>
      
      {/* Global loading overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 flex items-center space-x-3 border border-white/20">
            <Loading size="sm" />
            <p className="text-white font-medium">Loading...</p>
          </div>
        </motion.div>
      )}
    </Layout>
  );
};

export default Chat;
