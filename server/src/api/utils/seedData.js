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
 * Create users with meaningful Telugu names and inspiring profiles
 */
const createUsers = async () => {
  console.log('👥 Creating users...');

  const usersData = [
    {
      name: 'Aadhya',
      email: 'aadhya@connexus.com',
      password: 'Password123',
      bio: 'Social impact enthusiast | Dreaming of a world where every soul finds its craft 🌟',
      location: 'Hyderabad, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg'
    },
    {
      name: 'Arjun',
      email: 'arjun@connexus.com',
      password: 'Password123',
      bio: 'Vocalist & storyteller | Music heals what words cannot express 🎵',
      location: 'Bangalore, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg'
    },
    {
      name: 'Kavya',
      email: 'kavya@connexus.com',
      password: 'Password123',
      bio: 'Mountain soul & wanderer | Collecting stories from every sunrise 🏔️',
      location: 'Vizag, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pinimg.com/1200x/d4/f0/61/d4f061ea1451bcca3fcb525026b4fb52.jpg'
    },
    {
      name: 'Dhruv',
      email: 'dhruv@connexus.com',
      password: 'Password123',
      bio: 'Innovation architect | Building tomorrow\'s solutions today ⚡',
      location: 'Mumbai, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/0b/97/6f/0b976f0a7aa1aa43870e1812eee5a55d.jpg'
    },
    {
      name: 'Sanvi',
      email: 'sanvi@connexus.com',
      password: 'Password123',
      bio: 'Community builder | Empowering voices that need to be heard 🌱',
      location: 'Chennai, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/ce/31/42/ce3142d7a968fff3aecd0100572a5e8b.jpg'
    },
    {
      name: 'Vihan',
      email: 'vihan@connexus.com',
      password: 'Password123',
      bio: 'Adventure seeker | Life is either a daring adventure or nothing at all 🎒',
      location: 'Pune, India',
      status: 'offline',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/2e/ae/fd/2eaefd75d164be0b17ef6f09749d0da8.jpg'
    },
    {
      name: 'Ishani',
      email: 'ishani@connexus.com',
      password: 'Password123',
      bio: 'Art therapist & dreamer | Crafting healing through creativity 🎨',
      location: 'Delhi, India',
      status: 'away',
      isActive: true,
      avatar: 'https://i.pinimg.com/1200x/96/9c/85/969c85920f4ed80f8f55007a0740b8bb.jpg'
    },
    {
      name: 'Anirudh',
      email: 'anirudh@connexus.com',
      password: 'Password123',
      bio: 'Strategic visionary | Turning impossible dreams into inevitable realities 🚀',
      location: 'Gurgaon, India',
      status: 'online',
      isActive: true,
      avatar: 'https://i.pinimg.com/736x/e4/6d/b4/e46db4eec520f0c870211b8b76ce2a64.jpg'
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

  // Direct: Aadhya <-> Sanvi (Soul Craft Society NGO Discussion)
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

  // Direct: Arjun <-> Ishani (Music & Healing)
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

  // Direct: Aadhya <-> Anirudh (Secret Project X)
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

  // Group: Wanderlust Souls 🌍
  const group1 = new Conversation({
    type: 'group',
    name: 'Wanderlust Souls 🌍',
    description: 'For souls who find home in journeys, not destinations',
    participants: [
      { user: users[2]._id, role: 'admin' },
      { user: users[0]._id, role: 'member' },
      { user: users[5]._id, role: 'member' },
      { user: users[1]._id, role: 'member' }
    ],
    createdBy: users[2]._id,
    avatar: 'https://ui-avatars.com/api/?name=Wanderlust+Souls&background=0891b2&color=fff'
  });
  await group1.save();
  conversations.push(group1);

  // Group: Voice & Rhythm 🎵
  const group2 = new Conversation({
    type: 'group',
    name: 'Voice & Rhythm 🎵',
    description: 'Where melodies meet emotions and stories find their tune',
    participants: [
      { user: users[1]._id, role: 'admin' },
      { user: users[6]._id, role: 'member' },
      { user: users[0]._id, role: 'member' },
      { user: users[4]._id, role: 'member' }
    ],
    createdBy: users[1]._id,
    avatar: 'https://ui-avatars.com/api/?name=Voice+Rhythm&background=7c3aed&color=fff'
  });
  await group2.save();
  conversations.push(group2);

  // Group: Dream Architects 🏗️
  const group3 = new Conversation({
    type: 'group',
    name: 'Dream Architects 🏗️',
    description: 'Building bridges between what is and what could be',
    participants: [
      { user: users[0]._id, role: 'admin' },
      { user: users[7]._id, role: 'member' },
      { user: users[3]._id, role: 'member' },
      { user: users[4]._id, role: 'member' }
    ],
    createdBy: users[0]._id,
    avatar: 'https://ui-avatars.com/api/?name=Dream+Architects&background=dc2626&color=fff'
  });
  await group3.save();
  conversations.push(group3);

  console.log(`✅ Created ${conversations.length} conversations`);
  return conversations;
};

/**
 * Create profound messages about dreams, ambitions, and life purpose
 */
const createMessages = async (conversations, users) => {
  console.log('📝 Creating meaningful messages...');

  const messagesData = [
    // Aadhya <-> Sanvi (Soul Craft Society NGO Discussion)
    {
      content: 'Sanvi, I\'ve been thinking about this idea for months now... What if we could create spaces where people discover their true calling?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7200000)
    },
    {
      content: 'Tell me more, Aadhya. I can hear the passion in your words. What does this vision look like?',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 7100000)
    },
    {
      content: 'I want to call it "Soul Craft Society" - an NGO that helps people find their authentic path. Too many brilliant minds are stuck in jobs that drain their spirit.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 7000000)
    },
    {
      content: 'That name... it gives me chills! "Soul Craft" - like helping people craft their soul\'s purpose. This is exactly what the world needs right now.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 6900000)
    },
    {
      content: 'Exactly! Imagine workshops where a software engineer discovers they\'re meant to be a storyteller, or an accountant realizes they\'re a natural healer.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6800000)
    },
    {
      content: 'We could have mentorship circles, skill discovery sessions, and even funding support for career transitions. This could change entire family trees!',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🔥', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 6700000)
    },
    {
      content: 'Yes! And the ripple effect... when people live their authentic purpose, they raise children who believe in following their dreams. We\'re not just changing careers, we\'re changing generations.',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '❤️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 6600000)
    },
    {
      content: 'I\'m getting emotional thinking about this. How do we start? I want to be part of making this dream a reality.',
      sender: users[4]._id,
      conversation: conversations[0]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6500000)
    },
    {
      content: 'Let\'s start small - maybe a weekend workshop series. "Discover Your Soul Craft" - helping 20 people find their calling. Are you in as co-founder?',
      sender: users[0]._id,
      conversation: conversations[0]._id,
      type: 'text',
      reactions: [{ user: users[4]._id, emoji: '🎉', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 6400000)
    },

    // Arjun <-> Ishani (Music & Healing)
    {
      content: 'Ishani, I had the most incredible experience yesterday while practicing. The raag seemed to unlock something deep inside me.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 6000000)
    },
    {
      content: 'Music does that, Arjun. It\'s like a key to rooms in our soul we didn\'t even know existed. Which raag were you exploring?',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5900000)
    },
    {
      content: 'Raag Yaman... as I hit the madhyam, memories from childhood flooded back. I could see my grandmother\'s face, feel her hand on my head blessing me.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🕉️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5800000)
    },
    {
      content: 'That\'s the magic of Indian classical music - it doesn\'t just create sound, it creates portals to our deepest memories and emotions. Your voice is your healing instrument.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5700000)
    },
    {
      content: 'I\'ve been thinking... what if we combined your art therapy with music? Imagine sessions where people paint while I sing, letting the raag guide their brushstrokes.',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5600000)
    },
    {
      content: 'Arjun, that\'s brilliant! Music and visual art together could create such profound healing experiences. The vibrations from your voice could literally move through their creative expression.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 5500000)
    },
    {
      content: 'We could call it "Raag Therapy" - using specific raags for different emotional states. Bhairav for grounding, Malkauns for introspection, Darbari for strength...',
      sender: users[1]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[6]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5400000)
    },
    {
      content: 'This could help so many people process trauma, depression, anxiety... Music reaches places where words fail. Your voice could be someone\'s path to healing.',
      sender: users[6]._id,
      conversation: conversations[1]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🙏', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 5300000)
    },

    // Aadhya <-> Anirudh (Secret Project X)
    {
      content: 'Anirudh, I need to tell someone about this vision that\'s been consuming me. Can I trust you with something big?',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4800000)
    },
    {
      content: 'Always, Aadhya. Your vision projects have this way of becoming reality. What\'s stirring in that brilliant mind of yours?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4700000)
    },
    {
      content: 'I want to create something that doesn\'t exist yet... A platform where human potential meets purposeful technology. Not just another app, but a movement.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '👁️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4600000)
    },
    {
      content: 'I\'m listening... Tell me more about this intersection of potential and purpose.',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4500000)
    },
    {
      content: 'Imagine if we could map human consciousness itself. Track not just what people do, but WHY they do it. Their authentic motivations, hidden talents, unexpressed dreams.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4400000)
    },
    {
      content: 'That\'s... that\'s like creating a GPS for the soul. The implications are staggering. How would something like that even work?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🌟', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4300000)
    },
    {
      content: 'AI that understands human essence, not just behavior patterns. Quantum computing meets ancient wisdom. Technology that serves consciousness, not the other way around.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 4200000)
    },
    {
      content: 'This is bigger than a startup. This is about evolving human civilization itself. When do we start building this impossible dream?',
      sender: users[7]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🚀', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4100000)
    },
    {
      content: 'We already started, Anirudh. Every conversation like this, every person who dares to dream beyond the possible - that\'s how we build it.',
      sender: users[0]._id,
      conversation: conversations[2]._id,
      type: 'text',
      reactions: [{ user: users[7]._id, emoji: '🔥', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 4000000)
    },

    // Wanderlust Souls Group
    {
      content: 'Just got back from Spiti Valley and I can\'t put into words what that place did to my soul 🏔️',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      content: 'Kavya! We\'ve been waiting for your stories. Spiti has this way of rewiring how you see life, doesn\'t it?',
      sender: users[0]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3500000)
    },
    {
      content: 'The silence there is so profound, you can hear your own thoughts crystallizing. I understood things about myself that I\'d been avoiding for years.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [
        { user: users[5]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[1]._id, emoji: '✨', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 3400000)
    },
    {
      content: 'That\'s what mountains do - they strip away everything artificial and leave you face to face with who you really are.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3300000)
    },
    {
      content: 'I met this old monk in Key Monastery. He said something that\'s been echoing in my mind: "Travel changes the geography of your soul."',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '🕉️', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3200000)
    },
    {
      content: 'That\'s beautiful. Every journey rewrites our internal map. I\'ve been planning a solo trek to Hampi - need that conversation with ancient stones.',
      sender: users[1]._id,
      conversation: conversations[3]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 3100000)
    },
    {
      content: 'Arjun, carry your voice to those ruins! Imagine singing in spaces where empires rose and fell. The acoustics of history.',
      sender: users[2]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🎵', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 3000000)
    },
    {
      content: 'Next month, monsoon trek to Western Ghats? We need that collective soul cleansing that only rain and mountains can provide.',
      sender: users[5]._id,
      conversation: conversations[3]._id,
      type: 'text',
      reactions: [
        { user: users[2]._id, emoji: '🌧️', timestamp: new Date() },
        { user: users[0]._id, emoji: '⛰️', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2900000)
    },

    // Voice & Rhythm Group
    {
      content: 'Had a breakthrough in my practice today. Finally nailed the transition in Raag Bhimpalasi that\'s been eluding me for months! 🎵',
      sender: users[1]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2500000)
    },
    {
      content: 'Arjun! That raag is pure emotion. I bet you could feel the difference in your entire being when you hit it right.',
      sender: users[6]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2400000)
    },
    {
      content: 'It was like... like finding a key I\'d been searching for. Suddenly every note had meaning, every silence had purpose.',
      sender: users[1]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '✨', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 2300000)
    },
    {
      content: 'Music is our direct line to the divine. When you sing from that authentic place, you\'re channeling something beyond yourself.',
      sender: users[4]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2200000)
    },
    {
      content: 'I want to record an album of healing raags. Not for fame or money, but to create something that could comfort people during their darkest moments.',
      sender: users[1]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [
        { user: users[6]._id, emoji: '🙏', timestamp: new Date() },
        { user: users[4]._id, emoji: '❤️', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 2100000)
    },
    {
      content: 'Arjun, that album could save lives. I\'ve seen how the right melody at the right moment can pull someone back from the edge.',
      sender: users[6]._id,
      conversation: conversations[4]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 2000000)
    },
    {
      content: 'We should collaborate on this! My community work has shown me how desperately people need authentic healing through arts.',
      sender: users[0]._id,
      conversation: conversations[4]._id,
      type: 'text',
      reactions: [{ user: users[1]._id, emoji: '🤝', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1900000)
    },

    // Dream Architects Group
    {
      content: 'I\'ve been thinking about something profound... What if our generation\'s purpose is to heal the disconnect between technology and humanity?',
      sender: users[0]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1500000)
    },
    {
      content: 'That\'s exactly what keeps me up at night, Aadhya. We have all this incredible tech power, but we\'re using it to separate rather than connect.',
      sender: users[7]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1400000)
    },
    {
      content: 'The future doesn\'t need more apps. It needs more consciousness. Technology that amplifies our humanity instead of replacing it.',
      sender: users[3]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [{ user: users[0]._id, emoji: '💡', timestamp: new Date() }],
      createdAt: new Date(Date.now() - 1300000)
    },
    {
      content: 'What if we created ventures that measure success not just in profits, but in lives transformed? Impact over income.',
      sender: users[4]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1200000)
    },
    {
      content: 'I have this vision of a new kind of organization. One that operates like a living system - growing, healing, adapting, serving the collective good.',
      sender: users[0]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [
        { user: users[7]._id, emoji: '🌱', timestamp: new Date() },
        { user: users[3]._id, emoji: '🔮', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 1100000)
    },
    {
      content: 'That\'s not just a business model, that\'s evolution. We\'re not just building companies, we\'re architecting the future of human collaboration.',
      sender: users[7]._id,
      conversation: conversations[5]._id,
      type: 'text',
      createdAt: new Date(Date.now() - 1000000)
    },
    {
      content: 'Every conversation like this is planting seeds for that future. We\'re not dreaming - we\'re remembering what\'s possible.',
      sender: users[0]._id,
      conversation: conversations[5]._id,
      type: 'text',
      reactions: [
        { user: users[4]._id, emoji: '🌟', timestamp: new Date() },
        { user: users[7]._id, emoji: '🚀', timestamp: new Date() }
      ],
      createdAt: new Date(Date.now() - 900000)
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
  console.log('🌱 Starting database seed for dreams and ambitions...\n');
  try {
    await connectDB();
    await clearData();

    const users = await createUsers();
    const conversations = await createConversations(users);
    await createMessages(conversations, users);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('✨ Your dream conversations are ready for LinkedIn screenshots!');
    console.log('📧 Login emails: aadhya@connexus.com, arjun@connexus.com, kavya@connexus.com');
    console.log('🔑 Password: Password123');
    console.log('\n💫 Featured conversations:');
    console.log('  🎯 Soul Craft Society NGO vision');
    console.log('  🎵 Music & healing through raags');
    console.log('  🏔️ Travel as soul transformation');
    console.log('  🚀 Secret visionary project discussions');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDB();
