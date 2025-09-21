import axios from 'axios'
import { toast } from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Add token to headers if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('connexus_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Network error: check your internet connection')
    } else if (error.response.status >= 500) {
      toast.error('Server error, try again later')
    } else if (error.response.status === 401) {
      toast.error('Unauthorized. Please login again.')
      // Optional: handle logout redirect globally here
    } else {
      toast.error(error.response.data.message || 'An error occurred')
    }
    return Promise.reject(error)
  }
)

export default api
