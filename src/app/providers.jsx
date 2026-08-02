'use client'

import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { AdminAuthProvider } from '@/context/AdminAuthContext'

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthProvider>{children}</AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}