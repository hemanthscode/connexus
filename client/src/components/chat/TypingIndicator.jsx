import React from 'react'
import { motion } from 'framer-motion'

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center space-x-1 px-4 py-2 bg-gray-800 rounded max-w-xs"
  >
    {[...Array(3)].map((_, i) => (
      <motion.span
        key={i}
        className="bg-cyan-400 rounded-full w-3 h-3"
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
    <span className="text-gray-400 italic text-xs select-none">Someone is typing...</span>
  </motion.div>
)

export default TypingIndicator
