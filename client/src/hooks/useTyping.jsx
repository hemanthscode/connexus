import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSocket } from './useSocket.jsx'
import { useAuth } from './useAuth.jsx'
import { debounce, throttle } from '@/utils/helpers.js'
import { DEBUG, UI_CONFIG } from '@/utils/constants.js'

/**
 * Hook for managing typing indicators in conversations
 */
export const useTyping = (conversationId, options = {}) => {
  const {
    typingTimeout = UI_CONFIG.TYPING_TIMEOUT,
    throttleDelay = 1000,
    showSelfTyping = false,
    maxTypingUsers = 3,
  } = options

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

  // Get typing users for this conversation
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([])
      return
    }

    const users = getTypingUsers(conversationId)
    
    // Filter out current user if not showing self typing
    const filteredUsers = showSelfTyping 
      ? users 
      : users.filter(u => u.userId !== currentUser?._id)

    // Limit number of typing users shown
    const limitedUsers = filteredUsers.slice(0, maxTypingUsers)
    
    setTypingUsers(limitedUsers)

    if (DEBUG.SOCKET_LOGS && limitedUsers.length > 0) {
      console.log('Typing users in conversation:', conversationId, limitedUsers)
    }
  }, [conversationId, getTypingUsers, showSelfTyping, currentUser, maxTypingUsers])

  // Throttled start typing function
  const throttledStartTyping = useCallback(
    throttle(() => {
      if (!conversationId || !isConnected) return

      const now = Date.now()
      
      // Only emit if enough time has passed since last emit
      if (now - lastTypingEmit.current > throttleDelay) {
        emitTypingStart(conversationId)
        lastTypingEmit.current = now
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('Emitted typing start for conversation:', conversationId)
        }
      }
    }, throttleDelay),
    [conversationId, isConnected, emitTypingStart, throttleDelay]
  )

  // Debounced stop typing function
  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isCurrentlyTyping.current && conversationId && isConnected) {
        emitTypingStop(conversationId)
        isCurrentlyTyping.current = false
        setIsTyping(false)
        
        if (DEBUG.SOCKET_LOGS) {
          console.log('Emitted typing stop for conversation:', conversationId)
        }
      }
    }, typingTimeout),
    [conversationId, isConnected, emitTypingStop, typingTimeout]
  )

  // Start typing function
  const startTyping = useCallback(() => {
    if (!conversationId || !isConnected) return

    setIsTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Emit typing start if not already typing
    if (!isCurrentlyTyping.current) {
      throttledStartTyping()
      isCurrentlyTyping.current = true
    }

    // Set timeout to automatically stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, typingTimeout)

    // Also trigger debounced stop
    debouncedStopTyping()
  }, [conversationId, isConnected, throttledStartTyping, debouncedStopTyping, typingTimeout])

  // Stop typing function
  const stopTyping = useCallback(() => {
    if (!conversationId || !isConnected) return

    setIsTyping(false)

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Emit stop typing if currently typing
    if (isCurrentlyTyping.current) {
      emitTypingStop(conversationId)
      isCurrentlyTyping.current = false
      
      if (DEBUG.SOCKET_LOGS) {
        console.log('Stopped typing for conversation:', conversationId)
      }
    }
  }, [conversationId, isConnected, emitTypingStop])

  // Clean up on unmount or conversation change
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
    
    // Actions
    startTyping,
    stopTyping,
    
    // Formatted display
    formattedTypingUsers,
    
    // Connection state
    isConnected,
  }
}

/**
 * Hook for managing typing indicators across multiple conversations
 */
export const useMultipleTyping = (conversationIds = []) => {
  const { getTypingUsers } = useSocket()
  const { user: currentUser } = useAuth()
  
  const [typingByConversation, setTypingByConversation] = useState(new Map())

  useEffect(() => {
    const typingMap = new Map()
    
    conversationIds.forEach(conversationId => {
      const users = getTypingUsers(conversationId)
      const filteredUsers = users.filter(u => u.userId !== currentUser?._id)
      
      if (filteredUsers.length > 0) {
        typingMap.set(conversationId, filteredUsers)
      }
    })
    
    setTypingByConversation(typingMap)
  }, [conversationIds, getTypingUsers, currentUser])

  const getTypingForConversation = useCallback((conversationId) => {
    return typingByConversation.get(conversationId) || []
  }, [typingByConversation])

  const hasTypingInConversation = useCallback((conversationId) => {
    return typingByConversation.has(conversationId)
  }, [typingByConversation])

  const getTotalTypingCount = useCallback(() => {
    let total = 0
    typingByConversation.forEach(users => {
      total += users.length
    })
    return total
  }, [typingByConversation])

  return {
    typingByConversation: Object.fromEntries(typingByConversation),
    getTypingForConversation,
    hasTypingInConversation,
    totalTypingCount: getTotalTypingCount(),
    hasAnyTyping: typingByConversation.size > 0,
  }
}

/**
 * Hook for input field typing detection
 */
export const useInputTyping = (conversationId, options = {}) => {
  const {
    minLength = 1,
    debounceDelay = 300,
    enableOnFocus = true,
    enableOnBlur = true,
  } = options

  const { startTyping, stopTyping, isTyping } = useTyping(conversationId)
  
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  
  const previousValue = useRef('')
  const inputRef = useRef(null)

  // Debounced typing detection
  const debouncedTypingCheck = useCallback(
    debounce((value, prevValue) => {
      const isActuallyTyping = value.length >= minLength && 
                              value !== prevValue && 
                              isFocused

      if (isActuallyTyping) {
        startTyping()
      } else {
        stopTyping()
      }
    }, debounceDelay),
    [minLength, debounceDelay, isFocused, startTyping, stopTyping]
  )

  // Handle input change
  const handleInputChange = useCallback((value) => {
    const prevValue = previousValue.current
    setInputValue(value)
    previousValue.current = value

    // Trigger typing detection
    debouncedTypingCheck(value, prevValue)
  }, [debouncedTypingCheck])

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    
    if (enableOnFocus && inputValue.length >= minLength) {
      startTyping()
    }
  }, [enableOnFocus, inputValue.length, minLength, startTyping])

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsFocused(false)
    
    if (enableOnBlur) {
      stopTyping()
    }
  }, [enableOnBlur, stopTyping])

  // Handle key events
  const handleKeyDown = useCallback((event) => {
    // Stop typing on Enter (message sent)
    if (event.key === 'Enter' && !event.shiftKey) {
      stopTyping()
    }
  }, [stopTyping])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTyping()
    }
  }, [stopTyping])

  return {
    // Input props
    inputProps: {
      ref: inputRef,
      value: inputValue,
      onChange: (e) => handleInputChange(e.target.value),
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
    },
    
    // State
    inputValue,
    isFocused,
    isTyping,
    
    // Actions
    setInputValue: handleInputChange,
    clearInput: () => handleInputChange(''),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }
}

/**
 * Hook for managing typing state in forms
 */
export const useFormTyping = (conversationId, formRef) => {
  const { startTyping, stopTyping } = useTyping(conversationId)
  const [isFormTyping, setIsFormTyping] = useState(false)

  // Monitor form inputs for typing activity
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

    const handleBlur = (event) => {
      // Check if focus is moving to another input in the same form
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
