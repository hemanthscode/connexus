export default function Badge({ count, children, variant = 'unread' }) {
  // variant: 'unread' (red/green badge), 'role' (colored role badges)
  const variantColors = {
    unread: 'bg-[#39FF14] text-black',
    roleAdmin: 'bg-red-600 text-white',
    roleMod: 'bg-yellow-500 text-black',
    roleMember: 'bg-gray-600 text-white',
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold'

  const classes = {
    unread: variantColors.unread,
    roleAdmin: variantColors.roleAdmin,
    roleMod: variantColors.roleMod,
    roleMember: variantColors.roleMember,
  }[variant] || variantColors.unread

  if (!count) return null

  return (
    <span className={`${baseClasses} ${classes}`}>
      {count > 99 ? '99+' : count}
      {children}
    </span>
  )
}
