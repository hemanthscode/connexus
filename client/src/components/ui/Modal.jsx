import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const backdropVariants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

const modalVariants = {
  hidden: { scale: 0.75, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
}

const Modal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="bg-black bg-opacity-70 rounded-xl shadow-lg max-w-lg w-full p-6">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

export default Modal
