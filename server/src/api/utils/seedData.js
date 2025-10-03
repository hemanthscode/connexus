import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { config } from '../config/index.js';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
      minPoolSize: config.MONGODB_MIN_POOL_SIZE,
    });
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

/**
 * Clear old data
 */
const clearData = async () => {
  try {
    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

/**
 * Create Indian test users
 */
const createUsers = async () => {
  console.log('👥 Creating Indian test users...');

  const usersData = [
    {
      name: 'Arjun Mehta',
      email: 'arjun@connexus.com',
      password: 'Password123',
      bio: 'Full-stack engineer exploring philosophy & coding 🚀',
      location: 'Bengaluru, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=11',
      socialLinks: new Map([
        ['github', 'https://github.com/arjunmehta'],
        ['linkedin', 'https://linkedin.com/in/arjun-mehta']
      ])
    },
    {
      name: 'Priya Sharma',
      email: 'priya@connexus.com',
      password: 'Password123',
      bio: 'Product designer passionate about simplicity ✨',
      location: 'Mumbai, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    {
      name: 'Rohan Verma',
      email: 'rohan@connexus.com',
      password: 'Password123',
      bio: 'Backend engineer who loves cricket & clean APIs 🏏',
      location: 'Delhi, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=13'
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya@connexus.com',
      password: 'Password123',
      bio: 'AI researcher decoding human creativity 🧠',
      location: 'Chennai, India',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=14'
    },
    {
      name: 'Kabir Nair',
      email: 'kabir@connexus.com',
      password: 'Password123',
      bio: 'DevOps engineer making deployments peaceful ☁️',
      location: 'Pune, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    {
      name: 'Meera Joshi',
      email: 'meera@connexus.com',
      password: 'Password123',
      bio: 'Writer & content strategist weaving stories ✍️',
      location: 'Hyderabad, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=16'
    }
  ];

  const users = [];
  for (const u of usersData) {
    const user = new User(u);
    await user.save();
    users.push(user);
  }

  console.log(`✅ Created ${users.length} Indian users`);
  return users;
};

/**
 * Create conversations
 */
const createConversations = async (users) => {
  console.log('💬 Creating conversations...');

  const conversations = [];

  // Direct: Arjun <-> Priya (philosophical + casual)
  const convo1 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[0]._id, role: 'member' },
      { user: users[1]._id, role: 'member' }
    ],
    createdBy: users[0]._id
  });
  await convo1.save();
  conversations.push(convo1);

  // Group: Tech Thinkers
  const group1 = new Conversation({
    type: 'group',
    name: 'Tech Thinkers 💡',
    description: 'Discussing future of AI, philosophy, and tech',
    participants: [
      { user: users[0]._id, role: 'admin' },
      { user: users[1]._id, role: 'member' },
      { user: users[2]._id, role: 'member' },
      { user: users[3]._id, role: 'member' }
    ],
    createdBy: users[0]._id,
    avatar: 'https://ui-avatars.com/api/?name=Tech+Thinkers&background=9333ea&color=fff'
  });
  await group1.save();
  conversations.push(group1);

  // Group: Writers & Builders
  const group2 = new Conversation({
    type: 'group',
    name: 'Writers & Builders ✍️👩‍💻',
    description: 'A safe place for writers, developers and dreamers',
    participants: [
      { user: users[4]._id, role: 'admin' },
      { user: users[5]._id, role: 'member' },
      { user: users[0]._id, role: 'member' }
    ],
    createdBy: users[4]._id,
    avatar: 'https://ui-avatars.com/api/?name=Writers+Builders&background=16a34a&color=fff'
  });
  await group2.save();
  conversations.push(group2);

  console.log(`✅ Created ${conversations.length} conversations`);
  return conversations;
};

/**
 * Create messages (philosophical + work + casual)
 */
const createMessages = async (conversations, users) => {
  console.log('📝 Creating messages...');

  const messagesData = [
    // Arjun <-> Priya (direct)
    {
      content: 'Priya, do you ever feel like design is less about pixels and more about philosophy of how people see the world?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7200000)
    },
    {
      content: 'Absolutely Arjun! Design is not just what it looks like. It’s how it works, and how it makes people *feel*.',
      sender: users[1]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7000000)
    },

    // Tech Thinkers group
    {
      content: '“Technology is best when it brings people together.” – Matt Mullenweg',
      sender: users[3]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6500000)
    },
    {
      content: 'So true! Imagine AI that enhances empathy rather than replacing humans. 🤖💜',
      sender: users[0]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6300000)
    },
    {
      content: 'I believe the future lies in collaborative intelligence – humans + AI working in harmony.',
      sender: users[2]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6100000)
    },

    // Writers & Builders
    {
      content: 'Writers build with words. Developers build with code. Both create worlds 🌍',
      sender: users[5]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5000000)
    },
    {
      content: 'Kabir here 👋 — pushing new deployment today. May our servers stay calm 🙏😂',
      sender: users[4]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4000000)
    },
    {
      content: 'Meera, your latest article made me rethink how we define productivity. It’s not hours, it’s energy & focus.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3500000)
    }
  ];

  for (const msg of messagesData) {
    const message = new Message(msg);
    await message.save();
  }

  console.log(`✅ Created ${messagesData.length} messages`);
};

/**
 * Run seed
 */
const seedDB = async () => {
  console.log('🌱 Starting Indian seed data...\n');
  try {
    await connectDB();
    await clearData();

    const users = await createUsers();
    const conversations = await createConversations(users);
    await createMessages(conversations, users);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📧 Login emails: arjun@connexus.com, priya@connexus.com, etc.');
    console.log('🔑 Password: Password123');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDB();
