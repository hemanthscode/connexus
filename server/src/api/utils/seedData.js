import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { config } from '../config/index.js';

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
    });
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};

/**
 * Clears all collections related to chat app.
 */
const clearData = async () => {
  try {
    await Promise.all([
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data (users, conversations, messages)');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

/**
 * Create comprehensive mock users with varied profiles
 * Default password for all users is 'password123'
 */
const createUsers = async () => {
  console.log('👥 Creating test users...');
  
  const usersData = [
    {
      name: 'Alice Johnson',
      email: 'alice@connexus.com',
      password: 'password123',
      bio: 'Full-stack developer who loves React and Node.js 🚀',
      location: 'San Francisco, CA',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=1',
      socialLinks: new Map([
        ['github', 'https://github.com/alice'],
        ['linkedin', 'https://linkedin.com/in/alice-johnson']
      ])
    },
    {
      name: 'Bob Smith',
      email: 'bob@connexus.com',
      password: 'password123',
      bio: 'Backend engineer passionate about APIs and databases 💻',
      location: 'New York, NY',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=2',
      socialLinks: new Map([
        ['twitter', 'https://twitter.com/bobsmith'],
        ['github', 'https://github.com/bobsmith']
      ])
    },
    {
      name: 'Charlie Wilson',
      email: 'charlie@connexus.com',
      password: 'password123',
      bio: 'UI/UX Designer creating beautiful user experiences ✨',
      location: 'Austin, TX',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=3',
      socialLinks: new Map([
        ['dribbble', 'https://dribbble.com/charlie'],
        ['behance', 'https://behance.net/charlie']
      ])
    },
    {
      name: 'Diana Chen',
      email: 'diana@connexus.com',
      password: 'password123',
      bio: 'DevOps engineer and cloud architecture enthusiast ☁️',
      location: 'Seattle, WA',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=4',
      socialLinks: new Map([
        ['linkedin', 'https://linkedin.com/in/diana-chen'],
        ['medium', 'https://medium.com/@diana']
      ])
    },
    {
      name: 'Eve Martinez',
      email: 'eve@connexus.com',
      password: 'password123',
      bio: 'Product manager turning ideas into amazing products 🎯',
      location: 'Los Angeles, CA',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=5',
      socialLinks: new Map([
        ['twitter', 'https://twitter.com/evemartinez'],
        ['linkedin', 'https://linkedin.com/in/eve-martinez']
      ])
    },
    {
      name: 'Frank Thompson',
      email: 'frank@connexus.com',
      password: 'password123',
      bio: 'Security specialist keeping applications safe 🔒',
      location: 'Chicago, IL',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=6'
    },
    {
      name: 'Grace Kim',
      email: 'grace@connexus.com',
      password: 'password123',
      bio: 'Data scientist who loves ML and analytics 📊',
      location: 'Boston, MA',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=7'
    },
    {
      name: 'Henry Davis',
      email: 'henry@connexus.com',
      password: 'password123',
      bio: 'Mobile app developer for iOS and Android 📱',
      location: 'Portland, OR',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pravatar.cc/150?img=8'
    }
  ];

  const users = [];
  let userCount = 0;
  
  for (const userData of usersData) {
    try {
      const user = new User(userData);
      await user.save();
      users.push(user);
      userCount++;
      
      // Progress indicator
      process.stdout.write(`\r   Created ${userCount}/${usersData.length} users`);
    } catch (error) {
      console.error(`\n❌ Error creating user ${userData.name}:`, error.message);
    }
  }
  
  console.log(`\n✅ Created ${userCount} test users`);
  return users;
};

/**
 * Create diverse conversations (direct chats and groups)
 */
const createConversations = async (users) => {
  console.log('💬 Creating conversations...');
  
  const conversations = [];
  
  try {
    // Direct conversation: Alice <-> Bob
    const directConvo1 = new Conversation({
      type: 'direct',
      participants: [
        { user: users[0]._id, role: 'member', lastRead: new Date(Date.now() - 3600000) },
        { user: users[1]._id, role: 'member', lastRead: new Date(Date.now() - 1800000) }
      ],
      createdBy: users[0]._id,
      isActive: true,
      lastMessage: {
        content: 'Hey Bob! How are you doing?',
        sender: users[0]._id,
        timestamp: new Date(Date.now() - 900000)
      }
    });
    await directConvo1.save();
    conversations.push(directConvo1);

    // Group: Project Development Team
    const devTeamGroup = new Conversation({
      type: 'group',
      name: 'Project Dev Team 🚀',
      description: 'Main development team for the new project launch',
      participants: [
        { user: users[0]._id, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 7) },
        { user: users[1]._id, role: 'moderator', joinedAt: new Date(Date.now() - 86400000 * 6) },
        { user: users[2]._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 5) },
        { user: users[3]._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 4) }
      ],
      createdBy: users[0]._id,
      avatar: 'https://ui-avatars.com/api/?name=Dev+Team&background=6366f1&color=fff',
      settings: {
        allowNewMembers: true,
        muteNotifications: false,
        archived: false
      },
      lastMessage: {
        content: 'Great work on the API endpoints everyone!',
        sender: users[1]._id,
        timestamp: new Date(Date.now() - 300000)
      }
    });
    await devTeamGroup.save();
    conversations.push(devTeamGroup);

    // Group: Design Team
    const designTeam = new Conversation({
      type: 'group',
      name: 'Design Team ✨',
      description: 'UI/UX design discussions and reviews',
      participants: [
        { user: users[2]._id, role: 'admin', joinedAt: new Date(Date.now() - 86400000 * 10) },
        { user: users[4]._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 8) },
        { user: users[0]._id, role: 'member', joinedAt: new Date(Date.now() - 86400000 * 3) }
      ],
      createdBy: users[2]._id,
      avatar: 'https://ui-avatars.com/api/?name=Design+Team&background=f59e0b&color=fff',
      settings: {
        allowNewMembers: true,
        muteNotifications: false,
        archived: false
      }
    });
    await designTeam.save();
    conversations.push(designTeam);

    // Direct conversation: Charlie <-> Diana
    const directConvo2 = new Conversation({
      type: 'direct',
      participants: [
        { user: users[2]._id, role: 'member' },
        { user: users[3]._id, role: 'member' }
      ],
      createdBy: users[2]._id,
      lastMessage: {
        content: 'Can you review the deployment pipeline?',
        sender: users[2]._id,
        timestamp: new Date(Date.now() - 7200000)
      }
    });
    await directConvo2.save();
    conversations.push(directConvo2);

    // Direct conversation: Eve <-> Frank
    const directConvo3 = new Conversation({
      type: 'direct',
      participants: [
        { user: users[4]._id, role: 'member' },
        { user: users[5]._id, role: 'member' }
      ],
      createdBy: users[4]._id
    });
    await directConvo3.save();
    conversations.push(directConvo3);

    // Group: Security Team
    const securityTeam = new Conversation({
      type: 'group',
      name: 'Security Team 🔒',
      description: 'Security reviews and vulnerability assessments',
      participants: [
        { user: users[5]._id, role: 'admin' },
        { user: users[1]._id, role: 'member' },
        { user: users[3]._id, role: 'member' }
      ],
      createdBy: users[5]._id,
      avatar: 'https://ui-avatars.com/api/?name=Security+Team&background=dc2626&color=fff'
    });
    await securityTeam.save();
    conversations.push(securityTeam);

    console.log(`✅ Created ${conversations.length} conversations`);
    return conversations;
  } catch (error) {
    console.error('❌ Error creating conversations:', error);
    throw error;
  }
};

