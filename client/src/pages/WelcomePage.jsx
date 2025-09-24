import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  MessageSquare, 
  Users, 
  Zap, 
  Shield,
  Sparkles,
  CheckCircle,
  Camera,
  Bell,
  Globe
} from 'lucide-react'
import { clsx } from 'clsx'
import Button from '@/components/ui/Button.jsx'
import Input from '@/components/ui/Input.jsx'
import { useAuth } from '@/hooks/useAuth.jsx'
import { useToast } from '@/components/ui/Toast.jsx'

const WelcomePage = () => {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isCompleting, setIsCompleting] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || null
  })

  // Check if user has already completed onboarding
  useEffect(() => {
    // If user is already onboarded (explicitly true), redirect to chat
    if (user?.isOnboarded === true) {
      console.log('User already onboarded, redirecting to chat')
      navigate('/chat', { replace: true })
    }
  }, [user?.isOnboarded, navigate])

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Connexus',
      subtitle: 'Connect, chat, and collaborate with people around the world',
      component: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Set up your profile',
      subtitle: 'Help others get to know you better',
      component: ProfileStep
    },
    {
      id: 'notifications',
      title: 'Stay informed',
      subtitle: 'Configure your notification preferences',
      component: NotificationStep
    },
    {
      id: 'ready',
      title: 'You\'re all set!',
      subtitle: 'Start connecting with others',
      component: ReadyStep
    }
  ]

  const handleNext = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    setCurrentStep(steps.length - 1)
  }, [steps.length])

  const handleComplete = useCallback(async () => {
    setIsCompleting(true)
    
    try {
      console.log('Completing onboarding with profile data:', profileData)
      
      // Update user profile with onboarded status
      const result = await updateProfile({
        ...profileData,
        isOnboarded: true
      })
      
      if (result.success) {
        console.log('Onboarding completed successfully')
        toast.success('Welcome to Connexus! 🎉')
        
        // Force navigation to chat
        setTimeout(() => {
          navigate('/chat', { replace: true })
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error)
      toast.error('Failed to complete onboarding')
      
      // Fallback: navigate anyway since user can complete profile later
      setTimeout(() => {
        console.log('Fallback navigation to chat')
        navigate('/chat', { replace: true })
      }, 2000)
    } finally {
      setIsCompleting(false)
    }
  }, [profileData, updateProfile, toast, navigate])

  const handleProfileUpdate = useCallback((data) => {
    setProfileData(prev => ({ ...prev, ...data }))
  }, [])

  const CurrentStepComponent = steps[currentStep]?.component

  // Show loading if user data is not loaded yet
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
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
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
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
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
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent
                  step={steps[currentStep]}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSkip={handleSkip}
                  onComplete={handleComplete}
                  canGoBack={currentStep > 0}
                  canSkip={currentStep < steps.length - 1}
                  isCompleting={isCompleting}
                  user={user}
                  profileData={profileData}
                  onProfileUpdate={handleProfileUpdate}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ... (rest of the components remain the same)

// Welcome Step Component
const WelcomeStep = ({ step, onNext }) => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Real-time Messaging',
      description: 'Chat instantly with friends and colleagues'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Group Conversations',
      description: 'Create groups and collaborate together'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Lightning Fast',
      description: 'Powered by modern technology for speed'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and safe'
    }
  ]

  return (
    <div className="text-center space-y-8">
      {/* Logo */}
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

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-3">{step.title}</h1>
        <p className="text-gray-400 text-lg">{step.subtitle}</p>
      </div>

      {/* Features */}
      <div className="space-y-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="glass rounded-lg p-4 flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
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
}

// Profile Setup Step
const ProfileStep = ({ step, onNext, onPrevious, canGoBack, user, profileData, onProfileUpdate }) => {
  const toast = useToast()

  const handleNext = () => {
    if (!profileData.name.trim()) {
      toast.error('Please enter your name')
      return
    }
    onNext()
  }

  const handleInputChange = (field, value) => {
    onProfileUpdate({ [field]: value })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-gray-400">{step.subtitle}</p>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
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

        {/* Form */}
        <div className="space-y-4">
          <Input
            label="Display Name"
            value={profileData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your name"
            required
          />
          
          <Input
            label="Bio (Optional)"
            value={profileData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
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

// Notification Preferences Step
const NotificationStep = ({ step, onNext, onPrevious, canGoBack }) => {
  const [settings, setSettings] = useState({
    messages: true,
    mentions: true,
    sounds: true,
    desktop: false
  })

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const notificationOptions = [
    {
      key: 'messages',
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'New Messages',
      description: 'Get notified when you receive messages'
    },
    {
      key: 'mentions',
      icon: <Bell className="w-5 h-5" />,
      title: 'Mentions & Replies',
      description: 'When someone mentions or replies to you'
    },
    {
      key: 'sounds',
      icon: <Globe className="w-5 h-5" />,
      title: 'Sound Effects',
      description: 'Play sounds for notifications'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-gray-400">{step.subtitle}</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="glass rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="text-cyan-400">
                {option.icon}
              </div>
              <div>
                <h3 className="font-medium text-white">{option.title}</h3>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => toggleSetting(option.key)}
              className={clsx(
                'relative w-12 h-6 rounded-full transition-colors',
                settings[option.key] ? 'bg-cyan-500' : 'bg-gray-600'
              )}
            >
              <div
                className={clsx(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  settings[option.key] && 'translate-x-6'
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
}

// Ready Step
const ReadyStep = ({ step, onComplete, isCompleting }) => {
  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
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
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Start your first conversation
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Create or join groups
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Customize your settings
          </li>
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
}

export default WelcomePage
