import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex justify-between items-center bg-white p-4 border-b border-gray-300 shadow-sm">
      <Link
        to="/"
        className="text-2xl font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        aria-label="Home"
      >
        Connexus
      </Link>

      {user && (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium truncate max-w-xs" title={user.name}>
            {user.name}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