/**
 * Create realistic messages with various features
 */
const createMessages = async (conversations, users) => {
  console.log('📝 Creating messages...');
  
  let messageCount = 0;
  const messages = [];

  try {
    // Messages for Alice <-> Bob (Direct)
    const aliceBobMessages = [
      {
        content: 'Hey Bob! How are you doing? Ready for the new project?',
        sender: users[0]._id,
        conversation: conversations[0]._id,
        type: 'text',
        status: 'read',
        readBy: [{ user: users[1]._id, readAt: new Date(Date.now() - 3000000) }],
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        content: 'Hi Alice! I\'m doing great, thanks! 😊 Really excited about the project. I\'ve been reviewing the requirements.',
        sender: users[1]._id,
        conversation: conversations[0]._id,
        type: 'text',
        status: 'read',
        readBy: [{ user: users[0]._id, readAt: new Date(Date.now() - 2700000) }],
        reactions: [{ user: users[0]._id, emoji: '👍', timestamp: new Date(Date.now() - 2600000) }],
        createdAt: new Date(Date.now() - 7000000)
      },
      {
        content: 'Perfect! I was thinking we should start with the API architecture. What do you think?',
        sender: users[0]._id,
        conversation: conversations[0]._id,
        type: 'text',
        status: 'read',
        readBy: [{ user: users[1]._id, readAt: new Date(Date.now() - 2400000) }],
        createdAt: new Date(Date.now() - 6800000)
      },
      {
        content: 'Absolutely! I can handle the user authentication and you could work on the chat functionality?',
        sender: users[1]._id,
        conversation: conversations[0]._id,
        type: 'text',
        status: 'read',
        reactions: [
          { user: users[0]._id, emoji: '🚀', timestamp: new Date(Date.now() - 2000000) },
          { user: users[0]._id, emoji: '💯', timestamp: new Date(Date.now() - 1900000) }
        ],
        createdAt: new Date(Date.now() - 6500000)
      }
    ];

    for (const msgData of aliceBobMessages) {
      const message = new Message(msgData);
      await message.save();
      messages.push(message);
      messageCount++;
    }

    // Messages for Dev Team Group
    const devTeamMessages = [
      {
        content: 'Good morning team! 🌅 Let\'s discuss today\'s sprint goals.',
        sender: users[0]._id,
        conversation: conversations[1]._id,
        type: 'text',
        status: 'delivered',
        reactions: [
          { user: users[1]._id, emoji: '☀️', timestamp: new Date() },
          { user: users[2]._id, emoji: '👋', timestamp: new Date() }
        ],
        createdAt: new Date(Date.now() - 5400000)
      },
      {
        content: 'Morning Alice! I\'ve completed the user authentication endpoints. All tests are passing ✅',
        sender: users[1]._id,
        conversation: conversations[1]._id,
        type: 'text',
        status: 'delivered',
        reactions: [{ user: users[0]._id, emoji: '🎉', timestamp: new Date() }],
        createdAt: new Date(Date.now() - 5100000)
      },
      {
        content: 'Great work Bob! 🎊 I\'ve also finished the real-time messaging components. The UI is looking smooth.',
        sender: users[2]._id,
        conversation: conversations[1]._id,
        type: 'text',
        status: 'delivered',
        reactions: [
          { user: users[0]._id, emoji: '🔥', timestamp: new Date() },
          { user: users[3]._id, emoji: '👏', timestamp: new Date() }
        ],
        createdAt: new Date(Date.now() - 4800000)
      },
      {
        content: 'Excellent! The deployment pipeline is ready. We can push to staging anytime.',
        sender: users[3]._id,
        conversation: conversations[1]._id,
        type: 'text',
        status: 'delivered',
        createdAt: new Date(Date.now() - 4500000)
      },
      {
        content: 'Perfect timing everyone! Let\'s schedule a demo for Friday. I\'ll send out calendar invites.',
        sender: users[0]._id,
        conversation: conversations[1]._id,
        type: 'text',
        status: 'sent',
        createdAt: new Date(Date.now() - 300000)
      }
    ];

    for (const msgData of devTeamMessages) {
      const message = new Message(msgData);
      await message.save();
      messages.push(message);
      messageCount++;
    }

    // Message with reply in Dev Team
    const replyMessage = new Message({
      content: 'Sounds great! Should we include the mobile responsive demo too?',
      sender: users[2]._id,
      conversation: conversations[1]._id,
      type: 'text',
      replyTo: messages[messages.length - 1]._id, // Reply to previous message
      status: 'sent',
      createdAt: new Date(Date.now() - 180000)
    });
    await replyMessage.save();
    messages.push(replyMessage);
    messageCount++;

    // Messages for Design Team
    const designTeamMessages = [
      {
        content: 'Hi team! 🎨 I\'ve uploaded the new mockups to Figma. Please review when you get a chance.',
        sender: users[2]._id,
        conversation: conversations[2]._id,
        type: 'text',
        status: 'delivered',
        createdAt: new Date(Date.now() - 18000000)
      },
      {
        content: 'Love the new color scheme! The gradient backgrounds look amazing 💜',
        sender: users[4]._id,
        conversation: conversations[2]._id,
        type: 'text',
        status: 'delivered',
        reactions: [{ user: users[2]._id, emoji: '😍', timestamp: new Date() }],
        createdAt: new Date(Date.now() - 16200000)
      },
      {
        content: 'The user flow is much cleaner now. Great improvements on the onboarding screens!',
        sender: users[0]._id,
        conversation: conversations[2]._id,
        type: 'text',
        status: 'delivered',
        reactions: [{ user: users[2]._id, emoji: '🙏', timestamp: new Date() }],
        createdAt: new Date(Date.now() - 14400000)
      }
    ];

    for (const msgData of designTeamMessages) {
      const message = new Message(msgData);
      await message.save();
      messages.push(message);
      messageCount++;
    }

    // Messages for Charlie <-> Diana (Direct)
    const charlieDianaMessages = [
      {
        content: 'Diana, can you help me understand the deployment process? I want to make sure my frontend builds work correctly.',
        sender: users[2]._id,
        conversation: conversations[3]._id,
        type: 'text',
        status: 'read',
        readBy: [{ user: users[3]._id, readAt: new Date() }],
        createdAt: new Date(Date.now() - 10800000)
      },
      {
        content: 'Of course! 🚀 The process is automated through GitHub Actions. I can walk you through it tomorrow?',
        sender: users[3]._id,
        conversation: conversations[3]._id,
        type: 'text',
        status: 'read',
        reactions: [{ user: users[2]._id, emoji: '🙌', timestamp: new Date() }],
        createdAt: new Date(Date.now() - 9000000)
      }
    ];

    for (const msgData of charlieDianaMessages) {
      const message = new Message(msgData);
      await message.save();
      messages.push(message);
      messageCount++;
    }

    // Edited message example
    const editedMessage = new Message({
      content: 'Actually, let\'s schedule it for Wednesday afternoon if that works better for you.',
      sender: users[3]._id,
      conversation: conversations[3]._id,
      type: 'text',
      status: 'delivered',
      editedAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 7200000)
    });
    await editedMessage.save();
    messages.push(editedMessage);
    messageCount++;

    // Soft deleted message example
    const deletedMessage = new Message({
      content: 'This message was deleted by user',
      sender: users[4]._id,
      conversation: conversations[4]._id,
      type: 'text',
      status: 'sent',
      isDeleted: true,
      deletedAt: new Date(Date.now() - 1800000),
      createdAt: new Date(Date.now() - 3600000)
    });
    await deletedMessage.save();
    messages.push(deletedMessage);
    messageCount++;

    // Security team message
    const securityMessage = new Message({
      content: 'Weekly security review is scheduled for Friday. Please have your code ready for vulnerability scanning. 🔍',
      sender: users[5]._id,
      conversation: conversations[5]._id,
      type: 'text',
      status: 'delivered',
      reactions: [
        { user: users[1]._id, emoji: '✅', timestamp: new Date() },
        { user: users[3]._id, emoji: '🔒', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1800000)
    });
    await securityMessage.save();
    messages.push(securityMessage);
    messageCount++;

    console.log(`✅ Created ${messageCount} messages with reactions, replies, and various statuses`);
    return messages;
  } catch (error) {
    console.error('❌ Error creating messages:', error);
    throw error;
  }
};

