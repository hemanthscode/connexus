import React, { useState, useMemo } from 'react';

const Avatar = ({ src, alt = 'User Avatar', size = 40, initials, isOnline = false }) => {
  const [hasError, setHasError] = useState(false);

  const displayInitials = useMemo(() => {
    if (initials) return initials;
    if (!alt) return '';
    const parts = alt.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [initials, alt]);

  const sizeClass = {
    24: 'w-6 h-6',
    32: 'w-8 h-8',
    40: 'w-10 h-10',
    48: 'w-12 h-12',
  }[size] || 'w-10 h-10';

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-indigo-700 text-white font-semibold flex items-center justify-center rounded-full select-none relative ${sizeClass}`}
      >
        <span>{displayInitials}</span>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeClass}`}
        loading="lazy"
        width={size}
        height={size}
        onError={() => setHasError(true)}
        decoding="async"
        fetchPriority="low"
      />
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

export default Avatar;
