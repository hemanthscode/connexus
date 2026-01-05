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
    console.log('🗑️ Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

/**
 * Create users with authentic Telugu names and inspiring profiles
 */
const createUsers = async () => {
  console.log('👥 Creating users...');

  const usersData = [
    {
      name: 'Aadhya',
      email: 'aadhya@connexus.com',
      password: 'Password123',
      bio: 'Believer in human potential | Building spaces where souls discover their craft 🌟',
      location: 'Hyderabad, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg'
    },
    {
      name: 'Arjun',
      email: 'arjun@connexus.com',
      password: 'Password123',
      bio: 'Classical vocalist | Finding healing in every raag, stories in every note 🎵',
      location: 'Bangalore, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg'
    },
    {
      name: 'Kavya',
      email: 'kavya@connexus.com',
      password: 'Password123',
      bio: 'Mountain soul | Collecting sunrises and life lessons from the road 🏔️',
      location: 'Vizag, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pinimg.com/1200x/d4/f0/61/d4f061ea1451bcca3fcb525026b4fb52.jpg'
    },
    {
      name: 'Dhruv',
      email: 'dhruv@connexus.com',
      password: 'Password123',
      bio: 'Tech architect | Coding solutions that serve consciousness, not capitalism ⚡',
      location: 'Mumbai, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/0b/97/6f/0b976f0a7aa1aa43870e1812eee5a55d.jpg'
    },
    {
      name: 'Priya',
      email: 'priya@connexus.com',
      password: 'Password123',
      bio: 'Community weaver | Amplifying voices that deserve to be heard 🌱',
      location: 'Chennai, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/ce/31/42/ce3142d7a968fff3aecd0100572a5e8b.jpg'
    },
    {
      name: 'Vihan',
      email: 'vihan@connexus.com',
      password: 'Password123',
      bio: 'Adventure seeker | Believes life shrinks or expands in proportion to courage 🎒',
      location: 'Pune, India',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/2e/ae/fd/2eaefd75d164be0b17ef6f09749d0da8.jpg'
    },
    {
      name: 'Ishani',
      email: 'ishani@connexus.com',
      password: 'Password123',
      bio: 'Art therapist | Painting pathways to healing, one brushstroke at a time 🎨',
      location: 'Delhi, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pinimg.com/1200x/96/9c/85/969c85920f4ed80f8f55007a0740b8bb.jpg'
    },
    {
      name: 'Rohan',
      email: 'rohan@connexus.com',
      password: 'Password123',
      bio: 'Strategic dreamer | Turning impossible visions into inevitable realities 🚀',
      location: 'Gurgaon, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/e4/6d/b4/e46db4eec520f0c870211b8b76ce2a64.jpg'
    },
    {
      name: 'Neha',
      email: 'neha@connexus.com',
      password: 'Password123',
      bio: 'Storyteller & poet | Weaving words that awaken dormant dreams ✍️',
      location: 'Jaipur, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/f7/b0/99/f7b099094d8464710442f05f9d5d11e7.jpg'
    },
    {
      name: 'Karthik',
      email: 'karthik@connexus.com',
      password: 'Password123',
      bio: 'Meditation guide | Teaching people to find silence in the chaos 🧘',
      location: 'Mysore, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/57/87/01/5787016edee11b5ab86be6841be005d0.jpg'
    },
    {
      name: 'Ananya',
      email: 'ananya@connexus.com',
      password: 'Password123',
      bio: 'Social entrepreneur | Building bridges between privilege and purpose 🌍',
      location: 'Kolkata, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/1200x/be/32/a5/be32a59350ddd9f1f0f13494b1c5a794.jpg'
    },
    {
      name: 'Hemanth',
      email: 'hemanth@connexus.com',
      password: 'Password123',
      bio: 'Conscious photographer | Capturing moments that reveal the extraordinary in ordinary 📸',
      location: 'Hyderabad, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/0c/43/ac/0c43ace181a16c3ae7b3b2f5252073ef.jpg'
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
 * Create meaningful conversations
 */
const createConversations = async (users) => {
  console.log('💬 Creating conversations...');

  const conversations = [];

  // Direct: Aadhya <-> Priya (Soul Craft Society - The Birth)
  const convo1 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[0]._id, role: 'member' },
      { user: users[4]._id, role: 'member' }
    ],
    createdBy: users[0]._id
  });
  await convo1.save();
  conversations.push(convo1);

  // Direct: Arjun <-> Ishani (Music Healing Project)
  const convo2 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[1]._id, role: 'member' },
      { user: users[6]._id, role: 'member' }
    ],
    createdBy: users[1]._id
  });
  await convo2.save();
  conversations.push(convo2);

  // Direct: Aadhya <-> Rohan (Project Quantum - Secret Vision)
  const convo3 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[0]._id, role: 'member' },
      { user: users[7]._id, role: 'member' }
    ],
    createdBy: users[0]._id
  });
  await convo3.save();
  conversations.push(convo3);

  // Direct: Kavya <-> Vihan (Travel Philosophy)
  const convo4 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[2]._id, role: 'member' },
      { user: users[5]._id, role: 'member' }
    ],
    createdBy: users[2]._id
  });
  await convo4.save();
  conversations.push(convo4);

  // Direct: Neha <-> Aadhya (Storytelling & Purpose)
  const convo5 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[8]._id, role: 'member' },
      { user: users[0]._id, role: 'member' }
    ],
    createdBy: users[8]._id
  });
  await convo5.save();
  conversations.push(convo5);

  // Direct: Karthik <-> Dhruv (Technology & Consciousness)
  const convo6 = new Conversation({
    type: 'direct',
    participants: [
      { user: users[9]._id, role: 'member' },
      { user: users[3]._id, role: 'member' }
    ],
    createdBy: users[9]._id
  });
  await convo6.save();
  conversations.push(convo6);

  // Group: Wanderlust Souls 🌍
  const group1 = new Conversation({
    type: 'group',
    name: 'Wanderlust Souls 🌍',
    description: 'For those who find home in journeys, not destinations',
    participants: [
      { user: users[2]._id, role: 'admin' },
      { user: users[0]._id, role: 'member' },
      { user: users[5]._id, role: 'member' },
      { user: users[1]._id, role: 'member' },
      { user: users[11]._id, role: 'member' }
    ],
    createdBy: users[2]._id,
    avatar: 'https://i.pinimg.com/1200x/f5/93/d7/f593d7a9b3dacb227c5eeacf6088c7f5.jpg'
  });
  await group1.save();
  conversations.push(group1);

  // Group: Soul Craft Circle 🎯
  const group2 = new Conversation({
    type: 'group',
    name: 'Soul Craft Circle 🎯',
    description: 'Building the NGO that helps people discover their authentic calling',
    participants: [
      { user: users[0]._id, role: 'admin' },
      { user: users[4]._id, role: 'admin' },
      { user: users[10]._id, role: 'member' },
      { user: users[8]._id, role: 'member' },
      { user: users[9]._id, role: 'member' }
    ],
    createdBy: users[0]._id,
    avatar: 'https://i.pinimg.com/736x/98/0a/c6/980ac6653ddfdda63e0f15af91f483f8.jpg'
  });
  await group2.save();
  conversations.push(group2);

  // Group: Raag & Resonance 🎵
  const group3 = new Conversation({
    type: 'group',
    name: 'Raag & Resonance 🎵',
    description: 'Where music meets healing and melodies unlock memories',
    participants: [
      { user: users[1]._id, role: 'admin' },
      { user: users[6]._id, role: 'member' },
      { user: users[0]._id, role: 'member' },
      { user: users[4]._id, role: 'member' },
      { user: users[9]._id, role: 'member' }
    ],
    createdBy: users[1]._id,
    avatar: 'https://i.pinimg.com/1200x/05/33/aa/0533aa6eb77373e23460522d8216e2a0.jpg'
  });
  await group3.save();
  conversations.push(group3);

  // Group: The Architects 🏗️
  const group4 = new Conversation({
    type: 'group',
    name: 'The Architects 🏗️',
    description: 'Building futures where technology serves consciousness',
    participants: [
      { user: users[0]._id, role: 'admin' },
      { user: users[7]._id, role: 'admin' },
      { user: users[3]._id, role: 'member' },
      { user: users[4]._id, role: 'member' },
      { user: users[10]._id, role: 'member' }
    ],
    createdBy: users[0]._id,
    avatar: 'https://i.pinimg.com/1200x/a8/5c/10/a85c10c652dffb6187dd0c7de0e5c554.jpg'
  });
  await group4.save();
  conversations.push(group4);

  // Group: Conscious Creators 🌟
  const group5 = new Conversation({
    type: 'group',
    name: 'Conscious Creators 🌟',
    description: 'Artists, thinkers, builders creating with intention and impact',
    participants: [
      { user: users[6]._id, role: 'admin' },
      { user: users[8]._id, role: 'member' },
      { user: users[11]._id, role: 'member' },
      { user: users[1]._id, role: 'member' },
      { user: users[2]._id, role: 'member' }
    ],
    createdBy: users[6]._id,
    avatar: 'https://i.pinimg.com/1200x/3b/7f/22/3b7f2204da3768be5f84bf4000090201.jpg'
  });
  await group5.save();
  conversations.push(group5);

  console.log(`✅ Created ${conversations.length} conversations`);
  return conversations;
};

