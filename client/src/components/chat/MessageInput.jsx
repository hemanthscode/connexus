import { useState, useRef } from 'react'
import { LucideSend } from 'lucide-react'

export default function MessageInput({ sendMessage }) {
  const [input, setInput] = useState('')
  const inputRef = useRef()

  const onSend = e => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={onSend}
      className="flex items-center gap-3 border-t border-gray-300 bg-white p-3"
      autoComplete="off"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Type a message..."
        className="flex-1 rounded-full border border-gray-300 px-6 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button
        type="submit"
        aria-label="Send message"
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-md"
      >
        <LucideSend size={20} />
      </button>
    </form>
  )
}
