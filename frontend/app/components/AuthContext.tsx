'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  accessToken: string | null
  logout: () => void
  setAuth: (token: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing token in cookies on mount
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('spotify_access_token='))
      ?.split('=')[1]
    
    if (token) {
      setAccessToken(token)
      setIsAuthenticated(true)
    }
  }, [])

  const setAuth = (token: string) => {
    setAccessToken(token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    // Clear the cookie
    document.cookie = 'spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setAccessToken(null)
    setIsAuthenticated(false)
    // Redirect to home page
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, accessToken, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
