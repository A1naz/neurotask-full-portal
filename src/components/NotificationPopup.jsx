import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const NotificationPopup = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
        className="fixed top-5 right-5 z-50"
      >
        <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center">
          <AlertTriangle className="mr-3" />
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-white">
            <X size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPopup;
