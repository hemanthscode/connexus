import { useState, useEffect, useCallback, useRef } from 'react'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'
import { DEBUG } from '@/utils/constants.js'

// Default options
const DEFAULT_OPTIONS = {
  encrypt: false,
  serialize: true,
  deserialize: true,
  onError: null,
  syncAcrossTabs: true
}

// Common error handler
const handleError = (error, operation, key, onError) => {
  if (DEBUG.ENABLED) {
    console.warn(`Error ${operation} localStorage key "${key}":`, error)
  }
  onError?.(error, operation)
  return error
}

// Storage operations utility
const storageOperations = {
  read: (key, options) => {
    if (typeof window === 'undefined') return null
    
    const item = localStorage.getItem(key)
    if (!item) return null

    if (options.encrypt) {
      return decryptLocalStorageData(item)
    } else if (options.deserialize) {
      return JSON.parse(item)
    }
    return item
  },

  write: (key, value, options) => {
    if (typeof window === 'undefined') return
    
    if (value === null || value === undefined) {
      localStorage.removeItem(key)
      return
    }

    let stringValue
    if (options.encrypt) {
      stringValue = encryptLocalStorageData(value)
    } else if (options.serialize) {
      stringValue = JSON.stringify(value)
    } else {
      stringValue = value
    }
    
    localStorage.setItem(key, stringValue)
  },

  remove: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  }
}

export const useLocalStorage = (key, initialValue = null, options = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = storageOperations.read(key, config)
      return item !== null ? item : initialValue
    } catch (error) {
      handleError(error, 'read', key, config.onError)
      return initialValue
    }
  })

  const [error, setError] = useState(null)
  const valueRef = useRef(storedValue)

  useEffect(() => {
    valueRef.current = storedValue
  }, [storedValue])

  // Main setValue function
  const setValue = useCallback((value) => {
    try {
      setError(null)
      const valueToStore = value instanceof Function ? value(valueRef.current) : value
      
      setStoredValue(valueToStore)
      storageOperations.write(key, valueToStore, config)
    } catch (err) {
      const error = handleError(err, 'write', key, config.onError)
      setError(error)
    }
  }, [key, config])

  // Utility functions
  const utilities = useCallback(() => ({
    removeValue: () => {
      try {
        setError(null)
        setStoredValue(initialValue)
        storageOperations.remove(key)
      } catch (err) {
        const error = handleError(err, 'remove', key, config.onError)
        setError(error)
      }
    },

    clearAll: () => {
      try {
        setError(null)
        storageOperations.clear()
      } catch (err) {
        const error = handleError(err, 'clear', key, config.onError)
        setError(error)
      }
    },

    getSize: () => {
      try {
        if (typeof window === 'undefined') return 0
        const item = localStorage.getItem(key)
        return item ? new Blob([item]).size : 0
      } catch {
        return 0
      }
    },

    exists: () => {
      try {
        return typeof window !== 'undefined' && localStorage.getItem(key) !== null
      } catch {
        return false
      }
    }
  }), [key, initialValue, config])

  // Cross-tab synchronization
  useEffect(() => {
    if (!config.syncAcrossTabs || typeof window === 'undefined') return

    const handleStorageChange = (e) => {
      if (e.key !== key) return

      try {
        if (e.newValue !== null) {
          let newValue
          if (config.encrypt) {
            newValue = decryptLocalStorageData(e.newValue)
          } else if (config.deserialize) {
            newValue = JSON.parse(e.newValue)
          } else {
            newValue = e.newValue
          }
          setStoredValue(newValue)
        } else {
          setStoredValue(initialValue)
        }
      } catch (err) {
        const error = handleError(err, 'sync', key, config.onError)
        setError(error)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, config, initialValue])

  const utilityFunctions = utilities()

  return {
    value: storedValue,
    setValue,
    error,
    ...utilityFunctions
  }
}

// Multi-key localStorage object hook
export const useLocalStorageObject = (keyPrefix, initialState = {}, options = {}) => {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initialState

    const stored = {}
    for (const [key, defaultValue] of Object.entries(initialState)) {
      try {
        const storageKey = `${keyPrefix}_${key}`
        const item = storageOperations.read(storageKey, options)
        stored[key] = item !== null ? item : defaultValue
      } catch (error) {
        handleError(error, 'read', `${keyPrefix}_${key}`, options.onError)
        stored[key] = defaultValue
      }
    }
    return stored
  })

  const updateState = useCallback((updates) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates }
      
      // Update localStorage for each changed key
      for (const [key, value] of Object.entries(updates)) {
        try {
          const storageKey = `${keyPrefix}_${key}`
          storageOperations.write(storageKey, value, options)
        } catch (error) {
          handleError(error, 'write', `${keyPrefix}_${key}`, options.onError)
        }
      }
      
      return newState
    })
  }, [keyPrefix, options])

  const removeKeys = useCallback((keys) => {
    setState(prevState => {
      const newState = { ...prevState }
      
      for (const key of keys) {
        newState[key] = initialState[key]
        try {
          storageOperations.remove(`${keyPrefix}_${key}`)
        } catch (error) {
          handleError(error, 'remove', `${keyPrefix}_${key}`, options.onError)
        }
      }
      
      return newState
    })
  }, [keyPrefix, initialState, options])

  const clearAll = useCallback(() => {
    setState(initialState)
    for (const key of Object.keys(initialState)) {
      try {
        storageOperations.remove(`${keyPrefix}_${key}`)
      } catch (error) {
        handleError(error, 'remove', `${keyPrefix}_${key}`, options.onError)
      }
    }
  }, [keyPrefix, initialState, options])

  return { state, updateState, removeKeys, clearAll }
}

