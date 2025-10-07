/**
 * 404 Not Found Page - OPTIMIZED WITH UTILITIES
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { ROUTES, ANIMATION } from '../utils/constants';
import Layout from '../components/ui/Layout';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout showConnectionStatus={false}>
      <div className="h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATION.SPRING.SMOOTH}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <span className="text-6xl font-bold text-white">?</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ANIMATION.SPRING.SMOOTH, delay: 0.2 }}
            className="text-6xl font-bold text-white mb-4"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ANIMATION.SPRING.SMOOTH, delay: 0.3 }}
            className="text-2xl font-semibold text-gray-200 mb-2"
          >
            Page Not Found
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ANIMATION.SPRING.SMOOTH, delay: 0.4 }}
            className="text-gray-400 mb-8"
          >
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to chatting!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ANIMATION.SPRING.SMOOTH, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.CHAT)}
              leftIcon={<MessageCircle className="w-4 h-4" />}
            >
              Go to Chat
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ANIMATION.SPRING.SMOOTH, delay: 0.6 }}
            className="mt-12 text-gray-500 text-sm"
          >
            <p>Need help? Contact our support team.</p>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFound;
