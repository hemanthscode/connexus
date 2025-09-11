import mongoose from 'mongoose'
import { config } from '../config.js'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'

/**
 * Seed database with demo data
 */
const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI)
    console.log('Connected to MongoDB')
    
    // Clear existing data
    await User.deleteMany({})
    await Conversation.deleteMany({})
    await Message.deleteMany({})
    console.log('Cleared existing data')
    
    // Create demo users (matching frontend mock data)
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        status: 'online'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: 'password123',
        status: 'online'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        status: 'away'
      },
      {
        name: 'Emily Davis',
        email: 'emily@example.com',
        password: 'password123',
        status: 'offline'
      },
      {
        name: 'Alex Chen',
        email: 'alex@example.com',
        password: 'password123',
        status: 'online'
      }
    ])
    
    console.log('Created demo users')
    
    // Create demo conversations
    const conversations = await Conversation.create([
      {
        type: 'direct',
        participants: [
          { user: users[0]._id },
          { user: users[1]._id }
        ],
        createdBy: users[0]._id
      },
      {
        type: 'group',
        name: 'Dev Team',
        participants: [
          { user: users[0]._id, role: 'admin' },
          { user: users[2]._id },
          { user: users[3]._id },
          { user: users[4]._id }
        ],
        createdBy: users[0]._id
      },
      {
        type: 'direct',
        participants: [
          { user: users[0]._id },
          { user: users[3]._id }
        ],
        createdBy: users[0]._id
      },
      {
        type: 'direct',
        participants: [
          { user: users[0]._id },
          { user: users[4]._id }
        ],
        createdBy: users[0]._id
      }
    ])
    
    console.log('Created demo conversations')
    
    // Create demo messages
    const messages = [
      // Conversation 1 (John & Sarah)
      {
        content: "Hey! How's the project coming along?",
        sender: users[1]._id,
        conversation: conversations[0]._id,
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        content: "It's going well! Just finished the authentication module.",
        sender: users[0]._id,
        conversation: conversations[0]._id,
        createdAt: new Date(Date.now() - 7000000)
      },
      {
        content: "That's awesome! Need any help with testing?",
        sender: users[1]._id,
        conversation: conversations[0]._id,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        content: "Actually, yes! Could you review the login flow?",
        sender: users[0]._id,
        conversation: conversations[0]._id,
        createdAt: new Date(Date.now() - 3500000)
      },
      {
        content: "Thanks for the help with the project!",
        sender: users[1]._id,
        conversation: conversations[0]._id,
        createdAt: new Date(Date.now() - 1800000)
      },
      
      // Conversation 2 (Dev Team)
      {
        content: "Morning team! Ready for the sprint planning?",
        sender: users[2]._id,
        conversation: conversations[1]._id,
        createdAt: new Date(Date.now() - 14400000)
      },
      {
        content: "Yes! I have the user stories ready.",
        sender: users[0]._id,
        conversation: conversations[1]._id,
        createdAt: new Date(Date.now() - 14000000)
      },
      {
        content: "Great! I'll share the updated mockups.",
        sender: users[3]._id,
        conversation: conversations[1]._id,
        createdAt: new Date(Date.now() - 10800000)
      },
      {
        content: "Let's schedule the code review for Friday.",
        sender: users[2]._id,
        conversation: conversations[1]._id,
        createdAt: new Date(Date.now() - 3600000)
      },
      
      // More messages for other conversations
      {
        content: "Are we still on for lunch tomorrow?",
        sender: users[3]._id,
        conversation: conversations[2]._id,
        createdAt: new Date(Date.now() - 21600000)
      },
      {
        content: "Absolutely! 12:30 at the usual place?",
        sender: users[0]._id,
        conversation: conversations[2]._id,
        createdAt: new Date(Date.now() - 18000000)
      },
      {
        content: "Perfect! See you tomorrow!",
        sender: users[3]._id,
        conversation: conversations[2]._id,
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        content: "Check out the new dashboard design I just pushed",
        sender: users[0]._id,
        conversation: conversations[3]._id,
        createdAt: new Date(Date.now() - 14400000)
      },
      {
        content: "The new design looks great 👍",
        sender: users[4]._id,
        conversation: conversations[3]._id,
        createdAt: new Date(Date.now() - 10800000)
      }
    ]
    
    await Message.insertMany(messages)
    
    // Update conversation last messages
    for (const conv of conversations) {
      const lastMessage = messages
        .filter(m => m.conversation.equals(conv._id))
        .sort((a, b) => b.createdAt - a.createdAt)[0]
      
      if (lastMessage) {
        await conv.updateLastMessage(lastMessage.content, lastMessage.sender)
      }
    }
    
    console.log('Created demo messages')
    console.log('✅ Database seeded successfully!')
    
    // Display created users
    console.log('\n📋 Demo Users Created:')
    users.forEach(user => {
      console.log(`  👤 ${user.name} (${user.email}) - password: password123`)
    })
    
    console.log('\n📊 Demo Data Summary:')
    console.log(`  👥 Users: ${users.length}`)
    console.log(`  💬 Conversations: ${conversations.length}`)
    console.log(`  💭 Messages: ${messages.length}`)
    
    console.log('\n🚀 Ready to test with Postman!')
    console.log('   Login with any demo user email and password: password123')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

// Run if called directly
if (process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
}

export default seedDatabase
