import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthHeading,
  AuthLayout,
  FieldError,
  OrContinueWith,
  PasswordInput,
  fieldClass,
  labelClass,
} from '../components/auth/parts'
import { ApiError, signIn } from '../lib/api'
import { setUser } from '../lib/session'
import { isEmail } from '../lib/validation'

type Errors = { email?: string; password?: string; form?: string }

// `?error` previews the error state during development (the same state a failed sign-in produces).
const initialErrors = (): Errors =>
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('error')
    ? { email: 'This email is incorrect', password: 'This password is incorrect' }
    : {}

export function SignIn() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>(initialErrors)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    const next: Errors = {}
    if (!email) next.email = 'Enter your email address'
    else if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Enter your password'
    setErrors(next)
    if (next.email || next.password) {
      document.getElementById(next.email ? 'email' : 'password')?.focus()
      return
    }

    setPending(true)
    try {
      setUser(await signIn(email, password))
      navigate('/dashboard')
    } catch (err) {
      const api = err instanceof ApiError ? err : new ApiError('Something went wrong. Please try again.')
      setErrors(api.field === 'email' || api.field === 'password' ? { [api.field]: api.message } : { form: api.message })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout shift={3} image="/images/auth-signin.jpg">
      <form onSubmit={onSubmit} noValidate>
        <AuthHeading title="Welcome Back" subtitle="Sign in to continue your journey" />

        <label className={`mt-[17px] ${labelClass}`} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="johndoe@gmail.com"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          onChange={() => errors.email && setErrors((e) => ({ ...e, email: undefined }))}
          className={`mt-1.5 ${fieldClass}`}
        />
        <FieldError id="email-error">{errors.email}</FieldError>

        <div className="mt-[25px] flex items-center justify-between text-[12px] leading-4">
          <label htmlFor="password" className="text-[#5c5748]">Password</label>
          <Link to="/forgot-password" className="text-gold">Forgot Your Password?</Link>
        </div>
        <div className="mt-1.5">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            onChange={() => errors.password && setErrors((e) => ({ ...e, password: undefined }))}
          />
        </div>
        <FieldError id="password-error">{errors.password}</FieldError>
        <FieldError id="form-error">{errors.form}</FieldError>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-[39px] w-full rounded-md bg-gold text-[14px] font-medium text-ink disabled:opacity-70"
        >
          Sign in
        </button>

        <OrContinueWith googleLabel={errors.email || errors.password ? 'Google' : undefined} />

        <p className="mt-[23px] text-center text-[12px] leading-5 text-[#5c5748]">
          Don&apos;t have an account? <Link to="/signup" className="text-[14px] text-gold">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
