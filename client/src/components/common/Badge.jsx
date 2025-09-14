export default function Badge({ count, children, variant = 'unread' }) {
  const colors = {
    unread: 'badge-unread',
    roleAdmin: 'badge-roleAdmin',
    roleMod: 'badge-roleMod',
    roleMember: 'badge-roleMember',
  }

  if (!count) return null

  return (
    <span className={`inline-flex items-center justify-center ${colors[variant]} select-none`}>
      {count > 99 ? '99+' : count}
      {children}
    </span>
  )
}
