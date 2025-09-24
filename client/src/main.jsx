import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'


// Error handling for development
if (import.meta.env.DEV) {
  // Enable React strict mode warnings in development
  console.log('🚀 Connexus Client starting in development mode')
}

// Production error tracking
if (import.meta.env.PROD) {
  // In production, you might want to add error tracking here
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
  })
}

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
