import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Edit3, ArrowLeft, Camera, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../hooks/useSocket.js'
import api from '../service/api.js'
import { toast } from 'react-hot-toast'

const fallbackAvatar = 'https://ui-avatars.com/api/?background=00ff88&color=000&name='

const ProfilePage = () => {
  const { user, token } = useAuth()
  const { onlineUsers } = useSocket()
  const [profile, setProfile] = useState(null)
  const [isEditing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ name: '', email: '', avatar: '', bio: '' })

  useEffect(() => {
    if (!token) return
    setLoading(true)
    api
      .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setProfile(res.data.data)
        setFormData({
          name: res.data.data.name || '',
          email: res.data.data.email || '',
          avatar: res.data.data.avatar || '',
          bio: res.data.data.bio || ''
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load profile')
        setLoading(false)
      })
  }, [token])

  const isOnline = onlineUsers.has(user?._id)
  const avatarUrl = profile?.avatar || `${fallbackAvatar}${encodeURIComponent(profile?.name || 'User')}`

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put('/auth/me', formData, { headers: { Authorization: `Bearer ${token}` } })
      setProfile(prev => ({ ...prev, ...formData }))
      setEditing(false)
      toast.success('Profile updated successfully! ✨')
    } catch {
      toast.error('Update failed. Please try again.')
    }
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
          <div
            className="w-full h-full opacity-30"
            style={{
              backgroundImage: `linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360], borderColor: ['#00ffff', '#ff00ff', '#ffff00', '#00ffff'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 border-4 border-cyan-400 rounded-full relative z-10"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-full h-full bg-cyan-400/20 rounded-full"
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 136, 0.03) 2px, rgba(0, 255, 136, 0.03) 4px)' }}
          animate={{ y: [-50, 50, -50] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Floating elements */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 border border-cyan-400 bg-cyan-400/20 rotate-45"
          animate={{ y: [-20, -100, -20], x: [0, 30, 0], rotate: [0, 360], scale: [1, 1.3, 1] }}
          transition={{ duration: 6 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 2) * 40}%` }}
        />
      ))}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="backdrop-blur-sm bg-black/80 border border-cyan-400/30 max-w-4xl w-full shadow-2xl relative"
          style={{
            background: 'linear-gradient(145deg, rgba(0,0,0,0.9), rgba(0,20,30,0.9))',
            boxShadow: '0 0 0 1px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2)',
          }}
        >
          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
            <Link to="/chat">
              <motion.div
                whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="p-3 border border-cyan-400/50 bg-black/50 hover:bg-cyan-400/10 transition-all"
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
              >
                <ArrowLeft className="h-5 w-5 text-cyan-400" />
              </motion.div>
            </Link>

            <motion.h1
              className="text-2xl lg:text-4xl font-bold"
              style={{
                background: 'linear-gradient(45deg, #00ffff, #ff00ff, #ffff00)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              NEURAL PROFILE
            </motion.h1>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 font-bold flex items-center gap-2 transition-all ${
                isEditing ? 'border border-red-400/50 text-red-400 hover:bg-red-400/10' : 'border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10'
              }`}
              style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
              onClick={() => setEditing(!isEditing)}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isEditing ? 'CANCEL' : 'EDIT'}</span>
            </motion.button>
          </motion.header>

          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Avatar Section */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative">
                <motion.div
                  className="absolute -inset-3 rounded-full border-2"
                  style={{ borderImage: 'linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff) 1', borderImageSlice: 1 }}
                  animate={{ rotate: 360, borderColor: ['#00ffff', '#ff00ff', '#ffff00', '#00ffff'] }}
                  transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'linear' }, borderColor: { duration: 3, repeat: Infinity } }}
                />
                <motion.div
                  className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-md"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={`${profile.name}'s avatar`}
                    className="h-32 w-32 lg:h-40 lg:w-40 rounded-full object-cover border-2 border-cyan-400/50 relative z-10"
                    style={{ filter: 'contrast(1.2) saturate(1.3)', boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)' }}
                    onError={(e) => {
                      e.currentTarget.src = fallbackAvatar + 'User'
                    }}
                  />
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center cursor-pointer border-2 border-pink-400/50 z-20" style={{ backdropFilter: 'blur(4px)' }}>
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Camera className="h-6 w-6 text-pink-400" />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="absolute -bottom-2 -right-2 z-30">
                  <div
                    className={`px-3 py-1 text-xs font-bold flex items-center gap-1 border ${isOnline ? 'text-green-400 border-green-400' : 'text-gray-400 border-gray-400'}`}
                    style={{
                      clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                      background: isOnline ? 'linear-gradient(45deg, rgba(0, 255, 136, 0.2), rgba(0, 136, 255, 0.2))' : 'rgba(100, 100, 100, 0.2)',
                      boxShadow: isOnline ? '0 0 10px rgba(0, 255, 136, 0.3)' : '0 0 5px rgba(100, 100, 100, 0.2)',
                    }}
                  >
                    <motion.div
                      className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}
                      animate={isOnline ? { scale: [1, 1.3, 1], boxShadow: ['0 0 3px rgba(0, 255, 136, 0.5)', '0 0 8px rgba(0, 255, 136, 0.8)', '0 0 3px rgba(0, 255, 136, 0.5)'] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Form Section */}
            <motion.form onSubmit={handleSubmit} className="flex-1 space-y-6 text-white" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase">
                  <User className="h-4 w-4" />
                  Identity Matrix
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-3 bg-black/50 border border-cyan-400/30 text-cyan-100 backdrop-blur-sm transition-all focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase">
                  <Mail className="h-4 w-4" />
                  Data Stream
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full p-3 bg-black/50 border border-cyan-400/30 text-cyan-100 backdrop-blur-sm transition-all focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))' }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase">
                  <Camera className="h-4 w-4" />
                  Visual Interface
                </label>
                <motion.input
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                  name="avatar"
                  type="url"
                  value={formData.avatar}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="https://cyber.net/avatar.jpg"
                  className="w-full p-3 bg-black/50 border border-cyan-400/30 text-cyan-100 placeholder-gray-500 backdrop-blur-sm transition-all focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))' }}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase">
                  <Edit3 className="h-4 w-4" />
                  Neural Signature
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Describe your digital essence..."
                  className="w-full p-3 bg-black/50 border border-cyan-400/30 text-cyan-100 placeholder-gray-500 backdrop-blur-sm resize-none transition-all focus:border-cyan-400 focus:outline-none disabled:opacity-60"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', background: 'linear-gradient(145deg, rgba(0,0,0,0.8), rgba(0,20,40,0.8))' }}
                />
              </div>

              <AnimatePresence>
                {isEditing && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(0, 255, 136, 0.6)' }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full p-3 font-bold text-green-400 border border-green-400/50 hover:bg-green-400/10 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)', background: 'linear-gradient(145deg, rgba(0, 255, 136, 0.1), rgba(0, 136, 255, 0.1))' }}
                  >
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-cyan-400/20 to-green-400/20" animate={{ x: [-100, 100, -100] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)' }} />
                    <div className="relative z-10 flex items-center gap-2">
                      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Save className="h-5 w-5" />
                      </motion.div>
                      <span>UPLOAD TO MATRIX</span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.form>
          </div>
        </motion.div>
      </div>

      <style>
        {`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
          }

          ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #00ffff, #ff00ff);
            border-radius: 3px;
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default ProfilePage
