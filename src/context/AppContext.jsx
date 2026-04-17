import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getProfileById, setOnlineStatus } from '../services/profiles'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeMatch, setActiveMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem('venzo_user_id')
    if (savedId) {
      getProfileById(savedId)
        .then(profile => {
          setCurrentUser(profile)
          setOnlineStatus(savedId, true)
        })
        .catch(() => localStorage.removeItem('venzo_user_id'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    const savedMatch = localStorage.getItem('venzo_active_match')
    if (savedMatch) {
      try { setActiveMatch(JSON.parse(savedMatch)) } catch {}
    }
  }, [])

  useEffect(() => {
    const handleUnload = () => {
      if (currentUser) setOnlineStatus(currentUser.id, false)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [currentUser])

  const login = useCallback((profile) => {
    setCurrentUser(profile)
    localStorage.setItem('venzo_user_id', profile.id)
    setOnlineStatus(profile.id, true)
  }, [])

  const logout = useCallback(() => {
    if (currentUser) setOnlineStatus(currentUser.id, false)
    setCurrentUser(null)
    localStorage.removeItem('venzo_user_id')
  }, [currentUser])

  const startMatch = useCallback((match) => {
    setActiveMatch(match)
    localStorage.setItem('venzo_active_match', JSON.stringify(match))
  }, [])

  const clearMatch = useCallback(() => {
    setActiveMatch(null)
    localStorage.removeItem('venzo_active_match')
  }, [])

  const refreshUser = useCallback(async () => {
    if (currentUser) {
      const profile = await getProfileById(currentUser.id)
      setCurrentUser(profile)
    }
  }, [currentUser])

  return (
    <AppContext.Provider value={{ currentUser, activeMatch, loading, login, logout, startMatch, clearMatch, refreshUser }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
