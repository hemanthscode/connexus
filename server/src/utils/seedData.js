import mongoose from 'mongoose'
import { config } from '../config/index.js'
import User from '../core/models/User.js'
import Conversation from '../core/models/Conversation.js'
import Message from '../core/models/Message.js'

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI)
    console.log('Connected to MongoDB')

    await User.deleteMany({})
    await Conversation.deleteMany({})
    await Message.deleteMany({})
    console.log('Cleared existing data')

    process.exit(0)
  } catch (error) {
    console.error('Error clearing database:', error)
    process.exit(1)
  }
}

// Run the script if executed directly
if (process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
}

export default seedDatabase
