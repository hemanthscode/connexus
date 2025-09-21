import React from 'react'

const Avatar = ({ src, name, size = 'w-10 h-10', className = '' }) => {
  const initials = !name ? '' : name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div
      className={`bg-cyan-400 text-black flex items-center justify-center font-bold rounded-full ${size} ${className}`}
      style={{ userSelect: "none" }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className={`object-cover rounded-full ${size}`}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <span>?</span>
      )}
    </div>
  )
}

export default Avatar
