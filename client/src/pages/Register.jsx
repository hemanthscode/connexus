// src/pages/Register.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await register(name, email, password)
    if (!res.success) {
      setError(res.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-backgroundLight dark:bg-backgroundDark">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-md shadow-md w-full max-w-md space-y-6"
        aria-label="Registration form"
      >
        <h2 className="text-3xl font-bold text-primary dark:text-primaryHover text-center uppercase">Register</h2>
        {error && <p className="text-red-600">{error}</p>}
        <input
          type="text"
          required
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
          autoComplete="name"
          disabled={loading}
          aria-label="Full Name"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
          autoComplete="email"
          disabled={loading}
          aria-label="Email"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
          autoComplete="new-password"
          disabled={loading}
          aria-label="Password"
        />
        <button
          type="submit"
          className="w-full py-3 bg-primary text-white font-semibold rounded hover:bg-primaryHover transition disabled:opacity-50"
          disabled={loading}
          aria-label="Register"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
