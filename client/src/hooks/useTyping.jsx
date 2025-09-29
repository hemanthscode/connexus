import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSocket } from './useSocket.jsx'
import { useAuth } from './useAuth.jsx'
import { debounce, throttle } from '@/utils/helpers.js'
import { DEBUG, UI_CONFIG } from '@/utils/constants.js'

// Configuration constants
const TYPING_CONFIG = {
  TIMEOUT: UI_CONFIG.TYPING_TIMEOUT || 3000,
  THROTTLE_DELAY: 1000,
  MAX_USERS: 3,
  MIN_INPUT_LENGTH: 1,
  DEBOUNCE_DELAY: 300,
}

// Main typing hook
export const useTyping = (conversationId, options = {}) => {
  const config = { ...TYPING_CONFIG, ...options }
  
  const { 
    getTypingUsers, 
    emitTypingStart, 
    emitTypingStop, 
    isConnected 
  } = useSocket()
  const { user: currentUser } = useAuth()

  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  
  const typingTimeoutRef = useRef(null)
  const isCurrentlyTyping = useRef(false)
  const lastTypingEmit = useRef(0)

  // Get typing users for conversation
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([])
      return
    }

    const users = getTypingUsers(conversationId)
    const filteredUsers = users
      .filter(u => u.userId !== currentUser?._id)
      .slice(0, config.maxTypingUsers || config.MAX_USERS)
    
    setTypingUsers(filteredUsers)

    if (DEBUG.SOCKET_LOGS && filteredUsers.length > 0) {
      console.log('Typing users in conversation:', conversationId, filteredUsers)
    }
  }, [conversationId, getTypingUsers, currentUser?._id, config.MAX_USERS])

  // Optimized typing handlers
  const typingHandlers = useMemo(() => {
    const throttledStart = throttle(() => {
      if (!conversationId || !isConnected) return

      const now = Date.now()
      if (now - lastTypingEmit.current > config.THROTTLE_DELAY) {
        emitTypingStart(conversationId)
        lastTypingEmit.current = now
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('Emitted typing start for conversation:', conversationId)
        }
      }
    }, config.THROTTLE_DELAY)

    const debouncedStop = debounce(() => {
      if (isCurrentlyTyping.current && conversationId && isConnected) {
        emitTypingStop(conversationId)
        isCurrentlyTyping.current = false
        setIsTyping(false)
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('Emitted typing stop for conversation:', conversationId)
        }
      }
    }, config.TIMEOUT)

    const startTyping = () => {
      if (!conversationId || !isConnected) return

      setIsTyping(true)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Emit typing start if not already typing
      if (!isCurrentlyTyping.current) {
        throttledStart()
        isCurrentlyTyping.current = true
      }

      // Auto-stop after timeout
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping()
      }, config.TIMEOUT)

      // Trigger debounced stop
      debouncedStop()
    }

    const stopTyping = () => {
      if (!conversationId || !isConnected) return

      setIsTyping(false)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      if (isCurrentlyTyping.current) {
        emitTypingStop(conversationId)
        isCurrentlyTyping.current = false
      }
    }

    return { startTyping, stopTyping, throttledStart, debouncedStop }
  }, [conversationId, isConnected, emitTypingStart, emitTypingStop, config.THROTTLE_DELAY, config.TIMEOUT])

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      if (isCurrentlyTyping.current && conversationId && isConnected) {
        emitTypingStop(conversationId)
      }
    }
  }, [conversationId, isConnected, emitTypingStop])

  // Format typing users for display
  const formattedTypingUsers = useMemo(() => {
    if (typingUsers.length === 0) return null

    const names = typingUsers.map(u => u.user?.name || 'Someone')
    
    if (names.length === 1) {
      return `${names[0]} is typing...`
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`
    } else {
      return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing...`
    }
  }, [typingUsers])

  return {
    // State
    isTyping,
    typingUsers,
    hasTypingUsers: typingUsers.length > 0,
    typingCount: typingUsers.length,
    formattedTypingUsers,
    isConnected,
    
    // Actions
    startTyping: typingHandlers.startTyping,
    stopTyping: typingHandlers.stopTyping,
  }
}

