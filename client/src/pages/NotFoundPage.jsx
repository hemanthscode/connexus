import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-700 space-y-4">
    <h1 className="text-6xl font-bold">404</h1>
    <p className="text-xl">Oops! Page not found.</p>
    <Link
      to="/"
      className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
    >
      Go Home
    </Link>
  </div>
);

export default NotFound;
