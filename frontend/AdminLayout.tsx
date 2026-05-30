import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import Sidebar from '../components/sidebar/Sidebar'
import Header from '../components/header/Header'

const AdminLayout: React.FC = () => {
  const { isAuthenticated, token } = useAuthStore()
  const navigate = useNavigate()
  const { sidebarCollapsed } = useUIStore()

  useEffect(() => {
    if (!isAuthenticated && !token) {
      navigate('/login')
    }
  }, [isAuthenticated, token, navigate])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
