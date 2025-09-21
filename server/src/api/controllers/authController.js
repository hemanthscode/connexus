import {
  registerUser,
  loginUser,
  changeUserPassword,
  logoutUser,
} from '../../core/services/authService.js'

import { getUserProfile, updateUserProfile } from '../../core/services/userService.js'

import Joi from 'joi'

const registerSchema = Joi.object({
  name: Joi.string().max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
})

/**
 * Register route handler
 */
export const register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }

    const { name, email, password } = req.body
    const tokenResponse = await registerUser({ name, email, password })
    res.status(201).json({ success: true, message: 'User registered', data: tokenResponse })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: 'Server error during registration' })
  }
}

/**
 * Login route handler
 */
export const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }

    const { email, password } = req.body
    const tokenResponse = await loginUser({ email, password })
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: tokenResponse,
    })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.statusCode === 401) {
      return res.status(401).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: 'Server error during login' })
  }
}

/**
 * Get authenticated user's profile
 */
export const getMe = async (req, res) => {
  try {
    const profile = await getUserProfile(req.user._id)
    res.status(200).json({ success: true, data: profile })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: 'Server error retrieving profile' })
  }
}

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, status, avatar } = req.body

    const updatedProfile = await updateUserProfile(req.user._id, { name, email, status, avatar })
    res.status(200).json({ success: true, message: 'Profile updated', data: updatedProfile })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: 'Server error updating profile' })
  }
}

/**
 * Change password handler
 */
export const changePassword = async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { currentPassword, newPassword } = req.body
    await changeUserPassword(req.user._id, currentPassword, newPassword)
    res.status(200).json({ success: true, message: 'Password changed' })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    if (error.statusCode === 401 || error.statusCode === 404) {
      return res.status(error.statusCode).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: 'Server error changing password' })
  }
}

/**
 * Logout handler
 */
export const logout = async (req, res) => {
  try {
    await logoutUser(req.user._id)
    res.status(200).json({ success: true, message: 'Logged out' })
  } catch (error) {
    console.error(JSON.stringify({ message: error.message, stack: error.stack }))
    res.status(500).json({ success: false, message: 'Server error during logout' })
  }
}

export default {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
}
