import { useMemo } from 'react'

export default function Avatar({ src, alt, size = 40, status }) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-400',
    offline: 'bg-gray-400',
  }

  const initials = useMemo(() => {
    if (!alt) return 'U'
    const parts = alt.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [alt])

  if (src) {
    return (
      <div className="relative rounded-full overflow-hidden" style={{ width: size, height: size }}>
        <img src={src} alt={alt || 'User avatar'} className="w-full h-full object-cover" draggable={false} />
        {status && <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[status]}`} title={status} />}
      </div>
    )
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold uppercase"
      style={{ width: size, height: size, fontSize: size / 2 }}
      aria-label={alt}
      title={alt}
    >
      {initials}
      {status && <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[status]}`} title={status} />}
    </div>
  )
}
