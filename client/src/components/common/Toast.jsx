import React from 'react';
import { Toaster } from 'react-hot-toast';

const Toast = () => (
  <Toaster
    position="top-center"
    reverseOrder={false}
    gutter={8}
    containerClassName="pointer-events-none"
    toastOptions={{
      className: 'bg-indigo-900 text-white rounded-xl px-6 py-4 shadow-lg select-none',
      success: {
        iconTheme: {
          primary: 'white',
          secondary: 'transparent',
        },
      },
      error: {
        iconTheme: {
          primary: 'white',
          secondary: 'transparent',
        },
      },
      duration: 4000,
      style: {
        fontWeight: '600',
      },
    }}
  />
);

export default Toast;
