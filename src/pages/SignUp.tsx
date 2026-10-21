import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
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
import { ApiError, signUp } from '../lib/api'
import { setUser } from '../lib/session'
import { MIN_PASSWORD, isEmail } from '../lib/validation'

type Field = 'name' | 'email' | 'password' | 'consent' | 'form'
type Errors = Partial<Record<Field, string>>

export function SignUp() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)

  const clear = (field: Field) => () => errors[field] && setErrors((e) => ({ ...e, [field]: undefined }))

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    const next: Errors = {}
    if (!name) next.name = 'Enter your full name'
    if (!email) next.email = 'Enter your email address'
    else if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Create a password'
    else if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`
    if (!data.get('consent')) next.consent = 'Please accept to continue'
    setErrors(next)
    const first = (['name', 'email', 'password', 'consent'] as const).find((f) => next[f])
    if (first) {
      document.getElementById(first === 'consent' ? 'consent' : first)?.focus()
      return
    }

    setPending(true)
    try {
      setUser(await signUp({ name, email, password }))
      navigate('/onboarding')
    } catch (err) {
      const api = err instanceof ApiError ? err : new ApiError('Something went wrong. Please try again.')
      setErrors({ [(api.field as Field) ?? 'form']: api.message })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout shift={3} image="/images/auth.jpg">
      <form onSubmit={onSubmit} noValidate>
        <AuthHeading title="Create an Account" subtitle="Start your journey to finding love" />

        <label className={`mt-[17px] ${labelClass}`} htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'name-error' : undefined}
          onChange={clear('name')}
          className={`mt-1.5 ${fieldClass}`}
        />
        <FieldError id="name-error">{errors.name}</FieldError>

        <label className={`mt-6 ${labelClass}`} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="johndoe@gmail.com"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          onChange={clear('email')}
          className={`mt-1.5 ${fieldClass}`}
        />
        <FieldError id="email-error">{errors.email}</FieldError>

        <label className={`mt-6 ${labelClass}`} htmlFor="password">Password</label>
        <div className="mt-1.5">
          <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} onChange={clear('password')} />
        </div>
        <FieldError id="password-error">{errors.password}</FieldError>

        <div className="mt-[22px] flex gap-[15px]">
          <label className="relative shrink-0">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              onChange={clear('consent')}
              className="peer sr-only"
            />
            <span
              className={`flex size-4 items-center justify-center rounded border text-gold peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50 ${
                errors.consent ? 'border-[#ff383c]' : 'border-gold'
              }`}
            >
              <Check size={12} className="opacity-0" />
            </span>
          </label>
          <div className="mt-0.5 text-[12px] leading-5 text-ink">
            <p>
              I have read and agree to TrueConnect&apos;s Privacy Policy, Terms of Service, and Cookie Policy. I
              consent to the collection and processing of my personal data as described in these documents.
            </p>
            <p className="mt-[5px]">
              By checking this, you agree to our <Link to="/terms" className="text-gold">Terms of Service,</Link>{' '}
              <Link to="/privacy" className="text-gold">Privacy Policy</Link> and <Link to="/cookies" className="text-gold">Cookie Policy.</Link>
            </p>
          </div>
        </div>
        <FieldError id="consent-error">{errors.consent}</FieldError>
        <FieldError id="form-error">{errors.form}</FieldError>

        <button
          type="submit"
          disabled={pending}
          className="mt-[23px] h-[39px] w-full rounded-md bg-gold text-[14px] font-medium text-ink disabled:opacity-70"
        >
          Create an Account
        </button>

        <OrContinueWith />

        <p className="mt-[25px] text-center text-[12px] leading-5 text-[#5c5748]">
          Already have an account? <Link to="/signin" className="text-[14px] text-gold">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
