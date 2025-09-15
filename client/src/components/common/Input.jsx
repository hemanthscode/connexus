import clsx from 'clsx'

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  name,
  className = '',
  ...props
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={autoComplete}
      className={clsx(
        'w-full rounded border border-gray-300 px-4 py-3 text-[var(--color-text-dark)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
}
