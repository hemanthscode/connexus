// connexus-server/controllers/authController.js
import User from '../models/User.js'
import { generateTokenResponse } from '../utils/generateToken.js'

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' })

    const user = new User({ name, email, password })
    await user.save()

    const tokenResponse = generateTokenResponse(user)
    res.status(201).json({ success: true, message: 'User registered', data: tokenResponse })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))

    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map((e) => e.message).join(', ')
      return res.status(400).json({ success: false, message: msg })
    }
    res.status(500).json({ success: false, message: 'Server error during registration' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Provide email and password' })

    const user = await User.findOne({ email }).select('+password')
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const isMatch = await user.matchPassword(password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    await user.updateLastSeen()
    const tokenResponse = generateTokenResponse(user)
    res.status(200).json({ success: true, message: 'Login successful', data: tokenResponse })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    res.status(500).json({ success: false, message: 'Server error during login' })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.status(200).json({ success: true, data: user.getPublicProfile() })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    res.status(500).json({ success: false, message: 'Server error retrieving profile' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, email, status, avatar } = req.body
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user._id } })
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use' })
    }

    const update = { name, email, status, avatar }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.status(200).json({ success: true, message: 'Profile updated', data: user.getPublicProfile() })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map((e) => e.message).join(', ')
      return res.status(400).json({ success: false, message: msg })
    }
    res.status(500).json({ success: false, message: 'Server error updating profile' })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Provide current and valid new password' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const match = await user.matchPassword(currentPassword)
    if (!match) return res.status(401).json({ success: false, message: 'Current password incorrect' })

    user.password = newPassword
    await user.save()

    res.status(200).json({ success: true, message: 'Password changed' })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    res.status(500).json({ success: false, message: 'Server error changing password' })
  }
}

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { status: 'offline', lastSeen: new Date() })
    res.status(200).json({ success: true, message: 'Logged out' })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    res.status(500).json({ success: false, message: 'Server error during logout' })
  }
}

export default { register, login, getMe, updateProfile, changePassword, logout }
