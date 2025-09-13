export default function TypingIndicator({ users }) {
  if (!users.length) return null
  const names = users.map(u => u.userName).join(', ')
  return (
    <div className="text-teal-500 text-sm italic px-2" aria-live="polite" role="status">
      {names} {users.length === 1 ? 'is' : 'are'} typing...
    </div>
  )
}
