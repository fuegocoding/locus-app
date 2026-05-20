'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { connectSocket } from '@/lib/socket'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrap>
      {children}
    </AuthBootstrap>
  )
}

/**
 * On mount, if we have a valid session cookie the middleware will have already
 * protected routes. Here we hydrate the Zustand store with user data and
 * connect the socket.
 */
function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, isAuthenticated } = useAppStore()

  useEffect(() => {
    async function bootstrap() {
      try {
        // Fetch current user — will fail (401) if not authenticated
        const user = await authApi.me()
        setUser(user as any)

        // Get socket token (reads httpOnly cookie server-side)
        const { token } = await authApi.getSocketToken()
        setToken(token)
        await connectSocket(token)
      } catch {
        // Not authenticated — leave store empty, middleware handles redirects
      }
    }
    bootstrap()
  }, [setUser, setToken])

  return <>{children}</>
}
