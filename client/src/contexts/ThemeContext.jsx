import React, { createContext, useContext, useLayoutEffect, useState } from 'react'

const ThemeContext = createContext()

/**
 * Theme Provider Component - Working with Tailwind CSS v4
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  useLayoutEffect(() => {
    // Get stored theme or system preference
    const storedTheme = localStorage.getItem('chat_theme')
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    const initialTheme = storedTheme || systemTheme
    setTheme(initialTheme)
    
    // Apply theme immediately using data-theme attribute for Tailwind v4
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('chat_theme', newTheme)
    
    // Update data-theme attribute for Tailwind CSS v4
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
