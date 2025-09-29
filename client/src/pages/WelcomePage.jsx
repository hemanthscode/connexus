import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, MessageSquare, Users, Zap, Shield, Sparkles, CheckCircle,
  Camera, Bell, Globe
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useToast } from '@/components/ui/Toast.jsx'

// Configuration constants
const WELCOME_CONFIG = {
  STEPS: [
    {
      id: 'welcome',
      title: 'Welcome to Connexus',
      subtitle: 'Connect, chat, and collaborate with people around the world'
    },
    {
      id: 'profile',
      title: 'Set up your profile',
      subtitle: 'Help others get to know you better'
    },
    {
      id: 'notifications',
      title: 'Stay informed',
      subtitle: 'Configure your notification preferences'
    },
    {
      id: 'ready',
      title: 'You\'re all set!',
      subtitle: 'Start connecting with others'
    }
  ],
  FEATURES: [
    {
      icon: MessageSquare,
      title: 'Real-time Messaging',
      description: 'Chat instantly with friends and colleagues'
    },
    {
      icon: Users,
      title: 'Group Conversations',
      description: 'Create groups and collaborate together'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Powered by modern technology for speed'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and safe'
    }
  ],
  NOTIFICATION_OPTIONS: [
    {
      key: 'messages',
      icon: MessageSquare,
      title: 'New Messages',
      description: 'Get notified when you receive messages'
    },
    {
      key: 'mentions',
      icon: Bell,
      title: 'Mentions & Replies',
      description: 'When someone mentions or replies to you'
    },
    {
      key: 'sounds',
      icon: Globe,
      title: 'Sound Effects',
      description: 'Play sounds for notifications'
    }
  ],
  READY_FEATURES: [
    'Start your first conversation',
    'Create or join groups',
    'Customize your settings'
  ]
}

