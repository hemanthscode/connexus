export default function Input({ type, value, onChange, placeholder, disabled, autoComplete }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className="w-full px-4 py-3 rounded bg-black/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] text-white"
    />
  )
}
