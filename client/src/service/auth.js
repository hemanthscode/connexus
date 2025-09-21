import api from './api.js'

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  return response.data.data // { token, user }
}

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password })
  return response.data.data
}

export const fetchProfile = async () => {
  const response = await api.get('/auth/me')
  return response.data.data
}

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/me', profileData)
  return response.data.data
}

export const logout = async () => {
  return api.post('/auth/logout')
}
