import { useState, useRef, useEffect } from 'react'
import { LucideSend } from 'lucide-react'
import { useChat } from '../../contexts/ChatContext.jsx'
import { debounce } from '../../utils/debounce.js'
import clsx from 'clsx'

export default function MessageInput({ sendMessage }) {
  const [input, setInput] = useState('')
  const inputRef = useRef()
  const { markTyping } = useChat()
  const debouncedTyping = debounce(() => markTyping(false), 1000)

  useEffect(() => {
    if (input.trim()) {
      markTyping(true)
      debouncedTyping()
    } else {
      markTyping(false)
    }
  }, [input])

  const onSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
    markTyping(false)
  }

  return (
    <form
      onSubmit={onSend}
      className="flex items-center gap-3 border-t border-gray-300 bg-[var(--color-background-light)]  p-3"
      autoComplete="off"
      role="search"
      aria-label="Send message form"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Type a message..."
        className={clsx(
          'flex-1 rounded-full border px-6 py-3 text-[var(--color-text-dark)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition',
          'border-gray-300 dark:border-gray-600  dark:text-white'
        )}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="Message input"
      />
      <button
        type="submit"
        aria-label="Send message"
        className="p-3 bg-[var(--color-primary)] text-white rounded-full hover:bg-[var(--color-primary-hover)] transition shadow-md"
      >
        <LucideSend size={20} />
      </button>
    </form>
  )
}
