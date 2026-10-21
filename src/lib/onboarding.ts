import { useSyncExternalStore } from 'react'

// Which onboarding steps the user has finished, kept in localStorage so the checklist survives a refresh.
// Replace with the progress returned by the backend when it exists.

export type Step = 'profile' | 'questions' | 'identity'
export const STEPS: Step[] = ['profile', 'questions', 'identity']
export const STEP_PATH: Record<Step, string> = {
  profile: '/onboarding/profile',
  questions: '/onboarding/questions',
  identity: '/onboarding/identity',
}

const KEY = 'tc.onboarding'
const listeners = new Set<() => void>()
let cache: { raw: string | null; done: Step[] } = { raw: null, done: [] }

function read(): Step[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return cache.done
  }
  if (raw === cache.raw) return cache.done
  let done: Step[] = []
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    done = Array.isArray(parsed) ? parsed.filter((s): s is Step => STEPS.includes(s as Step)) : []
  } catch {
    done = []
  }
  cache = { raw, done }
  return done
}

export function completeStep(step: Step) {
  const done = read()
  if (done.includes(step)) return
  try {
    localStorage.setItem(KEY, JSON.stringify([...done, step]))
  } catch {
    /* storage unavailable — progress just won't persist */
  }
  // Without storage the cache cannot refresh from `localStorage`, so keep it in step manually.
  cache = { raw: JSON.stringify([...done, step]), done: [...done, step] }
  listeners.forEach((l) => l())
}

export function useOnboardingProgress(): Step[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    read,
    () => [],
  )
}

/** The first unfinished step, or `null` when everything is done. */
export function nextStep(done: Step[]): Step | null {
  return STEPS.find((s) => !done.includes(s)) ?? null
}
