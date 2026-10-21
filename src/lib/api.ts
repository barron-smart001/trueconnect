// Stub service layer. There is no backend yet, so every call resolves after a short delay.
//
// To connect the real API: replace the body of each function with a `fetch` call and keep the signatures. Pages
// already handle failure — reject with `new ApiError(message, field)` and the page shows `message` under the named
// field (or as a general error where there is no field).

export class ApiError extends Error {
  field?: string
  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.field = field
  }
}

export type User = { name: string; email: string }

const delay = (ms = 450) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** POST /auth/signin — resolves with the signed-in user. */
export async function signIn(email: string, _password: string): Promise<User> {
  await delay()
  return { name: 'Amara', email }
}

/** POST /auth/signup — creates the account and resolves with the new user. */
export async function signUp(input: { name: string; email: string; password: string }): Promise<User> {
  await delay()
  return { name: input.name, email: input.email }
}

/** POST /auth/forgot-password — must resolve whether or not the email exists (the UI says "if your email exists"). */
export async function requestPasswordReset(_email: string): Promise<void> {
  await delay()
}

/** POST /auth/update-password — the reset token comes from the emailed link. */
export async function updatePassword(_password: string): Promise<void> {
  await delay()
}

/** POST /onboarding/identity — ID type, front/back images, selfie. */
export async function submitIdentity(): Promise<void> {
  await delay(600)
}

/** POST /newsletter */
export async function subscribeNewsletter(_email: string): Promise<void> {
  await delay()
}
