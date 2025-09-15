import clsx from 'clsx'

const COLORS = {
  unread: 'badge-unread',
  roleAdmin: 'badge-roleAdmin',
  roleMod: 'badge-roleMod',
  roleMember: 'badge-roleMember',
}

export default function Badge({ count, children, variant = 'unread', className = '', ...props }) {
  if (!count) return null

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold select-none',
        COLORS[variant] || COLORS.unread,
        className
      )}
      {...props}
    >
      {count > 99 ? '99+' : count}
      {children}
    </span>
  )
}