// Multiple conversation typing hook
export const useMultipleTyping = (conversationIds = []) => {
  const { getTypingUsers } = useSocket()
  const { user: currentUser } = useAuth()
  
  const typingByConversation = useMemo(() => {
    const typingMap = new Map()
    
    conversationIds.forEach(conversationId => {
      const users = getTypingUsers(conversationId)
      const filteredUsers = users.filter(u => u.userId !== currentUser?._id)
      
      if (filteredUsers.length > 0) {
        typingMap.set(conversationId, filteredUsers)
      }
    })
    
    return typingMap
  }, [conversationIds, getTypingUsers, currentUser?._id])

  const utilities = useMemo(() => ({
    getTypingForConversation: (conversationId) => 
      typingByConversation.get(conversationId) || [],
    
    hasTypingInConversation: (conversationId) => 
      typingByConversation.has(conversationId),
    
    getTotalTypingCount: () => {
      let total = 0
      typingByConversation.forEach(users => {
        total += users.length
      })
      return total
    },
  }), [typingByConversation])

  return {
    typingByConversation: Object.fromEntries(typingByConversation),
    totalTypingCount: utilities.getTotalTypingCount(),
    hasAnyTyping: typingByConversation.size > 0,
    ...utilities,
  }
}

// Input typing detection hook
export const useInputTyping = (conversationId, options = {}) => {
  const config = { 
    minLength: TYPING_CONFIG.MIN_INPUT_LENGTH,
    debounceDelay: TYPING_CONFIG.DEBOUNCE_DELAY,
    enableOnFocus: true,
    enableOnBlur: true,
    ...options
  }

  const { startTyping, stopTyping, isTyping } = useTyping(conversationId)
  
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const previousValue = useRef('')
  const inputRef = useRef(null)

  // Debounced typing detection
  const debouncedTypingCheck = useMemo(() => 
    debounce((value, prevValue) => {
      const isActuallyTyping = value.length >= config.minLength && 
                              value !== prevValue && 
                              isFocused

      if (isActuallyTyping) {
        startTyping()
      } else {
        stopTyping()
      }
    }, config.debounceDelay),
    [config.minLength, config.debounceDelay, isFocused, startTyping, stopTyping]
  )

  // Input handlers
  const inputHandlers = useMemo(() => ({
    handleInputChange: (value) => {
      const prevValue = previousValue.current
      setInputValue(value)
      previousValue.current = value
      debouncedTypingCheck(value, prevValue)
    },

    handleFocus: () => {
      setIsFocused(true)
      if (config.enableOnFocus && inputValue.length >= config.minLength) {
        startTyping()
      }
    },

    handleBlur: () => {
      setIsFocused(false)
      if (config.enableOnBlur) {
        stopTyping()
      }
    },

    handleKeyDown: (event) => {
      // Stop typing on Enter (message sent)
      if (event.key === 'Enter' && !event.shiftKey) {
        stopTyping()
      }
    },
  }), [config, inputValue.length, startTyping, stopTyping, debouncedTypingCheck])

  // Cleanup
  useEffect(() => () => stopTyping(), [stopTyping])

  return {
    // Input props (can be spread directly)
    inputProps: {
      ref: inputRef,
      value: inputValue,
      onChange: (e) => inputHandlers.handleInputChange(e.target.value),
      onFocus: inputHandlers.handleFocus,
      onBlur: inputHandlers.handleBlur,
      onKeyDown: inputHandlers.handleKeyDown,
    },
    
    // State
    inputValue,
    isFocused,
    isTyping,
    
    // Actions
    setInputValue: inputHandlers.handleInputChange,
    clearInput: () => inputHandlers.handleInputChange(''),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }
}

// Form typing detection hook
export const useFormTyping = (conversationId, formRef) => {
  const { startTyping, stopTyping } = useTyping(conversationId)
  const [isFormTyping, setIsFormTyping] = useState(false)

  useEffect(() => {
    if (!formRef?.current) return

    const form = formRef.current
    const inputs = form.querySelectorAll('input, textarea')

    const handleInput = () => {
      if (!isFormTyping) {
        setIsFormTyping(true)
        startTyping()
      }
    }

    const handleBlur = () => {
      // Check if focus moved to another input in the same form
      setTimeout(() => {
        const activeElement = document.activeElement
        const isStillInForm = form.contains(activeElement)
        
        if (!isStillInForm && isFormTyping) {
          setIsFormTyping(false)
          stopTyping()
        }
      }, 100)
    }

    inputs.forEach(input => {
      input.addEventListener('input', handleInput)
      input.addEventListener('blur', handleBlur)
    })

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('input', handleInput)
        input.removeEventListener('blur', handleBlur)
      })
      
      if (isFormTyping) {
        stopTyping()
      }
    }
  }, [formRef, isFormTyping, startTyping, stopTyping])

  return {
    isFormTyping,
    stopFormTyping: () => {
      setIsFormTyping(false)
      stopTyping()
    }
  }
}

export default useTyping
