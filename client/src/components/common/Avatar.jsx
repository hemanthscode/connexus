import { useMemo } from 'react'

export default function Avatar({ src, alt, size = 40, status }) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-400',
    offline: 'bg-gray-500',
  }

  // Clean and robust initials extraction
  const initials = useMemo(() => {
    if (!alt) return 'U'
    const nameParts = alt.trim().split(' ').filter(Boolean) // removes extra spaces
    if (nameParts.length === 0) return 'U'
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase() // first two letters if only one name
    }
    // use first letter of first two names
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
  }, [alt])

  // Generate pastel HSL background color based on alt string
  const bgColor = useMemo(() => {
    if (!alt) return 'bg-gray-600'
    let hash = 0
    for (let i = 0; i < alt.length; i++) {
      hash = alt.charCodeAt(i) + ((hash << 5) - hash)
      hash = hash & hash
    }
    const hue = Math.abs(hash) % 360
    return `bg-[hsl(${hue},70%,60%)]`
  }, [alt])

  if (src) {
    return (
      <div
        className="relative inline-block rounded-full select-none"
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={alt || 'User avatar'}
          className="rounded-full object-cover w-full h-full"
          draggable={false}
        />
        {status && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
              statusColors[status] || 'bg-gray-500'
            }`}
            title={`Status: ${status}`}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative inline-flex select-none items-center justify-center rounded-full text-white font-semibold uppercase ${bgColor}`}
      style={{ width: size, height: size, fontSize: size / 2 }}
      title={alt}
      aria-label={`Avatar initials ${initials}`}
    >
      {initials}
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
            statusColors[status] || 'bg-gray-500'
          }`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  )
}
