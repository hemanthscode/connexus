import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, MessageCircle } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="card-glass p-12 max-w-md mx-auto">
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="mb-8"
          >
            <MessageCircle className="h-24 w-24 text-neon-blue mx-auto neon-glow" />
          </motion.div>
          
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="space-y-4">
            <Link to="/chat" className="btn-primary w-full flex items-center justify-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Go to Chat</span>
            </Link>
            
            <Link to="/login" className="btn-ghost w-full flex items-center justify-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFoundPage
