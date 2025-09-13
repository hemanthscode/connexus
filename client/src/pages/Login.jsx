import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('john@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await login(email, password)
    if (!res.success) {
      setError(res.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md space-y-6 shadow-lg"
        aria-label="Login form"
      >
        <h2 className="text-3xl text-teal-600 font-bold text-center uppercase">Connexus Login</h2>
        {error && <p className="text-red-600 text-center">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded border border-gray-300 dark:border-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          autoComplete="username"
          disabled={loading}
          aria-required="true"
          aria-label="Email"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded border border-gray-300 dark:border-slate-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          autoComplete="current-password"
          disabled={loading}
          aria-required="true"
          aria-label="Password"
        />
        <button
          type="submit"
          className="w-full py-3 bg-teal-500 text-white rounded font-semibold tracking-wider shadow hover:bg-teal-600 transition disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
          aria-label="Log in"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="text-red-600 text-center">{error}</p>}
        <p className="text-center text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-teal-600 hover:underline">
            Register
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
