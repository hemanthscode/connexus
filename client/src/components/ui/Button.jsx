import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary: {
    rest: { backgroundColor: '#06b6d4', color: '#fff', boxShadow: '0 0 8px #06b6d4' },
    hover: { backgroundColor: '#0891b2', boxShadow: '0 0 12px #0891b2' },
    tap: { scale: 0.95 },
    disabled: { backgroundColor: '#818cf8', opacity: 0.5, boxShadow: 'none' },
  },
  secondary: {
    rest: { backgroundColor: 'transparent', border: '2px solid #06b6d4', color: '#06b6d4' },
    hover: { backgroundColor: '#06b6d4', color: '#fff' },
    tap: { scale: 0.95 },
    disabled: { color: '#94a3b8', borderColor: '#94a3b8', opacity: 0.5 },
  },
}

const Button = React.forwardRef(({ variant = 'primary', disabled=false, className = '', children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={clsx('rounded-md px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 transition-colors', className)}
      variants={variants[variant]}
      initial="rest"
      animate={disabled ? "disabled" : "rest"}
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      {...props}
    >
      {children}
    </motion.button>
  )
})

export default Button
