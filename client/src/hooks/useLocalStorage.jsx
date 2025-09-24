import { useState, useEffect, useCallback, useRef } from 'react'
import { encryptLocalStorageData, decryptLocalStorageData } from '@/utils/encryption.js'
import { DEBUG } from '@/utils/constants.js'

/**
 * Enhanced localStorage hook with encryption, serialization, and error handling
 */
export const useLocalStorage = (
  key, 
  initialValue = null, 
  options = {}
) => {
  const {
    encrypt = false,
    serialize = true,
    deserialize = true,
    onError = null,
    syncAcrossTabs = true
  } = options

  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue
      }

      const item = localStorage.getItem(key)
      if (!item) {
        return initialValue
      }

      let parsedValue
      
      if (encrypt) {
        parsedValue = decryptLocalStorageData(item)
      } else if (deserialize) {
        parsedValue = JSON.parse(item)
      } else {
        parsedValue = item
      }

      return parsedValue !== null ? parsedValue : initialValue
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error reading localStorage key "${key}":`, error)
      }
      
      onError?.(error, 'read')
      return initialValue
    }
  })

  const [error, setError] = useState(null)
  const valueRef = useRef(storedValue)

  // Update ref when value changes
  useEffect(() => {
    valueRef.current = storedValue
  }, [storedValue])

  // Set value function
  const setValue = useCallback((value) => {
    try {
      setError(null)
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(valueRef.current) : value
      
      // Update state
      setStoredValue(valueToStore)
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        if (valueToStore === null || valueToStore === undefined) {
          localStorage.removeItem(key)
        } else {
          let stringValue
          
          if (encrypt) {
            stringValue = encryptLocalStorageData(valueToStore)
          } else if (serialize) {
            stringValue = JSON.stringify(valueToStore)
          } else {
            stringValue = valueToStore
          }
          
          localStorage.setItem(key, stringValue)
        }
      }
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
      
      setError(error)
      onError?.(error, 'write')
    }
  }, [key, encrypt, serialize, onError])

  // Remove value function
  const removeValue = useCallback(() => {
    try {
      setError(null)
      setStoredValue(initialValue)
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error removing localStorage key "${key}":`, error)
      }
      
      setError(error)
      onError?.(error, 'remove')
    }
  }, [key, initialValue, onError])

  // Clear all localStorage
  const clearAll = useCallback(() => {
    try {
      setError(null)
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn('Error clearing localStorage:', error)
      }
      
      setError(error)
      onError?.(error, 'clear')
    }
  }, [onError])

  // Get size of stored value
  const getSize = useCallback(() => {
    try {
      if (typeof window === 'undefined') return 0
      
      const item = localStorage.getItem(key)
      return item ? new Blob([item]).size : 0
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error getting size of localStorage key "${key}":`, error)
      }
      return 0
    }
  }, [key])

  // Check if key exists
  const exists = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false
      return localStorage.getItem(key) !== null
    } catch (error) {
      if (DEBUG.ENABLED) {
        console.warn(`Error checking localStorage key "${key}":`, error)
      }
      return false
    }
  }, [key])

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          let newValue
          
          if (encrypt) {
            newValue = decryptLocalStorageData(e.newValue)
          } else if (deserialize) {
            newValue = JSON.parse(e.newValue)
          } else {
            newValue = e.newValue
          }
          
          setStoredValue(newValue)
        } catch (error) {
          if (DEBUG.ENABLED) {
            console.warn(`Error syncing localStorage key "${key}" across tabs:`, error)
          }
          
          setError(error)
          onError?.(error, 'sync')
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, encrypt, deserialize, initialValue, syncAcrossTabs, onError])

  return {
    value: storedValue,
    setValue,
    removeValue,
    clearAll,
    error,
    exists,
    getSize
  }
}

/**
 * Hook for managing multiple localStorage keys as an object
 */
export const useLocalStorageObject = (keyPrefix, initialState = {}, options = {}) => {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initialState

    const stored = {}
    
    for (const [key, defaultValue] of Object.entries(initialState)) {
      try {
        const storageKey = `${keyPrefix}_${key}`
        const item = localStorage.getItem(storageKey)
        
        if (item) {
          if (options.encrypt) {
            stored[key] = decryptLocalStorageData(item)
          } else {
            stored[key] = JSON.parse(item)
          }
        } else {
          stored[key] = defaultValue
        }
      } catch (error) {
        if (DEBUG.ENABLED) {
          console.warn(`Error reading localStorage key "${keyPrefix}_${key}":`, error)
        }
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
          
          if (value === null || value === undefined) {
            localStorage.removeItem(storageKey)
          } else {
            const stringValue = options.encrypt 
              ? encryptLocalStorageData(value)
              : JSON.stringify(value)
              
            localStorage.setItem(storageKey, stringValue)
          }
        } catch (error) {
          if (DEBUG.ENABLED) {
            console.warn(`Error setting localStorage key "${keyPrefix}_${key}":`, error)
          }
          
          options.onError?.(error, 'write')
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
          localStorage.removeItem(`${keyPrefix}_${key}`)
        } catch (error) {
          if (DEBUG.ENABLED) {
            console.warn(`Error removing localStorage key "${keyPrefix}_${key}":`, error)
          }
          
          options.onError?.(error, 'remove')
        }
      }
      
      return newState
    })
  }, [keyPrefix, initialState, options])

  const clearAll = useCallback(() => {
    setState(initialState)
    
    for (const key of Object.keys(initialState)) {
      try {
        localStorage.removeItem(`${keyPrefix}_${key}`)
      } catch (error) {
        if (DEBUG.ENABLED) {
          console.warn(`Error removing localStorage key "${keyPrefix}_${key}":`, error)
        }
        
        options.onError?.(error, 'remove')
      }
    }
  }, [keyPrefix, initialState, options])

  return {
    state,
    updateState,
    removeKeys,
    clearAll
  }
}

/**
 * Hook for managing localStorage quota and usage
 */
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
        // Fallback: try to estimate localStorage usage
        let totalSize = 0
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length
          }
        }
        setUsage(totalSize)
        setQuota(null) // Unknown quota
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
    if (!quota || !usage) return false
    return (usage / quota) > threshold
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

/**
 * Hook for temporary localStorage (auto-expires)
 */
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
