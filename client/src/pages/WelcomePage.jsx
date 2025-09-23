import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { 
  MessageCircle, Users, Zap, Shield, ArrowRight, Menu, X, 
  ChevronDown, Globe, Lock, Wifi, Star
} from 'lucide-react';

// Clean animation configurations
const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  },
  stagger: {
    animate: {
      transition: { staggerChildren: 0.1 }
    }
  }
};

// Section wrapper component
const Section = ({ children, className = "", id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={animations.stagger}
      className={`min-h-screen flex items-center justify-center px-6 py-20 ${className}`}
    >
      <div className="w-full max-w-7xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description, delay = 0 }) => (
  <motion.div
    variants={animations.fadeInUp}
    transition={{ delay: delay * 0.1 }}
    whileHover={{ scale: 1.02, y: -5 }}
    className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-300"
  >
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl mb-6 text-white shadow-lg"
    >
      {icon}
    </motion.div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

const WelcomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], ['0%', '15%']);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'technology', 'get-started'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const navigateToAuth = (path) => {
    window.location.href = path;
  };

  const features = [
    { 
      icon: <Zap className="w-7 h-7" />, 
      title: "Lightning Fast", 
      description: "Real-time messaging with WebSocket technology for instant communication across all devices." 
    },
    { 
      icon: <Users className="w-7 h-7" />, 
      title: "Smart Rooms", 
      description: "Create unlimited chat rooms with custom settings and advanced moderation tools." 
    },
    { 
      icon: <Shield className="w-7 h-7" />, 
      title: "Secure by Design", 
      description: "Enterprise-grade security with JWT authentication and encrypted data transmission." 
    },
    { 
      icon: <Globe className="w-7 h-7" />, 
      title: "Cross-Platform", 
      description: "Perfect experience on desktop, tablet, and mobile with responsive design." 
    },
    { 
      icon: <Lock className="w-7 h-7" />, 
      title: "Privacy First", 
      description: "Your conversations are private with end-to-end encryption and zero data mining." 
    },
    { 
      icon: <Wifi className="w-7 h-7" />, 
      title: "Always Connected", 
      description: "Automatic reconnection and offline message sync keep you always in touch." 
    }
  ];

  const steps = [
    { 
      step: "01", 
      title: "Create Account", 
      description: "Sign up with your email in under 30 seconds with secure verification." 
    },
    { 
      step: "02", 
      title: "Join Rooms", 
      description: "Browse existing rooms or create your own with custom themes and settings." 
    },
    { 
      step: "03", 
      title: "Start Chatting", 
      description: "Begin conversations with real-time messaging and advanced features." 
    }
  ];

  const navigationItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'technology', label: 'Technology' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-slate-900 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => scrollToSection('home')}
            >
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">Connexus</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-semibold transition-colors relative ${
                    activeSection === item.id 
                      ? 'text-slate-900' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-slate-900 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
              
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-slate-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToAuth('/login')}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToAuth('/register')}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                >
                  Get Started
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pb-4 border-t border-slate-200"
            >
              <div className="space-y-2 pt-4">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="block w-full text-left py-3 px-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="flex space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => navigateToAuth('/login')}
                    className="flex-1 px-4 py-3 text-sm font-medium border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigateToAuth('/register')}
                    className="flex-1 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <Section id="home" className="pt-20">
        <motion.div 
          style={{ y: heroY }} 
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            variants={animations.fadeInUp}
            className="inline-flex items-center px-6 py-3 bg-slate-900/5 rounded-full border border-slate-300/30 mb-8"
          >
            <Star className="w-4 h-4 mr-2 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Built with Modern Technologies</span>
          </motion.div>
          
          <motion.h1
            variants={animations.fadeInUp}
            className="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 leading-tight"
          >
            Connect<span className="text-slate-500">.</span><br />
            Chat<span className="text-slate-500">.</span><br />
            <span className="text-slate-700">Collaborate</span>
          </motion.h1>
          
          <motion.p
            variants={animations.fadeInUp}
            className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Experience next-generation real-time communication with enterprise-grade security 
            and lightning-fast performance.
          </motion.p>
          
          <motion.div
            variants={animations.fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToAuth('/register')}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('features')}
              className="border-2 border-slate-300 text-slate-700 px-10 py-4 rounded-2xl font-semibold text-lg hover:border-slate-400 hover:bg-white/80 transition-all"
            >
              Explore Features
            </motion.button>
          </motion.div>
          
          <motion.button
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() => scrollToSection('features')}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronDown className="w-8 h-8" />
          </motion.button>
        </motion.div>
      </Section>

      {/* Features Section */}
      <Section id="features">
        <motion.div variants={animations.fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Powerful <span className="text-slate-600">Features</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Every feature engineered for performance and designed for simplicity.
          </p>
        </motion.div>

        <motion.div
          variants={animations.stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index}
            />
          ))}
        </motion.div>
      </Section>

      {/* How It Works Section */}
      <Section id="how-it-works" className="bg-gradient-to-b from-white/50 to-slate-50/30">
        <motion.div variants={animations.fadeInUp} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Getting Started is <span className="text-slate-600">Simple</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From signup to your first conversation in under 60 seconds.
          </p>
        </motion.div>

        <motion.div
          variants={animations.stagger}
          className="grid md:grid-cols-3 gap-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={animations.fadeInUp}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 text-white rounded-3xl text-xl font-bold mb-8 shadow-xl"
              >
                {step.step}
              </motion.div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed text-lg max-w-sm mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* Technology Section */}
      <Section id="technology">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={animations.fadeInUp}>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Built with <span className="text-slate-600">Modern Tech</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Our technology stack is carefully chosen for reliability, performance, and scalability.
            </p>
            
            <motion.div
              variants={animations.stagger}
              className="grid grid-cols-2 gap-6 mb-10"
            >
              {[
                { name: 'React', desc: 'Modern UI framework' },
                { name: 'Node.js', desc: 'Scalable backend' },
                { name: 'MongoDB', desc: 'NoSQL database' },
                { name: 'WebSocket', desc: 'Real-time communication' }
              ].map((tech, index) => (
                <motion.div
                  key={tech.name}
                  variants={animations.fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/70 p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="font-bold text-slate-900 mb-1">{tech.name}</div>
                  <div className="text-slate-600 text-sm">{tech.desc}</div>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div
              variants={animations.fadeInUp}
              className="flex flex-wrap gap-3"
            >
              {['JWT Auth', 'Real-time', 'Responsive', 'Secure'].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div
            variants={animations.fadeInUp}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 rounded-3xl p-8 border border-slate-200/50 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-xs text-slate-500">connexus.app</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4 max-w-xs">
                  <p className="text-sm">Hey! The new chat system is incredibly fast! 🚀</p>
                  <div className="text-xs text-slate-500 mt-1">2:34 PM</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 justify-end">
                <div className="bg-slate-900 text-white rounded-2xl rounded-tr-sm p-4 max-w-xs">
                  <p className="text-sm">I know right! Real-time feels magical ✨</p>
                  <div className="text-xs text-slate-300 mt-1">2:34 PM</div>
                </div>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  B
                </div>
              </div>
              
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                <div className="w-6 h-6 bg-slate-300 rounded-full"></div>
                <div className="flex-1 h-3 bg-slate-200 rounded-full"></div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Get Started Section */}
      <Section id="get-started">
        <motion.div variants={animations.fadeInUp} className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Ready to <span className="text-slate-600">Connect</span>?
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Join the modern way of communication. Create your account and start building connections today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToAuth('/register')}
              className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:bg-slate-800 transition-all"
            >
              Create Free Account
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToAuth('/login')}
              className="border-2 border-slate-300 text-slate-700 px-12 py-4 rounded-2xl font-semibold text-lg hover:border-slate-400 hover:bg-white/80 transition-all"
            >
              Sign In
            </motion.button>
          </div>

          <motion.div
            variants={animations.stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-slate-200"
          >
            <motion.div variants={animations.fadeInUp} className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">Free</div>
              <div className="text-slate-600 text-sm">Forever Plan</div>
            </motion.div>
            <motion.div variants={animations.fadeInUp} className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">30s</div>
              <div className="text-slate-600 text-sm">Quick Setup</div>
            </motion.div>
            <motion.div variants={animations.fadeInUp} className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">24/7</div>
              <div className="text-slate-600 text-sm">Always Available</div>
            </motion.div>
            <motion.div variants={animations.fadeInUp} className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">∞</div>
              <div className="text-slate-600 text-sm">Unlimited Messages</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-slate-200 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900">Connexus</span>
                <div className="text-sm text-slate-500">Next-gen communication</div>
              </div>
            </div>
            
            <div className="text-slate-600 text-center md:text-right">
              <p className="font-medium mb-1">Built with passion as an internship project</p>
              <p className="text-sm text-slate-500">Showcasing modern web development skills</p>
            </div>
          </motion.div>
          
          <div className="pt-8 border-t border-slate-200 text-center">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500 mb-4">
              <span>React 18</span>
              <span>•</span>
              <span>Node.js</span>
              <span>•</span>
              <span>MongoDB</span>
              <span>•</span>
              <span>WebSocket</span>
              <span>•</span>
              <span>JWT Auth</span>
            </div>
            <div className="text-xs text-slate-400">
              © 2024 Connexus • Crafted with modern web technologies
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;