/**
 * Update conversation lastMessage fields
 */
const updateConversationMetadata = async (conversations) => {
  console.log('🔄 Updating conversation metadata...');
  
  for (const conversation of conversations) {
    const latestMessage = await Message.findOne({ 
      conversation: conversation._id,
      isDeleted: false 
    }).sort({ createdAt: -1 }).populate('sender', 'name');

    if (latestMessage) {
      conversation.lastMessage = {
        content: latestMessage.content,
        sender: latestMessage.sender._id,
        timestamp: latestMessage.createdAt
      };
      await conversation.save();
    }
  }
  
  console.log('✅ Updated conversation metadata');
};

/**
 * Print seed summary
 */
const printSummary = async () => {
  const userCount = await User.countDocuments();
  const conversationCount = await Conversation.countDocuments();
  const messageCount = await Message.countDocuments();
  
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('═'.repeat(50));
  console.log(`📊 Seed Summary:`);
  console.log(`   👥 Users: ${userCount}`);
  console.log(`   💬 Conversations: ${conversationCount}`);
  console.log(`   📝 Messages: ${messageCount}`);
  console.log('═'.repeat(50));
  console.log('\n🧪 Test Credentials (password: password123):');
  console.log('   📧 alice@connexus.com - Admin user');
  console.log('   📧 bob@connexus.com - Backend developer'); 
  console.log('   📧 charlie@connexus.com - UI/UX Designer');
  console.log('   📧 diana@connexus.com - DevOps engineer');
  console.log('   📧 eve@connexus.com - Product manager');
  console.log('   📧 frank@connexus.com - Security specialist');
  console.log('   📧 grace@connexus.com - Data scientist');
  console.log('   📧 henry@connexus.com - Mobile developer');
  console.log('\n🚀 API Base URL: http://localhost:5000/api');
  console.log('💾 MongoDB URI:', config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
};

/**
 * Main seed function
 */
const seedDB = async () => {
  console.log('🌱 Starting database seeding process...\n');
  
  try {
    await connectDB();
    await clearData();
    
    const users = await createUsers();
    const conversations = await createConversations(users);
    const messages = await createMessages(conversations, users);
    
    await updateConversationMetadata(conversations);
    await printSummary();
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted');
  await disconnectDB();
  process.exit(0);
});

// Run seeding
seedDB();
