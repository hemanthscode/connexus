/**
 * Register Page Component
 * Streamlined registration with Layout integration
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import Layout from '../components/ui/Layout';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate(ROUTES.CHAT, { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  return (
    <Layout showConnectionStatus={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Brand Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Connexus
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-gray-300 text-lg"
            >
              Join the conversation
            </motion.p>
          </div>

          <RegisterForm />
        </motion.div>
      </div>
    </Layout>
  );
};

export default Register;
