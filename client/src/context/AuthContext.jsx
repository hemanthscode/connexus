import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import api, { setAuthToken } from '../service/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('connexus_token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      setAuthToken(token)
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.data)
          setLoading(false)
        })
        .catch(() => {
          setUser(null)
          setToken(null)
          localStorage.removeItem('connexus_token')
          setAuthToken(null)
          setLoading(false)
        })
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      setToken(res.data.data.token)
      localStorage.setItem('connexus_token', res.data.data.token)
      setUser(res.data.data.user)
      toast.success('Login successful')
      navigate('/chat')
    } catch (err) {
      toast.error(err.response?.data.message || 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    setUser(null)
    setToken(null)
    localStorage.removeItem('connexus_token')
    setAuthToken(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
