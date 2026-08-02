'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

const AdminAuthContext = createContext()

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/me')
      .then(res => setAdmin(res.data.admin))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/admin/login', { email, mot_de_passe })
    setAdmin(res.data.admin)
    return res.data
  }

  const logout = async () => {
    await api.post('/admin/logout')
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth doit etre utilise dans un AdminAuthProvider')
  return ctx
}