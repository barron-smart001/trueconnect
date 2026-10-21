import { useSyncExternalStore } from 'react'
import type { User } from './api'

// Client-side stand-in for a real session: the signed-in user is kept in localStorage.
// Replace with the real auth state (cookie/JWT + a /me request) once the backend exists.

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

/** "Amara" for the demo user, or the first name entered at sign-up. */
export function firstName(user: User | null): string {
  return user?.name.trim().split(/\s+/)[0] || 'Amara'
}

export function initialOf(user: User | null): string {
  return (user?.name.trim()[0] || 'A').toUpperCase()
}
