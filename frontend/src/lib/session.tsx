import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { apiClient } from './api/client'
import type { User } from './api/types'

type AuthInput = {
  email: string
  password: string
  displayName?: string
}

type SessionContextValue = {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: AuthInput) => Promise<void>
  register: (input: AuthInput) => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function bootstrapSession() {
      try {
        const user = await apiClient.getSession()
        if (isMounted) {
          setCurrentUser(user)
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(input: AuthInput) {
    const user = await apiClient.login(input)
    setCurrentUser(user)
  }

  async function register(input: AuthInput) {
    const user = await apiClient.register(input)
    setCurrentUser(user)
  }

  async function logout() {
    await apiClient.logout()
    setCurrentUser(null)
  }

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider.')
  }

  return context
}
