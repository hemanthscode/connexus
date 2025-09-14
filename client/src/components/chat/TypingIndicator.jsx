export default function TypingIndicator({ users }) {
  if (!users.length) return null
  const names = users.map(u => u.userName).join(', ')
  return (
    <div className="px-2 py-1 text-sm italic text-blue-600" aria-live="polite" role="status">
      {names} {users.length === 1 ? 'is' : 'are'} typing...
    </div>
  )
}
