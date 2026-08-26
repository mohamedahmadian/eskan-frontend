import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import {
  applyUiLanguage,
  getStoredPreferredLocale,
  persistPreferredLocale,
  uiLanguageFor,
  type AppLanguage,
} from '../i18n'
import type { AuthUser } from '../types/app'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const applyUser = useCallback((next: AuthUser) => {
    setUser(next)
    const lang = (next.locale as AppLanguage) || 'fa'
    persistPreferredLocale(lang)
    applyUiLanguage(lang)
  }, [])

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('eskan_token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    const { data } = await api.get<AuthUser>('/auth/me')
    applyUser(data)
    setLoading(false)
  }, [applyUser])

  useEffect(() => {
    void refresh().catch(() => {
      localStorage.removeItem('eskan_token')
      setUser(null)
      setLoading(false)
    })
  }, [refresh])

  const login = useCallback(
    async (username: string, password: string) => {
      const locale = uiLanguageFor(getStoredPreferredLocale())
      const { data } = await api.post<{ token: string; user: AuthUser }>(
        '/auth/login',
        { username, password, locale },
      )
      localStorage.setItem('eskan_token', data.token)
      applyUser(data.user)
    },
    [applyUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('eskan_token')
    setUser(null)
    applyUiLanguage(getStoredPreferredLocale())
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
