import { useSyncExternalStore } from 'react'
import type { User } from './api'
import { toUser } from './api'
import { getSupabaseClient } from './supabase'

// The display name and email are cached in localStorage for the UI only. Whether someone is signed in is decided by
// the Supabase session (see useAuthStatus), and authorization is enforced by row-level security in the database.

const KEY = 'tc.user'
const listeners = new Set<() => void>()
let cache: { raw: string | null; user: User | null } = { raw: null, user: null }

function read(): User | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return null
  }
  if (raw === cache.raw) return cache.user
  let user: User | null = null
  try {
    user = raw ? (JSON.parse(raw) as User) : null
  } catch {
    user = null
  }
  cache = { raw, user }
  return user
}

function emit() {
  listeners.forEach((l) => l())
}

export function getUser(): User | null {
  return read()
}

export function setUser(user: User) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user))
  } catch {
    /* storage unavailable (private mode) — the session simply won't persist */
  }
  emit()
}

export function clearUser() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

export function useUser(): User | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => null,
  )
}

/** The first name entered at sign-up (or the part of the email before the @). */
export function firstName(user: User | null): string {
  return user?.name.trim().split(/\s+/)[0] || ''
}

export function initialOf(user: User | null): string {
  return (user?.name.trim()[0] || '').toUpperCase()
}

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut'

let authStatus: AuthStatus = 'loading'
let authStarted = false

function setAuthStatus(next: AuthStatus) {
  if (next === authStatus) return
  authStatus = next
  emit()
}

/** Follow the Supabase session once for the whole app: restore it on load, then track sign-in, refresh and sign-out. */
function startAuth() {
  if (authStarted) return
  authStarted = true
  let client
  try {
    client = getSupabaseClient()
  } catch {
    setAuthStatus('signedOut')
    return
  }
  client.auth.onAuthStateChange((event, session) => {
    if (session) {
      if (!getUser()) setUser(toUser(session.user))
      setAuthStatus('signedIn')
    } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
      clearUser()
      setAuthStatus('signedOut')
    }
  })
}

/** Whether the Supabase session is still loading, signed in, or signed out. */
export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(
    (cb) => {
      startAuth()
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => authStatus,
    () => 'loading',
  )
}

/** Only allow same-origin paths as a post-sign-in destination. */
export function safeNext(search: string, fallback = '/dashboard'): string {
  const next = new URLSearchParams(search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
}
