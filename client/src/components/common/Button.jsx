export default function Button({ children, onClick, type = 'button', disabled, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`py-2 px-6 bg-[var(--color-button-bg)] hover:bg-[var(--color-button-bg-hover)] text-white shadow-md rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}
