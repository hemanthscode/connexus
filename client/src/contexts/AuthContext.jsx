import React, { createContext, useReducer, useEffect } from 'react'
import { mockUsers } from '../data/mockUsers'

const AuthContext = createContext()

const initialState = {
  user: null,
  loading: true,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null }
    case 'AUTH_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null }
    case 'AUTH_ERROR':
      return { ...state, user: null, loading: false, error: action.payload }
    case 'AUTH_LOGOUT':
      return { ...state, user: null, loading: false, error: null }
    default:
      return state
  }
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        dispatch({ type: 'AUTH_SUCCESS', payload: user })
      } catch (error) {
        localStorage.removeItem('chat_user')
        dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' })
      }
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: null })
    }
  }, [])

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = mockUsers.find(u => u.email === email)
    if (user && password) {
      localStorage.setItem('chat_user', JSON.stringify(user))
      dispatch({ type: 'AUTH_SUCCESS', payload: user })
      return { success: true }
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: 'Invalid credentials' })
      return { success: false, error: 'Invalid email or password' }
    }
  }

  const logout = () => {
    localStorage.removeItem('chat_user')
    dispatch({ type: 'AUTH_LOGOUT' })
  }

  const value = {
    ...state,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
