export type Step = 'profile' | 'questions' | 'identity'
export const STEPS: Step[] = ['profile', 'questions', 'identity']
export const STEP_PATH: Record<Step, string> = {
  profile: '/onboarding/profile',
  questions: '/onboarding/questions',
  identity: '/onboarding/identity',
}

/** The first unfinished step, or `null` when everything is done. */
export function nextStep(done: Step[]): Step | null {
  return STEPS.find((s) => !done.includes(s)) ?? null
}
