import React, { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
      document.body.style.overflow = 'hidden';

      const preventScroll = (e) => e.preventDefault();
      window.addEventListener('touchmove', preventScroll, { passive: false });

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={modalRef}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg outline-none"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>}
        {children}
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
