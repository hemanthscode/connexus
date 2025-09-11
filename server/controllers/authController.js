import User from '../models/User.js'
import { generateTokenResponse } from '../utils/generateToken.js'

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      })
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }
    
    // Create user in database
    const user = new User({
      name,
      email,
      password
    })
    
    await user.save()
    
    // Generate token response
    const tokenResponse = generateTokenResponse(user)
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: tokenResponse
    })
    
  } catch (error) {
    console.error('Register error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ')
      return res.status(400).json({
        success: false,
        message
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    })
  }
}

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }
    
    // Check for user (include password for verification)
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }
    
    // Check password
    const isMatch = await user.matchPassword(password)
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Update last seen in database
    await user.updateLastSeen()
    
    // Generate token response
    const tokenResponse = generateTokenResponse(user)
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: tokenResponse
    })
    
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    })
  }
}

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: user.getPublicProfile()
    })
  } catch (error) {
    console.error('GetMe error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error getting user profile'
    })
  }
}

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, status, avatar } = req.body
    
    // Build update object with only provided fields
    const updateFields = {}
    if (name) updateFields.name = name
    if (email) updateFields.email = email
    if (status) updateFields.status = status
    if (avatar !== undefined) updateFields.avatar = avatar
    
    // Check if email is being changed and already exists
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      })
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        })
      }
    }
    
    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    )
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    })
    
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ')
      return res.status(400).json({
        success: false,
        message
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    })
  }
}

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      })
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      })
    }
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Check current password
    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }
    
    // Update password in database
    user.password = newPassword
    await user.save()
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    })
    
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    })
  }
}

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // Update user status to offline in database
    await User.findByIdAndUpdate(req.user._id, { 
      status: 'offline',
      lastSeen: new Date()
    })
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    })
  }
}

export default {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
}
