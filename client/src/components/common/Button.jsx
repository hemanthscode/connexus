export default function Button({ children, onClick, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="py-3 px-5 bg-[#39FF14] rounded font-semibold text-black hover:bg-[#2AC10B] transition disabled:opacity-60"
    >
      {children}
    </button>
  )
}
