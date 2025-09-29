import { motion } from 'framer-motion'
import { clsx } from 'clsx'

// Animation configurations
const ANIMATION_CONFIG = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  }
}

const BACKGROUND_ELEMENTS = [
  {
    className: "absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl",
    animation: {
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.5, 0.3]
    },
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
  },
  {
    className: "absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl",
    animation: {
      scale: [1.2, 1, 1.2],
      opacity: [0.2, 0.4, 0.2]
    },
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }
  },
  {
    className: "absolute top-3/4 left-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl",
    animation: {
      scale: [1, 1.3, 1],
      opacity: [0.25, 0.45, 0.25]
    },
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }
  }
]

const FOOTER_LINKS = [
  { href: '#', label: 'Privacy Policy' },
  { href: '#', label: 'Terms of Service' },
  { href: '#', label: 'Support' }
]

const AuthLayout = ({
  children,
  title = '',
  subtitle = '',
  showLogo = true,
  backgroundPattern = true,
  className = '',
  ...props
}) => {
  return (
    <div className={clsx('min-h-screen bg-dark-bg relative overflow-hidden', className)} {...props}>
      {/* Background Pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg" />
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            {BACKGROUND_ELEMENTS.map((element, index) => (
              <motion.div
                key={index}
                className={element.className}
                animate={element.animation}
                transition={element.transition}
              />
            ))}
          </div>

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
      )}

      {/* Content Container */}
      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
        variants={ANIMATION_CONFIG.container}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <motion.div className="text-center mb-8" variants={ANIMATION_CONFIG.item}>
            {showLogo && (
              <motion.div
                className="inline-flex items-center justify-center mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-400/20">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
              </motion.div>
            )}

            {title && (
              <motion.h1 className="text-3xl font-bold text-white mb-2" variants={ANIMATION_CONFIG.item}>
                {title}
              </motion.h1>
            )}

            {subtitle && (
              <motion.p className="text-gray-400 text-base" variants={ANIMATION_CONFIG.item}>
                {subtitle}
              </motion.p>
            )}
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            className="glass rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-gray-700/50"
            variants={ANIMATION_CONFIG.item}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>

          {/* Footer */}
          <motion.div className="text-center mt-8 text-gray-500 text-sm" variants={ANIMATION_CONFIG.item}>
            <p>© 2025 Connexus. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              {FOOTER_LINKS.map((link, index) => (
                <motion.span key={index} className="flex items-center">
                  {index > 0 && <span className="mr-4">•</span>}
                  <motion.a
                    href={link.href}
                    className="hover:text-cyan-400 transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    {link.label}
                  </motion.a>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default AuthLayout