/**
 * Create deeply meaningful messages that reveal character and purpose
 */
const createMessages = async (conversations, users) => {
  console.log('📝 Creating meaningful messages...');

  const messagesData = [
    // ========================================
    // Aadhya <-> Priya: Soul Craft Society Origin Story
    // ========================================
    {
      content: 'Priya, remember that conversation we had at 2 AM three months ago? About people being trapped in the wrong lives?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8640000000)
    },
    {
      content: 'How could I forget? You were talking about your cousin who quit his CA job to become a chef. That story stayed with me.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639900000)
    },
    {
      content: 'He told me something that broke my heart. He said, "I spent 15 years becoming excellent at something my soul has no connection to." Fifteen years, Priya.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '💔', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8639800000)
    },
    {
      content: 'And now? How is he doing?',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639700000)
    },
    {
      content: 'He\'s running a small restaurant in Goa. Barely making what he used to, but yesterday he told me: "I wake up excited now. Food is my language, and finally I\'m speaking fluently."',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8639600000)
    },
    {
      content: 'That gave me chills. Imagine how many people are living in that 15-year silence, never finding their voice.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639500000)
    },
    {
      content: 'Exactly. And here\'s what keeps me up at night - it\'s not that people don\'t have talents or callings. It\'s that they never get the space, permission, or guidance to discover them.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639400000)
    },
    {
      content: 'Society gives us exactly one chance to "decide our future" - at 16, when we choose our stream. One decision at sixteen determines the next forty years.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🎯', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8639300000)
    },
    {
      content: 'What if we created something different? A space where discovering your calling isn\'t a luxury or an accident - it\'s intentional, supported, celebrated.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639200000)
    },
    {
      content: 'I\'m listening. What does this space look like in your mind?',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8639100000)
    },
    {
      content: 'An NGO. But not the traditional kind. I want to call it "Soul Craft Society" - where we help people craft their soul\'s true work. Not just career counseling, but deep soul work.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8639000000)
    },
    {
      content: 'Soul Craft Society... Aadhya, that name carries such weight. It\'s not about finding a job, it\'s about finding yourself.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8638900000)
    },
    {
      content: 'Yes! Imagine weekly workshops where a software engineer discovers they\'re meant to teach dance. Or a doctor realizes they\'re called to write poetry. We give them tools, mentorship, financial support for transitions.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8638800000)
    },
    {
      content: 'The ripple effects would be massive. When one person lives authentically, they give permission to everyone around them to do the same.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 8638700000)
    },
    {
      content: 'Exactly. We\'re not just changing individual lives - we\'re changing families, communities, generations. A fulfilled parent raises children who believe dreams are possible.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8638600000)
    },
    {
      content: 'I want in. This isn\'t just an idea - this feels like my calling too. When do we start?',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🔥', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8638500000)
    },
    {
      content: 'Next Saturday. One pilot workshop. "Discover Your Soul Craft." 20 people. Let\'s see if this vision has legs. Are you ready to co-build this?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🚀', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8638400000)
    },
    {
      content: 'I\'ve never been more ready for anything. Let\'s help people find what they\'re here to do.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 8638300000)
    },

    // ========================================
    // Arjun <-> Ishani: Music as Healing
    // ========================================
    {
      content: 'Ishani, something extraordinary happened during my practice this morning. I need to tell you about it.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7200000)
    },
    {
      content: 'I can feel the energy in your message. Tell me everything.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7190000)
    },
    {
      content: 'I was practicing Raag Darbari Kanada - you know, the raag of depth and gravity. Suddenly, I was transported to a memory I didn\'t even know I had.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7180000)
    },
    {
      content: 'Music unlocking hidden memories... What did you see?',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7170000)
    },
    {
      content: 'My grandfather. I was maybe four years old, sitting on his lap. He was humming this exact raag while reading the newspaper. I could feel the vibration of his chest, smell his sandalwood cologne.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🕉️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7160000)
    },
    {
      content: 'That\'s not just memory, Arjun. That\'s cellular memory. The raag became a time machine to a moment of pure safety and love.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7150000)
    },
    {
      content: 'And here\'s the thing - I broke down crying. Not sad tears, but... release? Like some grief I\'d been carrying for twenty years finally had permission to leave.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7140000)
    },
    {
      content: 'This is exactly what I see in art therapy. Sound, color, movement - they bypass our intellectual defenses and speak directly to wounds we don\'t even have words for.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7130000)
    },
    {
      content: 'What if we combined them? Your art therapy with my music. Imagine: I sing a raag while people paint. The frequencies guide their brush, unlock what needs to come out.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7120000)
    },
    {
      content: 'Arjun, that\'s not just therapy - that\'s alchemy. Music as the catalyst, art as the expression. We could help people process trauma they can\'t speak about.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7110000)
    },
    {
      content: 'Different raags for different healing: Bhairav at dawn for grounding, Yaman for opening the heart, Malkauns for going deep into shadow work.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7100000)
    },
    {
      content: 'Each raag has its own healing frequency. Ancient musicians knew this - they weren\'t just entertaining, they were healing. We\'d be bringing back something sacred that got lost.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7090000)
    },
    {
      content: 'I want to do this, Ishani. Not for fame or recognition. For that person who carries twenty years of unspoken grief. Your voice could be the permission they need to let it go.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7080000)
    },
    {
      content: 'Let\'s create something called "Raag Therapy Sessions." Small groups. Safe space. Music, art, and the courage to feel what we\'ve been avoiding.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7070000)
    },
    {
      content: 'When do we start? I\'ve been waiting for this collaboration without even knowing it.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7060000)
    },

    // ========================================
    // Aadhya <-> Rohan: Project Quantum (Secret Vision)
    // ========================================
    {
      content: 'Rohan, I need to share something with you. Something I haven\'t told anyone else because it sounds... impossible.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6000000)
    },
    {
      content: 'Aadhya, your "impossible" ideas usually become inevitable realities. I\'m all ears.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5990000)
    },
    {
      content: 'What if we could create technology that doesn\'t extract value from humans, but amplifies human potential? Not AI that replaces us, but consciousness tech that elevates us.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5980000)
    },
    {
      content: 'I\'m listening. Define consciousness tech.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5970000)
    },
    {
      content: 'Imagine a platform that maps human essence - not behavior data, but WHY people do things. Their authentic motivations, dormant talents, unexpressed dreams. Like an MRI for the soul.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '👁️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5960000)
    },
    {
      content: 'That\'s... that\'s like creating a GPS for human purpose. The implications are staggering. How would it work?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5950000)
    },
    {
      content: 'Combine AI with ancient wisdom systems - Vedic psychology, Jungian archetypes, indigenous knowledge. Not to predict behavior, but to reflect potential. To show people who they could become.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5940000)
    },
    {
      content: 'You\'re talking about technology as a mirror for consciousness evolution. Not optimization, but awakening.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5930000)
    },
    {
      content: 'Exactly. Current tech asks: "How can we keep users engaged?" We ask: "How can we help humans become who they\'re meant to be?" Completely different paradigm.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5920000)
    },
    {
      content: 'This isn\'t just a product, Aadhya. This is a civilizational shift. Technology serving consciousness instead of hijacking it.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5910000)
    },
    {
      content: 'I\'m calling it Project Quantum. Because it\'s about quantum leaps in human awareness. And because it exists in superposition - both possible and impossible until we collapse the wave function by building it.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '🔮', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5900000)
    },
    {
      content: 'Quantum... I love that. What\'s the first milestone? How do we start building something this ambitious?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5890000)
    },
    {
      content: 'Start with story. Every human is living a story they didn\'t consciously write. What if we created an AI that helps people see their unconscious narrative and rewrite it intentionally?',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5880000)
    },
    {
      content: 'Like a narrative therapy engine... showing people the story they\'re living and offering alternate narratives they could step into.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5870000)
    },
    {
      content: 'Yes! And here\'s the thing - this can\'t be built by chasing funding or seeking validation. It has to be built in secret, with pure intention, by people who get it. Can I trust you with this?',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '🤝', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5860000)
    },
    {
      content: 'Aadhya, this is what I\'ve been waiting to build my entire career. Technology with soul. I\'m in, completely. When do we start?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🚀', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5850000)
    },
    {
      content: 'We already started. This conversation is the foundation. Project Quantum begins not with code, but with consciousness. With two people who refuse to build anything that diminishes human potential.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5840000)
    },

    // ========================================
    // Kavya <-> Vihan: Travel & Transformation
    // ========================================
    {
      content: 'Vihan, I just got back from Spiti and I need to tell you something about mountains and souls.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5000000)
    },
    {
      content: 'Kavya! I\'ve been waiting for your Spiti stories. Tell me everything.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4990000)
    },
    {
      content: 'You know how everyone says travel changes you? I think that\'s incomplete. Travel doesn\'t change you - it reveals who you already are underneath the layers of who you thought you had to be.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[5]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4980000)
    },
    {
      content: 'That\'s profound. Travel as excavation, not transformation.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4970000)
    },
    {
      content: 'At 4500 meters, sitting in Key Monastery, I realized something. Down in the plains, I\'m constantly performing - being the person my resume says I am, the daughter my parents expect, the friend everyone needs.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4960000)
    },
    {
      content: 'And in the mountains?',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4950000)
    },
    {
      content: 'In the mountains, none of that matters. The Himalayas don\'t care about your LinkedIn profile. They only respond to authenticity. You\'re either present or you\'re not. You\'re either honest or you\'re not.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[5]._id, emoji: '🏔️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4940000)
    },
    {
      content: 'Mountains as truth serum. I felt this in Ladakh last year. The altitude strips away pretense. You meet yourself without filters.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4930000)
    },
    {
      content: 'I met this old monk. Must have been in his seventies, walking barefoot at that altitude. I asked him, "Lama-la, how do you find peace?" You know what he said?',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4920000)
    },
    {
      content: 'Tell me.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4910000)
    },
    {
      content: 'He looked at me with these impossibly gentle eyes and said, "Sister, peace is not found. Peace is what remains when you stop carrying what was never yours to carry."',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[5]._id, emoji: '🕉️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4900000)
    },
    {
      content: 'That\'s... Kavya, I need to sit with that for a moment. How many of us are carrying expectations, identities, ambitions that were never authentically ours?',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4890000)
    },
    {
      content: 'All of us. That\'s why we travel. Not to escape life, but to remember what life actually is before we covered it with shoulds and musts.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[5]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4880000)
    },
    {
      content: 'I\'ve been thinking about a long trek. Not the Instagram kind. The kind where you walk until your thoughts fall silent and something deeper starts speaking.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4870000)
    },
    {
      content: 'Yes! Let\'s plan something. Not a vacation - a pilgrimage. Walking meditation through the Himalayas. No destination, just direction.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[5]._id, emoji: '⛰️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4860000)
    },
    {
      content: 'When we travel together, it\'s not about conquering peaks. It\'s about surrendering to what those peaks want to teach us.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4850000)
    },

    // ========================================
    // Neha <-> Aadhya: Storytelling & Purpose
    // ========================================
    {
      content: 'Aadhya, I\'ve been thinking about what you said last week - that every human life is a story waiting to be told. Can we talk about that?',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4000000)
    },
    {
      content: 'Neha, yes! This has been consuming me. What sparked this for you?',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3990000)
    },
    {
      content: 'I met my house help\'s daughter yesterday. Sixteen years old, brilliant eyes. She told me she wants to be a writer but her mother says, "Stories don\'t feed families."',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '💔', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3980000)
    },
    {
      content: 'Oh, Neha. How many times is that story repeated? "Your passion doesn\'t pay bills."',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3970000)
    },
    {
      content: 'But here\'s what broke my heart - she said, "Didi, I have stories inside me that feel like they\'re suffocating because they have nowhere to go. Is it selfish to want to tell them?"',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '😢', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3960000)
    },
    {
      content: 'It\'s not selfish - it\'s essential. Unexpressed stories become poison. They ferment inside us, turn into bitterness, regret, the feeling that our life didn\'t matter.',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3950000)
    },
    {
      content: 'Exactly. And I realized - storytelling isn\'t just creative expression. It\'s how we make sense of our existence. It\'s how we process pain, celebrate joy, leave something behind.',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3940000)
    },
    {
      content: 'What if Soul Craft Society had a storytelling vertical? Helping people tell their stories - not for publication or fame, but for healing. For legacy.',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3930000)
    },
    {
      content: 'Yes! Everyone has a story worthy of being told. The grandmother who raised seven kids alone. The auto driver who writes poetry at red lights. The nurse who holds dying patients\' hands.',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3920000)
    },
    {
      content: 'Those are the stories that matter. Not the ones manufactured for social media, but the real, raw, human stories that remind us what it means to be alive.',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3910000)
    },
    {
      content: 'I want to help that girl tell her stories. And thousands like her. People who have words trapped inside them like birds in cages.',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🕊️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3900000)
    },
    {
      content: 'Let\'s create "Story Liberation Workshops." Safe spaces where people write without judgment. Where their stories are witnessed and honored, not evaluated or edited.',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3890000)
    },
    {
      content: 'When do we start? I can already see her face when I tell her we want to hear her stories.',
      sender: users[8]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3880000)
    },

    // ========================================
    // Karthik <-> Dhruv: Technology & Consciousness
    // ========================================
    {
      content: 'Dhruv, question for you as a tech person: why are we building technology that makes us less human?',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3500000)
    },
    {
      content: 'That\'s... that\'s the question that keeps me up at night, Karthik. What made you ask?',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3490000)
    },
    {
      content: 'I was teaching meditation to a group of techies yesterday. Brilliant minds, building amazing products. But when I asked them to sit in silence for 10 minutes, they literally couldn\'t do it.',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[3]._id, emoji: '💭', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3480000)
    },
    {
      content: 'Let me guess - the urge to check phones, the mental to-do lists, the inability to just... be.',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3470000)
    },
    {
      content: 'Exactly. And here\'s the irony - these are the people building the apps that train the rest of us to be equally fragmented. We\'ve created technology that profits from our distraction.',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[3]._id, emoji: '🎯', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3460000)
    },
    {
      content: 'You\'re right. Every product metric is about engagement, retention, time spent. Never about: "Did this make the user more present? More connected? More alive?"',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3450000)
    },
    {
      content: 'What if we inverted it? What if we built technology that measures success by how quickly users can disconnect from it and reconnect with themselves?',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[3]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3440000)
    },
    {
      content: 'That\'s revolutionary. An app that encourages you to close it. A platform that celebrates you spending less time on it. Complete opposite of current models.',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3430000)
    },
    {
      content: 'Because technology should be like a good meditation teacher - present when needed, invisible when not. It should serve consciousness, not hijack it.',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[3]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3420000)
    },
    {
      content: 'I want to build this. Tech that helps people remember they\'re not their productivity, their notifications, their metrics. They\'re consciousness experiencing itself.',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[9]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3410000)
    },
    {
      content: 'Imagine an AI that reminds you to breathe. A smart device that suggests you go watch the sunset instead of scrolling. Technology as a path to presence, not escape from it.',
      sender: users[9]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[3]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3400000)
    },
    {
      content: 'This is the future I want to code. Not just features, but consciousness. Not just engagement, but enlightenment.',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[9]._id, emoji: '🚀', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3390000)
    },

    // ========================================
    // Group: Wanderlust Souls 🌍
    // ========================================
    {
      content: 'Friends, just got back from Spiti and I need to share what happened at 15,000 feet 🏔️',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3000000)
    },
    {
      content: 'Kavya! We\'ve been waiting for your stories. Spiti has this way of rewiring your soul.',
      sender: users[0]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2995000)
    },
    {
      content: 'The silence there is so profound, you can hear your own heartbeat in your ears. I understood things about myself I\'d been running from for years.',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [
        { user: users[5]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[1]._id, emoji: '✨', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2990000)
    },
    {
      content: 'That\'s what mountains do - they strip away everything fake and leave you face to face with who you really are. No filters, no performance.',
      sender: users[5]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2985000)
    },
    {
      content: 'I met this monk in Key Monastery. Seventy years old, barefoot at 4500 meters. He said something that rewrote my understanding of life.',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2980000)
    },
    {
      content: 'Don\'t leave us hanging, Kavya! What did he say?',
      sender: users[1]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2975000)
    },
    {
      content: '"Travel is not about changing the geography outside. It\'s about changing the geography inside." I sat with that for hours.',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '🕉️', timestamp: new Date() },
        { user: users[11]._id, emoji: '💫', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2970000)
    },
    {
      content: 'Every journey is an internal expedition disguised as an external one. We think we\'re exploring places, but we\'re really exploring ourselves.',
      sender: users[11]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2965000)
    },
    {
      content: 'That\'s why the same place reveals different things to different people. Mountains hold up a mirror. What you see depends on who\'s looking.',
      sender: users[5]._id,
      conversation: conversations[6]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2960000)
    },
    {
      content: 'I\'ve been planning a solo trek to Hampta Pass. Not for photos or achievements. For answers to questions I haven\'t even formed yet.',
      sender: users[1]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2955000)
    },
    {
      content: 'Arjun, take your music with you! Imagine singing raags in those valleys. The mountains will become your tambura, echoing every note back transformed.',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2950000)
    },
    {
      content: 'What if we did a group trek? Not the tourist kind with guides and fixed itineraries. The kind where we walk until we remember who we are.',
      sender: users[0]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [
        { user: users[2]._id, emoji: '⛰️', timestamp: new Date() },
        { user: users[5]._id, emoji: '🔥', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2945000)
    },
    {
      content: 'Valley of Flowers during monsoon? Walking through clouds, rain washing away everything we carry that isn\'t truly ours.',
      sender: users[5]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🌧️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2940000)
    },
    {
      content: 'I\'ll capture it through my lens - not the scenic views, but the moments of transformation. The exact second someone remembers their wild self.',
      sender: users[11]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '📸', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2935000)
    },
    {
      content: 'Let\'s do this. Not as a vacation, but as a pilgrimage. Walking meditation through the Himalayas. Destination: ourselves.',
      sender: users[2]._id,
      conversation: conversations[6]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '✨', timestamp: new Date() },
        { user: users[1]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[5]._id, emoji: '🚶', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2930000)
    },

    // ========================================
    // Group: Soul Craft Circle 🎯
    // ========================================
    {
      content: 'Everyone, we did our first pilot workshop yesterday. Twenty people. What happened exceeded every expectation I had.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2500000)
    },
    {
      content: 'Tell us everything, Aadhya! How did people respond to the Soul Craft framework?',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2495000)
    },
    {
      content: 'There was this woman - 38 years old, working in banking for 15 years. Within the first hour, she started crying. Not sad tears, but... release.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '💫', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2490000)
    },
    {
      content: 'What unlocked that for her?',
      sender: users[10]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2485000)
    },
    {
      content: 'We did an exercise called "The Life You Didn\'t Choose." Asked them to write about the version of themselves that exists in a parallel universe where they followed their heart at 18.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2480000)
    },
    {
      content: 'That\'s powerful. Confronting the ghost of the unlived life.',
      sender: users[9]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🎯', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2475000)
    },
    {
      content: 'She wrote about being a wildlife photographer. Traveling to forests, documenting endangered species, living in tents. Then she looked up and said, "I forgot I used to be this person."',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [
        { user: users[4]._id, emoji: '😢', timestamp: new Date() },
        { user: users[8]._id, emoji: '✨', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2470000)
    },
    {
      content: 'This is why Soul Craft is so necessary. People don\'t lose their calling - they bury it under expectations, responsibilities, fear. We\'re giving them permission to excavate.',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2465000)
    },
    {
      content: 'What happened next with her?',
      sender: users[8]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2460000)
    },
    {
      content: 'By the end, she committed to taking one step toward that parallel life. Starting with a weekend photography course. Then maybe volunteering at a wildlife sanctuary. Small steps toward her unlived life.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[10]._id, emoji: '🌱', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2455000)
    },
    {
      content: 'That\'s transformation. Not dramatic overnight change, but conscious redirecting. The courage to take one step toward authenticity.',
      sender: users[10]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2450000)
    },
    {
      content: 'There were 19 other stories just as profound. An IT engineer who realized he\'s meant to teach philosophy. A homemaker who discovered she wants to be a sound healer.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[9]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2445000)
    },
    {
      content: 'This is bigger than workshops, friends. We\'re witnessing people remember who they are. Soul Craft isn\'t teaching them anything new - it\'s removing the amnesia.',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2440000)
    },
    {
      content: 'I want to add a storytelling component. Help people narrate their transformation. Not for social media, but for their own clarity and legacy.',
      sender: users[8]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2435000)
    },
    {
      content: 'And meditation practices to help them stay connected to their authentic self even when they go back to regular life.',
      sender: users[9]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🧘', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2430000)
    },
    {
      content: 'We could create follow-up circles. Monthly gatherings where people share their progress, struggles, small victories. A community of conscious career crafters.',
      sender: users[10]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '🌟', timestamp: new Date() },
        { user: users[4]._id, emoji: '🤝', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2425000)
    },
    {
      content: 'This is it, everyone. This is how we change the world - one soul remembering its craft at a time. Let\'s scale this with intention, not speed.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [
        { user: users[4]._id, emoji: '🚀', timestamp: new Date() },
        { user: users[8]._id, emoji: '❤️', timestamp: new Date() },
        { user: users[9]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[10]._id, emoji: '✨', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2420000)
    },

    // ========================================
    // Group: Raag & Resonance 🎵
    // ========================================
    {
      content: 'Friends, had a profound moment in my practice today. Want to share something about music and cellular memory.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2000000)
    },
    {
      content: 'Arjun, we\'re listening. You know we\'re always here for your musical revelations.',
      sender: users[6]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1995000)
    },
    {
      content: 'I was singing Raag Bhairavi - the morning raag, the one that invokes devotion. Suddenly I was five years old, sitting with my grandmother as she sang her morning prayers.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[9]._id, emoji: '🕉️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1990000)
    },
    {
      content: 'Music is a time machine. Certain frequencies unlock memories stored in our very cells.',
      sender: users[9]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1985000)
    },
    {
      content: 'I could smell her incense, feel her hand on my head, hear her voice. But here\'s what amazed me - I wasn\'t just remembering it. I was healing something in that memory.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1980000)
    },
    {
      content: 'That\'s the power of raag therapy. Music doesn\'t just recall emotion - it transforms it. You were doing surgery on time itself.',
      sender: users[6]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1975000)
    },
    {
      content: 'This is why I want to record that healing album. Not entertainment, but medicine. Raags that help people process grief, release trauma, reconnect with joy.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[4]._id, emoji: '💫', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1970000)
    },
    {
      content: 'Each raag could target specific emotional states. Bhairav for grounding and stability. Yaman for opening the heart. Darbari for strength in darkness.',
      sender: users[9]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1965000)
    },
    {
      content: 'Ancient musicians knew this. They weren\'t performers - they were healers. A good musician could cure physical ailments with the right raag at the right time.',
      sender: users[0]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1960000)
    },
    {
      content: 'We need to bring that back. Not as mysticism, but as genuine therapeutic practice. Music that serves consciousness, not consumerism.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1955000)
    },
    {
      content: 'Imagine combining this with my art therapy sessions. You sing while people paint, letting the raag guide their hands. Healing through multi-sensory expression.',
      sender: users[6]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1950000)
    },
    {
      content: 'That would be profound. Sound as the carrier wave, visual art as the expression. People processing trauma they don\'t even have language for.',
      sender: users[4]._id,
      conversation: conversations[8]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1945000)
    },
    {
      content: 'Can we pilot this? "Raag Resonance Sessions" - small groups, safe space, music plus art equals healing.',
      sender: users[1]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [
        { user: users[6]._id, emoji: '✨', timestamp: new Date() },
        { user: users[0]._id, emoji: '🙏', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1940000)
    },
    {
      content: 'Let\'s do it. This could help people heal wounds they\'ve carried for lifetimes. Your voice as medicine, Arjun.',
      sender: users[6]._id,
      conversation: conversations[8]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1935000)
    },

    // ========================================
    // Group: The Architects 🏗️
    // ========================================
    {
      content: 'Team, we need to talk about what we\'re actually building here. Project Quantum isn\'t just technology - it\'s a new paradigm.',
      sender: users[0]._id,
      conversation: conversations[9]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1500000)
    },
    {
      content: 'I\'ve been thinking about this non-stop. We\'re not building products for market fit. We\'re building bridges between technology and consciousness.',
      sender: users[7]._id,
      conversation: conversations[9]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1495000)
    },
    {
      content: 'Every tech company asks: "How do we maximize user engagement?" We need to ask: "How do we maximize human flourishing?"',
      sender: users[3]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🎯', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1490000)
    },
    {
      content: 'Completely different metrics. Success isn\'t time on platform - it\'s time spent living authentically because the platform showed them their blind spots.',
      sender: users[7]._id,
      conversation: conversations[9]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1485000)
    },
    {
      content: 'I want to propose something radical: What if our tech literally encourages people to disconnect from it? "You\'ve been here 10 minutes. Time to go experience real life."',
      sender: users[3]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '💡', timestamp: new Date() },
        { user: users[4]._id, emoji: '🌟', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1480000)
    },
    {
      content: 'That\'s anti-capitalist and deeply humane. No investor would fund it. Which is exactly why we need to build it ourselves.',
      sender: users[4]._id,
      conversation: conversations[9]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1475000)
    },
    {
      content: 'The current model: extract attention, convert to data, monetize the human. Our model: illuminate consciousness, catalyze growth, celebrate the human.',
      sender: users[0]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1470000)
    },
    {
      content: 'We need to think about sustainability differently too. Not just environmental - but consciousness sustainability. Tech that doesn\'t drain our humanity.',
      sender: users[10]._id,
      conversation: conversations[9]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1465000)
    },
    {
      content: 'What if we measured impact in "moments of awakening" instead of "daily active users"? Every time someone has an insight about themselves because of our platform, that\'s success.',
      sender: users[7]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1460000)
    },
    {
      content: 'This is about architecting the future of human-technology relationship. Making tech that serves souls, not algorithms.',
      sender: users[3]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🚀', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1455000)
    },
    {
      content: 'I propose we code with intention. Before writing any feature, we ask: "Does this elevate human consciousness or hijack it?" If we can\'t answer clearly, we don\'t build it.',
      sender: users[0]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [
        { user: users[7]._id, emoji: '🔥', timestamp: new Date() },
        { user: users[3]._id, emoji: '💫', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1450000)
    },
    {
      content: 'This is sacred work. We\'re not building a startup - we\'re building a movement. Technology as spiritual practice.',
      sender: users[7]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1445000)
    },
    {
      content: 'Every line of code either makes humanity more conscious or more distracted. There\'s no neutral. Let\'s build consciousness.',
      sender: users[3]._id,
      conversation: conversations[9]._id,
      type: 'text',
      reactions: [
        { user: users[0]._id, emoji: '✨', timestamp: new Date() },
        { user: users[7]._id, emoji: '🌟', timestamp: new Date() },
        { user: users[4]._id, emoji: '❤️', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1440000)
    },

    // ========================================
    // Group: Conscious Creators 🌟
    // ========================================
    {
      content: 'I\'ve been reflecting on what it means to create with consciousness. Every brushstroke, every word, every image - they carry intention.',
      sender: users[6]._id,
      conversation: conversations[10]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1000000)
    },
    {
      content: 'Yes! As a poet, I feel the weight of every word. Language doesn\'t just describe reality - it creates it.',
      sender: users[8]._id,
      conversation: conversations[10]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 995000)
    },
    {
      content: 'Photography is the same. I\'m not capturing moments - I\'m choosing what deserves to be remembered. That\'s a sacred responsibility.',
      sender: users[11]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '📸', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 990000)
    },
    {
      content: 'Music is intention made audible. When I sing, I\'m not just making sound - I\'m shaping the emotional atmosphere. People feel what I feel.',
      sender: users[1]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 985000)
    },
    {
      content: 'This is why conscious creation matters. We\'re not just making art - we\'re influencing consciousness itself. Our work enters people and changes them.',
      sender: users[6]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 980000)
    },
    {
      content: 'Even travel photography carries this weight. When I share images of mountains, I\'m not just showing beauty - I\'m inviting people into a relationship with wildness.',
      sender: users[2]._id,
      conversation: conversations[10]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 975000)
    },
    {
      content: 'What if we committed to creating only what serves awakening? Art that doesn\'t distract from life, but illuminates it.',
      sender: users[8]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [
        { user: users[6]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[1]._id, emoji: '💫', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 970000)
    },
    {
      content: 'We could be each other\'s conscious accountability. Before sharing work, ask: "Does this elevate or extract? Does it awaken or numb?"',
      sender: users[11]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [{ user: users[2]._id, emoji: '🎯', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 965000)
    },
    {
      content: 'I love this. Not censorship, but discernment. Creating from our highest self, not our wounded self seeking validation.',
      sender: users[1]._id,
      conversation: conversations[10]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 960000)
    },
    {
      content: 'The world is drowning in content. What it needs is conscious creation - art that heals, words that awaken, images that inspire.',
      sender: users[6]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [{ user: users[8]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 955000)
    },
    {
      content: 'Let\'s make a pact: We create not for algorithms or likes, but for the human soul. Success is one person feeling less alone because of what we made.',
      sender: users[8]._id,
      conversation: conversations[10]._id,
      type: 'text',
      reactions: [
        { user: users[6]._id, emoji: '🌟', timestamp: new Date() },
        { user: users[1]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[2]._id, emoji: '✨', timestamp: new Date() },
        { user: users[11]._id, emoji: '🔥', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 950000)
    },

    // ========================================
    // Additional Soul Craft Society Messages
    // ========================================
    {
      content: 'Update: Our second workshop had 45 people. Word is spreading. People are hungry for this.',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 500000)
    },
    {
      content: 'That\'s more than double! What changed?',
      sender: users[10]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 495000)
    },
    {
      content: 'People from the first workshop told their stories. Authentic transformation is contagious. You can\'t fake this kind of change.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 490000)
    },
    {
      content: 'That banking woman? She quit her job. Enrolled in a wildlife photography course. Her family thinks she\'s crazy, but her eyes are alive again.',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [
        { user: users[8]._id, emoji: '🔥', timestamp: new Date() },
        { user: users[0]._id, emoji: '🙏', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 485000)
    },
    {
      content: 'This is exactly why we exist. To give people permission to choose aliveness over approval.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[9]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 480000)
    },

    // ========================================
    // Recent Messages for Active Feel
    // ========================================
    {
      content: 'Morning everyone! Starting the day with gratitude for this circle of conscious souls 🙏',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 120000)
    },
    {
      content: 'Aadhya, your energy is infectious! Ready to change more lives today?',
      sender: users[4]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 60000)
    },
    {
      content: 'Always ready. Every soul we help discover their craft is a ripple that changes the world.',
      sender: users[0]._id,
      conversation: conversations[7]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 30000)
    }
  ];

  for (const msg of messagesData) {
    const message = new Message(msg);
    await message.save();
  }

  console.log(`✅ Created ${messagesData.length} meaningful messages`);
};

/**
 * Run seed
 */
const seedDB = async () => {
  console.log('🌱 Starting enriched database seed...\n');
  try {
    await connectDB();
    await clearData();

    const users = await createUsers();
    const conversations = await createConversations(users);
    await createMessages(conversations, users);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('✨ Rich conversations ready to showcase authentic connection!');
    console.log('\n📧 Sample Login:');
    console.log('   Email: aadhya@connexus.com');
    console.log('   Password: Password123');
    console.log('\n💫 What you\'ll find:');
    console.log('   🎯 Soul Craft Society - NGO helping people find their calling');
    console.log('   🎵 Raag & Resonance - Music as healing therapy');
    console.log('   🚀 Project Quantum - Consciousness technology vision');
    console.log('   🏔️ Wanderlust Souls - Travel as transformation');
    console.log('   ✨ Deep conversations revealing character through authentic dialogue');
    console.log('\n🌟 All conversations showcase:');
    console.log('   → Purpose-driven missions');
    console.log('   → Authentic vulnerability');
    console.log('   → Conscious creation');
    console.log('   → Soul-level connection');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDB();