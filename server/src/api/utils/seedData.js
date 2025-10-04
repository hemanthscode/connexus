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
 * Create users with Telugu names
 */
const createUsers = async () => {
  console.log('👥 Creating users...');

  const usersData = [
    {
      name: 'Aadhya',
      email: 'aadhya@connexus.com',
      password: 'Password123',
      bio: 'Sunset chaser 🌅 | Finding magic in everyday moments',
      location: 'Visakhapatnam, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    {
      name: 'Sai',
      email: 'sai@connexus.com',
      password: 'Password123',
      bio: 'Books, coffee & long conversations ☕📚',
      location: 'Hyderabad, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    {
      name: 'Nithya',
      email: 'nithya@connexus.com',
      password: 'Password123',
      bio: 'Dancing through life | Classical music lover 🎶',
      location: 'Vijayawada, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=9'
    },
    {
      name: 'Ravi',
      email: 'ravi@connexus.com',
      password: 'Password123',
      bio: 'Wanderer seeking stories in every corner 🎒',
      location: 'Warangal, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    {
      name: 'Kavya',
      email: 'kavya@connexus.com',
      password: 'Password123',
      bio: 'Poetry in motion | Tea over everything ☕✨',
      location: 'Guntur, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=10'
    },
    {
      name: 'Aditya',
      email: 'aditya@connexus.com',
      password: 'Password123',
      bio: 'Mountain trails & starlit nights 🏔️⭐',
      location: 'Tirupati, India',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=13'
    },
    {
      name: 'Meera',
      email: 'meera@connexus.com',
      password: 'Password123',
      bio: 'Cooking, gardening & finding peace 🌿🍲',
      location: 'Kakinada, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=16'
    },
    {
      name: 'Pranav',
      email: 'pranav@connexus.com',
      password: 'Password123',
      bio: 'Film buff | Exploring life one frame at a time 🎬',
      location: 'Nellore, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=11'
    }
  ];

  const users = [];
  for (const u of usersData) {
    const user = new User(u);
    await user.save();
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);
  return users;
};

/**
 * Create conversations
 */
const createConversations = async (users) => {
  console.log('💬 Creating conversations...');

  const conversations = [];

  // Direct: Aadhya <-> Sai (books & life)
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

  // Direct: Nithya <-> Ravi (travel & music)
  const convo2 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[2]._id, role: 'member' },
      { user: users[3]._id, role: 'member' }
    ],
    createdBy: users[2]._id
  });
  await convo2.save();
  conversations.push(convo2);

  // Group: Book Club 📚
  const group1 = new Conversation({
    type: 'group',
    name: 'Book Lovers 📚',
    description: 'Stories that changed us, pages that moved us',
    participants: [
      { user: users[1]._id, role: 'admin' },
      { user: users[0]._id, role: 'member' },
      { user: users[4]._id, role: 'member' },
      { user: users[7]._id, role: 'member' }
    ],
    createdBy: users[1]._id,
    avatar: 'https://ui-avatars.com/api/?name=Book+Lovers&background=d97706&color=fff'
  });
  await group1.save();
  conversations.push(group1);

  // Group: Weekend Wanderers 🏔️
  const group2 = new Conversation({
    type: 'group',
    name: 'Weekend Wanderers 🏔️',
    description: 'For those who live for the next adventure',
    participants: [
      { user: users[3]._id, role: 'admin' },
      { user: users[0]._id, role: 'member' },
      { user: users[5]._id, role: 'member' },
      { user: users[2]._id, role: 'member' }
    ],
    createdBy: users[3]._id,
    avatar: 'https://ui-avatars.com/api/?name=Weekend+Wanderers&background=0891b2&color=fff'
  });
  await group2.save();
  conversations.push(group2);

  // Group: Food & Soul 🍲
  const group3 = new Conversation({
    type: 'group',
    name: 'Food & Soul 🍲',
    description: 'Recipes, stories, and everything delicious',
    participants: [
      { user: users[6]._id, role: 'admin' },
      { user: users[4]._id, role: 'member' },
      { user: users[1]._id, role: 'member' }
    ],
    createdBy: users[6]._id,
    avatar: 'https://ui-avatars.com/api/?name=Food+Soul&background=dc2626&color=fff'
  });
  await group3.save();
  conversations.push(group3);

  console.log(`✅ Created ${conversations.length} conversations`);
  return conversations;
};

/**
 * Create meaningful messages about life, experiences, hobbies
 */
