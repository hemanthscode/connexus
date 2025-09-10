import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import ChatSidebar from '../chat/ChatSidebar'

/**
 * Main Layout Component - Fixed mobile layout and navbar overlap
 */
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Fixed Navbar */}
      <Navbar onToggleSidebar={toggleSidebar} />
      
      {/* Main Content Area - Added pt-16 to prevent navbar overlap */}
      <div className="flex-1 flex overflow-hidden pt-16">
        <ChatSidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar} 
        />
        
        {/* Main content with proper spacing */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {React.cloneElement(children, { onToggleSidebar: toggleSidebar })}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
