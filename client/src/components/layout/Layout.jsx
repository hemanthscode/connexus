import React from 'react';

const Layout = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-gray-100 flex items-center justify-center p-6"
      style={{ height: '100vh' }}
    >
      <div
        className="w-full max-w-7xl h-full rounded-3xl bg-white bg-opacity-60 backdrop-blur-md shadow-xl flex overflow-hidden"
        role="main"
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
