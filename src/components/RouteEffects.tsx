import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/': 'TrueConnect — Verified relationships for Africans worldwide',
  '/signup': 'Create an account · TrueConnect',
  '/signin': 'Sign in · TrueConnect',
  '/forgot-password': 'Reset password · TrueConnect',
  '/update-password': 'Update password · TrueConnect',
  '/dashboard': 'Home · TrueConnect',
  '/onboarding': 'Finish setting up · TrueConnect',
  '/onboarding/profile': 'Photos & bio · TrueConnect',
  '/onboarding/questions': 'Compatibility questions · TrueConnect',
  '/onboarding/identity': 'Identity verification · TrueConnect',
  '/onboarding/complete': "You're all set · TrueConnect",
}

/** On every navigation: scroll to the `#anchor` if there is one, otherwise to the top; and set the page title. */
export function RouteEffects() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    document.title = titles[pathname] ?? 'TrueConnect'
  }, [pathname])

  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
