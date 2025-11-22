'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth-token')
    if (token) {
      // Verify token with server
      fetch('/api/verify-token', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          localStorage.removeItem('auth-token')
        }
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('auth-token')
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (data.token) {
        localStorage.setItem('auth-token', data.token)
        setUser(data.user)
        setLoading(false)
        return { data: data.user, error: null }
      }
      
      return { data: null, error: { message: data.error } }
    } catch (error) {
      return { data: null, error: { message: 'Network error' } }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (data.token) {
        localStorage.setItem('auth-token', data.token)
        setUser(data.user)
        setLoading(false)
        return { data: data.user, error: null }
      }
      
      return { data: null, error: { message: data.error } }
    } catch (error) {
      return { data: null, error: { message: 'Network error' } }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('auth-token')
    setUser(null)
    return { error: null }
  }

  return { user, loading, signUp, signIn, signOut }
}