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

  const handleSubmit = async e => {
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/30 backdrop-blur-md rounded-lg p-8 w-full max-w-md space-y-6 shadow-lg"
      >
        <h2 className="text-3xl text-[#39FF14] font-bold text-center uppercase">Register</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <input
          type="text"
          required
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded bg-black/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] text-white"
          autoComplete="name"
          disabled={loading}
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded bg-black/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] text-white"
          autoComplete="email"
          disabled={loading}
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded bg-black/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39FF14] text-white"
          autoComplete="new-password"
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full py-3 bg-[#39FF14] text-black rounded font-semibold tracking-wider shadow hover:bg-[#2AC10B] transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#39FF14] hover:underline">
            Login
          </Link>
        </p>
      </motion.form>
    </div>
  )
}
