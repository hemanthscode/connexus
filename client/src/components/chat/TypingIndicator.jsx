export default function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center space-x-1 bg-gray-300 dark:bg-gray-700 rounded-full px-3 py-1 w-16 justify-center shadow-md"
      aria-label="Typing indicator"
      role="status"
      aria-live="polite"
      style={{ userSelect: 'none' }}
    >
      <span className="typing-dot animate-bounce rounded-full bg-gray-600 dark:bg-gray-300 w-2 h-2" />
      <span className="typing-dot animate-bounce animation-delay-150 rounded-full bg-gray-600 dark:bg-gray-300 w-2 h-2" />
      <span className="typing-dot animate-bounce animation-delay-300 rounded-full bg-gray-600 dark:bg-gray-300 w-2 h-2" />
      <style>
        {`
          .typing-dot {
            display: inline-block;
          }
          .animate-bounce {
            animation: bounce 1.4s infinite ease-in-out;
          }
          .animation-delay-150 {
            animation-delay: 0.15s;
          }
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.6;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}
