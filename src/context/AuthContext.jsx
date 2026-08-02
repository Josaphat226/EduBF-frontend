'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verifie si l'utilisateur est connecte au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        if (response.data.user) {
          setUser(response.data.user)
        }
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (email, motDePasse) => {
    const response = await api.post('/auth/login', { email, mot_de_passe: motDePasse })
    setUser(response.data.user)
    return response.data
  }

  const register = async (nomComplet, email, motDePasse) => {
    const response = await api.post('/auth/register', {
      nom_complet: nomComplet,
      email,
      mot_de_passe: motDePasse,
    })
    setUser(response.data.user)
    return response.data
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  const updateUser = (partialUser) => {
    setUser(prev => ({ ...prev, ...partialUser }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit etre utilise dans un AuthProvider')
  }
  return context
}