// Storage quota management hook
export const useLocalStorageQuota = () => {
  const [quota, setQuota] = useState(null)
  const [usage, setUsage] = useState(null)
  const [available, setAvailable] = useState(null)

  const checkQuota = useCallback(async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        setQuota(estimate.quota)
        setUsage(estimate.usage)
        setAvailable(estimate.quota - estimate.usage)
      } else {
        // Fallback: estimate localStorage usage
        let totalSize = 0
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length
          }
        }
        setUsage(totalSize)
        setQuota(null)
        setAvailable(null)
      }
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn('Error checking localStorage quota:', error)
      }
    }
  }, [])

  useEffect(() => {
    checkQuota()
  }, [checkQuota])

  const isQuotaExceeded = useCallback((threshold = 0.9) => {
    return quota && usage ? (usage / quota) > threshold : false
  }, [quota, usage])

  return {
    quota,
    usage,
    available,
    checkQuota,
    isQuotaExceeded,
    usagePercentage: quota && usage ? (usage / quota) * 100 : 0
  }
}

// Temporary storage with expiration
export const useTemporaryStorage = (key, initialValue = null, expirationMinutes = 60) => {
  const [value, setValue] = useState(() => {
    try {
      if (typeof window === 'undefined') return initialValue
      
      const item = localStorage.getItem(key)
      if (!item) return initialValue
      
      const { data, expiry } = JSON.parse(item)
      
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key)
        return initialValue
      }
      
      return data
    } catch {
      return initialValue
    }
  })

  const setTemporaryValue = useCallback((newValue, customExpirationMinutes = expirationMinutes) => {
    try {
      setValue(newValue)
      
      if (typeof window !== 'undefined') {
        const expiry = Date.now() + (customExpirationMinutes * 60 * 1000)
        const item = { data: newValue, expiry }
        localStorage.setItem(key, JSON.stringify(item))
      }
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error setting temporary storage key "${key}":`, error)
      }
    }
  }, [key, expirationMinutes])

  const removeTemporaryValue = useCallback(() => {
    setValue(initialValue)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }, [key, initialValue])

  return {
    value,
    setValue: setTemporaryValue,
    removeValue: removeTemporaryValue
  }
}

export default useLocalStorage