const WelcomePage = () => {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  
  const [state, setState] = useState({
    currentStep: 0,
    completedSteps: new Set(),
    isCompleting: false,
    profileData: {
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || null
    },
    notificationSettings: {
      messages: true,
      mentions: true,
      sounds: true
    }
  })

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user?.isOnboarded === true) {
      navigate('/chat', { replace: true })
    }
  }, [user?.isOnboarded, navigate])

  // Memoized handlers
  const handlers = useMemo(() => ({
    handleNext: () => {
      setState(prev => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, prev.currentStep]),
        currentStep: prev.currentStep < WELCOME_CONFIG.STEPS.length - 1 
          ? prev.currentStep + 1 
          : prev.currentStep
      }))
      
      if (state.currentStep === WELCOME_CONFIG.STEPS.length - 1) {
        handlers.handleComplete()
      }
    },

    handlePrevious: () => {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep > 0 ? prev.currentStep - 1 : 0
      }))
    },

    handleSkip: () => {
      setState(prev => ({ ...prev, currentStep: WELCOME_CONFIG.STEPS.length - 1 }))
    },

    handleComplete: async () => {
      setState(prev => ({ ...prev, isCompleting: true }))
      
      try {
        const result = await updateProfile({
          ...state.profileData,
          isOnboarded: true
        })
        
        if (result.success) {
          toast.success('Welcome to Connexus! 🎉')
          setTimeout(() => navigate('/chat', { replace: true }), 1000)
        } else {
          throw new Error(result.error || 'Failed to complete onboarding')
        }
      } catch (error) {
        console.error('Onboarding completion failed:', error)
        toast.error('Failed to complete onboarding')
        setTimeout(() => navigate('/chat', { replace: true }), 2000)
      } finally {
        setState(prev => ({ ...prev, isCompleting: false }))
      }
    },

    handleProfileUpdate: (data) => {
      setState(prev => ({
        ...prev,
        profileData: { ...prev.profileData, ...data }
      }))
    },

    handleNotificationToggle: (key) => {
      setState(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [key]: !prev.notificationSettings[key]
        }
      }))
    }
  }), [state, updateProfile, toast, navigate])

  if (!user) {
    return (
      <div className="h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg" />
        
        {/* Floating elements */}
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="p-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                Step {state.currentStep + 1} of {WELCOME_CONFIG.STEPS.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((state.currentStep + 1) / WELCOME_CONFIG.STEPS.length) * 100)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((state.currentStep + 1) / WELCOME_CONFIG.STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StepRenderer
                  step={WELCOME_CONFIG.STEPS[state.currentStep]}
                  stepIndex={state.currentStep}
                  state={state}
                  handlers={handlers}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// Unified step renderer
const StepRenderer = ({ step, stepIndex, state, handlers }) => {
  const stepProps = {
    step,
    onNext: handlers.handleNext,
    onPrevious: handlers.handlePrevious,
    onSkip: handlers.handleSkip,
    onComplete: handlers.handleComplete,
    canGoBack: stepIndex > 0,
    canSkip: stepIndex < WELCOME_CONFIG.STEPS.length - 1,
    isCompleting: state.isCompleting,
    ...state,
    ...handlers
  }

  switch (step.id) {
    case 'welcome':
      return <WelcomeStep {...stepProps} />
    case 'profile':
      return <ProfileStep {...stepProps} />
    case 'notifications':
      return <NotificationStep {...stepProps} />
    case 'ready':
      return <ReadyStep {...stepProps} />
    default:
      return null
  }
}

// Step components
const WelcomeStep = ({ step, onNext }) => (
  <div className="text-center space-y-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="flex justify-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-400/20">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
    </motion.div>

    <div>
      <h1 className="text-3xl font-bold text-white mb-3">{step.title}</h1>
      <p className="text-gray-400 text-lg">{step.subtitle}</p>
    </div>

    <div className="space-y-4">
      {WELCOME_CONFIG.FEATURES.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          className="glass rounded-lg p-4 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            <feature.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{feature.title}</h3>
            <p className="text-sm text-gray-400">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        rightIcon={<ArrowRight className="w-5 h-5" />}
        className="w-full"
      >
        Get Started
      </Button>
    </motion.div>
  </div>
)

const ProfileStep = ({ step, onNext, onPrevious, canGoBack, profileData, handleProfileUpdate }) => {
  const toast = useToast()

  const handleNext = () => {
    if (!profileData.name.trim()) {
      toast.error('Please enter your name')
      return
    }
    onNext()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-gray-400">{step.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <div className="relative inline-block">
            <img
              src={profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'U')}&size=100`}
              alt="Profile"
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white hover:bg-cyan-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Display Name"
            value={profileData.name}
            onChange={(e) => handleProfileUpdate({ name: e.target.value })}
            placeholder="Enter your name"
            required
          />
          
          <Input
            label="Bio (Optional)"
            value={profileData.bio}
            onChange={(e) => handleProfileUpdate({ bio: e.target.value })}
            placeholder="Tell us about yourself"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {canGoBack && (
          <Button variant="ghost" onClick={onPrevious} className="flex-1">
            Previous
          </Button>
        )}
        <Button 
          variant="primary" 
          onClick={handleNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

const NotificationStep = ({ step, onNext, onPrevious, canGoBack, notificationSettings, handleNotificationToggle }) => (
  <div className="space-y-8">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
      <p className="text-gray-400">{step.subtitle}</p>
    </div>

    <div className="space-y-4">
      {WELCOME_CONFIG.NOTIFICATION_OPTIONS.map((option) => (
        <div key={option.key} className="glass rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-cyan-400">
              <option.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-white">{option.title}</h3>
              <p className="text-sm text-gray-400">{option.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => handleNotificationToggle(option.key)}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors',
              notificationSettings[option.key] ? 'bg-cyan-500' : 'bg-gray-600'
            )}
          >
            <div
              className={clsx(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                notificationSettings[option.key] && 'translate-x-6'
              )}
            />
          </button>
        </div>
      ))}
    </div>

    <div className="flex gap-3">
      {canGoBack && (
        <Button variant="ghost" onClick={onPrevious} className="flex-1">
          Previous
        </Button>
      )}
      <Button 
        variant="primary" 
        onClick={onNext}
        rightIcon={<ArrowRight className="w-4 h-4" />}
        className="flex-1"
      >
        Continue
      </Button>
    </div>
  </div>
)

const ReadyStep = ({ step, onComplete, isCompleting }) => (
  <div className="text-center space-y-8">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      className="flex justify-center"
    >
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
      </div>
    </motion.div>

    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
      <p className="text-gray-400">{step.subtitle}</p>
    </div>

    <div className="glass rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-white">What's next?</h3>
      <ul className="space-y-3 text-sm text-gray-300">
        {WELCOME_CONFIG.READY_FEATURES.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    </div>

    <Button
      variant="primary"
      size="lg"
      onClick={onComplete}
      loading={isCompleting}
      rightIcon={<ArrowRight className="w-5 h-5" />}
      className="w-full"
    >
      {isCompleting ? 'Setting up...' : 'Start Chatting'}
    </Button>
  </div>
)

export default WelcomePage
