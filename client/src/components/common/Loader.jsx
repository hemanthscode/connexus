import React from 'react';

const Loader = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading"
    className="flex justify-center items-center p-4"
  >
    <span className="inline-block h-8 w-8 rounded-full border-4 border-t-indigo-700 border-gray-300 animate-spin" />
  </div>
);

export default Loader;
