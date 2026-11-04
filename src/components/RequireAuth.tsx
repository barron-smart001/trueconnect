import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStatus } from '../lib/session'

/** Sends signed-out visitors to sign in, then back to the page they asked for. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStatus()
  const { pathname, search } = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream" role="status" aria-live="polite">
        <span className="sr-only">Loading…</span>
        <span className="size-8 animate-spin rounded-full border-2 border-[#e4dcd1] border-t-gold" aria-hidden />
      </div>
    )
  }
  if (status === 'signedOut') {
    return <Navigate to={`/signin?next=${encodeURIComponent(pathname + search)}`} replace />
  }
  return children
}
