import User from '../models/User.js'

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user.getPublicProfile()
}

/**
 * Update user profile with new data
 */
export const updateUserProfile = async (userId, updateData) => {
  const { email } = updateData
  if (email) {
    const exists = await User.findOne({ email, _id: { $ne: userId } })
    if (exists) {
      const error = new Error('Email already in use')
      error.statusCode = 400
      throw error
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  return user.getPublicProfile()
}
