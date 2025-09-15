// connexus-server/models/User.js
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 50, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide valid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: null },
    status: { type: String, enum: ['online', 'away', 'offline'], default: 'online' },
    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getPublicProfile = function () {
  const user = this.toObject()
  delete user.password
  delete user.__v
  return user
}

userSchema.methods.updateLastSeen = function () {
  this.lastSeen = new Date()
  return this.save({ validateBeforeSave: false })
}

export default mongoose.model('User', userSchema)
