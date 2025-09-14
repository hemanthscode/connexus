export default function Input({ type = 'text', value, onChange, placeholder, disabled, autoComplete, name }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className="w-full rounded border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
    />
  )
}
