import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

import User from '../core/models/User.js'
import Conversation from '../core/models/Conversation.js'
import Message from '../core/models/Message.js'
import { config } from '../config/index.js'

/**
 * Connect to MongoDB using config settings.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
      minPoolSize: config.MONGODB_MIN_POOL_SIZE,
    })
    console.log('Connected to MongoDB for seeding')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

/**
 * Clears all collections related to chat app.
 */
const clearData = async () => {
  await Message.deleteMany({})
  await Conversation.deleteMany({})
  await User.deleteMany({})
  console.log('Cleared existing users, conversations, and messages')
}

/**
 * Create mock users with hashed passwords.
 * Password for all users is 'password123'
 */
const createUsers = async () => {
  const usersData = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      bio: 'Loves chatting!',
      status: 'offline',
      isActive: true,
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      bio: 'Enjoys coding.',
      status: 'offline',
      isActive: true,
    },
    {
      name: 'Charlie Lee',
      email: 'charlie@example.com',
      password: 'password123',
      bio: 'Coffee and tech.',
      status: 'offline',
      isActive: true,
    },
    {
      name: 'David Kim',
      email: 'david@example.com',
      password: 'password123',
      bio: 'Traveler and foodie.',
      status: 'offline',
      isActive: true,
    },
    {
      name: 'Eve Martinez',
      email: 'eve@example.com',
      password: 'password123',
      bio: 'Music and art lover.',
      status: 'offline',
      isActive: true,
    },
  ]

  const users = []
  for (const u of usersData) {
    const user = new User({
      name: u.name,
      email: u.email,
      password: u.password,
      bio: u.bio,
      status: u.status,
      isActive: u.isActive,
    })
    await user.save()
    users.push(user)
  }

  console.log('Created mock users')
  return users
}

/**
 * Create sample conversations (group and direct).
 */
const createConversations = async (users) => {
  // Direct conversation Alice <-> Bob
  const directConvo1 = new Conversation({
    type: 'direct',
    participants: [{ user: users[0]._id }, { user: users[1]._id }],
    createdBy: users[0]._id,
  })
  await directConvo1.save()

  // Group conversation with Alice, Charlie, David
  const groupConvo = new Conversation({
    type: 'group',
    name: 'Project Dev Team',
    description: 'Group for discussing project development',
    participants: [
      { user: users[0]._id, role: 'admin' },
      { user: users[2]._id },
      { user: users[3]._id },
    ],
    createdBy: users[0]._id,
    settings: { allowNewMembers: true, muteNotifications: false },
  })
  await groupConvo.save()

  // Direct conversation Charlie <-> Eve
  const directConvo2 = new Conversation({
    type: 'direct',
    participants: [{ user: users[2]._id }, { user: users[4]._id }],
    createdBy: users[2]._id,
  })
  await directConvo2.save()

  console.log('Created conversations')
  return { directConvo1, groupConvo, directConvo2 }
}

/**
 * Create detailed messages with reactions & read receipts.
 */
const createMessages = async (conversations, users) => {
  // Messages for Alice <-> Bob (directConvo1)
  const msg1 = new Message({
    content: 'Hey Bob! How are you?',
    sender: users[0]._id,
    conversation: conversations.directConvo1._id,
    type: 'text',
    status: 'read',
    readBy: [{ user: users[1]._id, readAt: new Date() }],
  })
  await msg1.save()

  const msg2 = new Message({
    content: 'Hi Alice! I am good, thanks! How about you?',
    sender: users[1]._id,
    conversation: conversations.directConvo1._id,
    type: 'text',
    status: 'read',
    readBy: [{ user: users[0]._id, readAt: new Date() }],
    reactions: [{ user: users[0]._id, emoji: '👍' }],
  })
  await msg2.save()

  // Messages for Project Dev Team group
  const msg3 = new Message({
    content: 'Hello team, please review the latest PR.',
    sender: users[0]._id,
    conversation: conversations.groupConvo._id,
    type: 'text',
    status: 'delivered',
    reactions: [{ user: users[2]._id, emoji: '👀' }],
  })
  await msg3.save()

  const msg4 = new Message({
    content: 'Looks good to me!',
    sender: users[2]._id,
    conversation: conversations.groupConvo._id,
    type: 'text',
    status: 'delivered',
  })
  await msg4.save()

  // Messages for Charlie <-> Eve (directConvo2)
  const msg5 = new Message({
    content: 'Eve, are you coming to the concert next week?',
    sender: users[2]._id,
    conversation: conversations.directConvo2._id,
    type: 'text',
    status: 'sent',
  })
  await msg5.save()

  console.log('Created messages')
}

/**
 * Main seed function to connect, clean, and populate DB.
 */
const seedDB = async () => {
  await connectDB()
  await clearData()
  const users = await createUsers()
  const conversations = await createConversations(users)
  await createMessages(conversations, users)
  console.log('Database seeding completed successfully.')
  process.exit(0)
}

seedDB()