const createMessages = async (conversations, users) => {
  console.log('📝 Creating messages...');

  const messagesData = [
    // Aadhya <-> Sai (books & life philosophy)
    {
      content: 'Sai! I just finished "The Alchemist" and I can\'t stop thinking about it. Have you read it?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7200000)
    },
    {
      content: 'Oh yes! That book changed how I see my own journey. "When you want something, the universe conspires in helping you achieve it" 💫',
      sender: users[1]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7100000)
    },
    {
      content: 'Exactly! Sometimes I wonder if we\'re all just following our Personal Legends without realizing it',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7000000)
    },
    {
      content: 'The beauty is in the journey, not just the destination. Every person we meet teaches us something',
      sender: users[1]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6900000)
    },

    // Nithya <-> Ravi (travel & experiences)
    {
      content: 'Ravi, remember that sunrise at Araku Valley? I still have goosebumps thinking about it 🌄',
      sender: users[2]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6500000)
    },
    {
      content: 'How can I forget! The mist, the coffee plantations, and that tiny roadside chai stall... pure magic ☕',
      sender: users[3]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 6400000)
    },
    {
      content: 'The best trips aren\'t about the destinations but the conversations we have along the way',
      sender: users[2]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6300000)
    },
    {
      content: 'Speaking of which, thinking about Hampi next month. Sunrise over the ruins? Count you in?',
      sender: users[3]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6200000)
    },

    // Book Lovers group
    {
      content: 'Question for everyone: What\'s a book that made you cry? For me, it\'s "The Kite Runner" 😢',
      sender: users[1]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5500000)
    },
    {
      content: 'Oh Sai, that book broke me. "For you, a thousand times over" still gives me chills',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [
        { user: users[1]._id, emoji: '💔', timestamp: new Date() },
        { user: users[4]._id, emoji: '😭', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 5400000)
    },
    {
      content: 'For me it was "A Thousand Splendid Suns". The resilience of those women... unforgettable',
      sender: users[4]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5300000)
    },
    {
      content: 'Recently read "When Breath Becomes Air". It\'s about a doctor facing mortality. Left me speechless.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5200000)
    },
    {
      content: 'These books remind us how precious and fragile life is. Makes me want to live more intentionally 🌸',
      sender: users[1]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5100000)
    },

    // Weekend Wanderers
    {
      content: 'Who\'s up for a trek to Horsley Hills this weekend? Need to escape the city noise 🏔️',
      sender: users[3]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4800000)
    },
    {
      content: 'Count me in! I need some mountain air and silence. My soul is craving it',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4700000)
    },
    {
      content: 'Yes please! Can we camp under the stars? I miss lying down and just watching the universe',
      sender: users[0]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [
        { user: users[3]._id, emoji: '⭐', timestamp: new Date() },
        { user: users[5]._id, emoji: '✨', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 4600000)
    },
    {
      content: 'Perfect! Let\'s carry guitars and have a jam session by the bonfire 🎸🔥',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4500000)
    },
    {
      content: 'This is why I love this group. Simple joys, good company, and nature. Nothing else matters.',
      sender: users[3]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4400000)
    },

    // Food & Soul
    {
      content: 'Made my grandmother\'s gongura pickle today. The smell took me back to my childhood 🥺💚',
      sender: users[6]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      content: 'Meera! There\'s nothing like traditional recipes. They carry memories, love, and heritage in every bite',
      sender: users[4]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3500000)
    },
    {
      content: 'My amma\'s pesarattu with ginger chutney on rainy mornings... heaven on earth ☕🌧️',
      sender: users[1]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3400000)
    },
    {
      content: 'You guys are making me homesick! Food isn\'t just about taste, it\'s about the hands that made it with love',
      sender: users[4]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [
        { user: users[6]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[1]._id, emoji: '💚', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 3300000)
    },
    {
      content: 'Next Sunday, potluck at my place? Everyone brings a dish that reminds them of home 🏡🍲',
      sender: users[6]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [
        { user: users[4]._id, emoji: '🎉', timestamp: new Date() },
        { user: users[1]._id, emoji: '😍', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 3200000)
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
  console.log('🌱 Starting database seed...\n');
  try {
    await connectDB();
    await clearData();

    const users = await createUsers();
    const conversations = await createConversations(users);
    await createMessages(conversations, users);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📧 Login emails: aadhya@connexus.com, sai@connexus.com, nithya@connexus.com, etc.');
    console.log('🔑 Password: Password123');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDB();