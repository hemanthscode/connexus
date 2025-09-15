// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef, useContext } from 'react'
import * as authService from '../services/authService.js'

const AuthContext = createContext()

const PROFILE_FETCH_COOLDOWN = 10000 // 10 seconds cooldown
const LOGIN_COOLDOWN = 10000 // 10 seconds cooldown

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('connexus_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState(null)
  const lastFetchRef = useRef(0)
  const lastLoginAttemptRef = useRef(0)
  const [loginLocked, setLoginLocked] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      if (!token) {
        setUser(null)
        setLoading(false)
        setError(null)
        return
      }
      const now = Date.now()
      if (now - lastFetchRef.current < PROFILE_FETCH_COOLDOWN) {
        setLoading(false)
        return
      }
      lastFetchRef.current = now
      setLoading(true)
      setError(null)

      try {
        const profileUser = await authService.fetchProfile(token)
        setUser(profileUser)
      } catch (err) {
        if (err.message.includes('429')) {
          setError('Too many requests, please wait and try again.')
        } else if (
          err.message.toLowerCase().includes('unauthorized') ||
          err.message.toLowerCase().includes('401')
        ) {
          setUser(null)
          setToken(null)
          localStorage.removeItem('connexus_token')
        } else {
          setError(err.message || 'Failed to fetch profile')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [token])

  const login = async (email, password) => {
    const now = Date.now()
    if (loginLocked && now - lastLoginAttemptRef.current < LOGIN_COOLDOWN) {
      return { success: false, message: 'Too many login attempts. Please wait.' }
    }
    setLoginLocked(true)
    lastLoginAttemptRef.current = now
    setLoading(true)
    setError(null)

    try {
      const res = await authService.login(email, password)
      setToken(res.token)
      localStorage.setItem('connexus_token', res.token)
      setUser(res.user)
      setLoading(false)
      setLoginLocked(false)
      return { success: true }
    } catch (error) {
      setLoading(false)
      if (error.message.includes('429')) {
        setError('Too many requests. Please wait a moment before trying again.')
      } else {
        setError(error.message)
      }
      setLoginLocked(false)
      return { success: false, message: error.message }
    }
  }

  const register = async (name, email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.register(name, email, password)
      setToken(res.token)
      localStorage.setItem('connexus_token', res.token)
      setUser(res.user)
      setLoading(false)
      return { success: true }
    } catch (error) {
      setLoading(false)
      return { success: false, message: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('connexus_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
