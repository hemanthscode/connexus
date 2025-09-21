import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, MessageCircle } from 'lucide-react'
import api from '../service/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-hot-toast'

const RegisterPage = () => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      toast.success('Registration successful! Logging in...')
      // Auto login after registration
      await login(formData.email, formData.password)
    } catch (err) {
      toast.error(err.response?.data.message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card-glass p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MessageCircle className="h-12 w-12 text-neon-purple neon-glow" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Connexus</h1>
            <p className="text-gray-300">Create your account to start chatting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-glass pl-10"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
export default RegisterPage
