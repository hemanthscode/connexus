import React from 'react'
import clsx from 'clsx'

const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={clsx("bg-black bg-opacity-30 backdrop-blur-lg rounded-xl border border-cyan-400/20 shadow-lg", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
