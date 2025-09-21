import React from 'react'
import clsx from 'clsx'

const Input = React.forwardRef(({ error, className = '', ...props }, ref) => (
  <>
    <input
      ref={ref}
      className={clsx(
        "w-full rounded border border-cyan-500 bg-black bg-opacity-60 p-3 text-cyan-100 placeholder-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400",
        error && "border-red-500 focus:ring-red-500",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </>
))

export default Input
