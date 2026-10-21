import { useEffect, useState, type FormEvent } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthLayout, FieldError, fieldClass, labelClass } from '../components/auth/parts'
import { Toast } from '../components/Toast'
import { ApiError, requestPasswordReset } from '../lib/api'
import { isEmail } from '../lib/validation'

export function ForgotPassword() {
  // `?sent` previews the success toast during development.
  const [sent, setSent] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('sent'),
  )
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!sent) return
    const timer = setTimeout(() => setSent(false), 6000)
    return () => clearTimeout(timer)
  }, [sent])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
    if (!email || !isEmail(email)) {
      setError(email ? 'Enter a valid email address' : 'Enter your email address')
      document.getElementById('email')?.focus()
      return
    }
    setError(undefined)
    setPending(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout shift={1} image="/images/auth-signin.jpg">
      {sent && (
        <Toast title="Request Successful">
          If your email exists in our system, we&apos;ll send you a password reset link.
        </Toast>
      )}
      <form onSubmit={onSubmit} noValidate>
        <Link
          to="/signin"
          aria-label="Back to sign in"
          className="flex size-9 items-center justify-center rounded-full border border-[#e4dcd1] text-ink"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </Link>

        <h1 className="mt-[23px] text-center font-serif text-[18px] font-semibold leading-7 text-ink">Reset Password</h1>
        <p className="mx-auto mt-[5px] max-w-[300px] text-center text-[14px] leading-[22px] text-[#5c5748]">
          Enter your email address and we&apos;ll send you a password reset link.
        </p>

        <label className={`mt-6 ${labelClass}`} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="johndoe@gmail.com"
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'email-error' : undefined}
          onChange={() => error && setError(undefined)}
          className={`mt-1.5 ${fieldClass}`}
        />
        <FieldError id="email-error">{error}</FieldError>

        <button
          type="submit"
          disabled={pending}
          className="mt-[23px] h-[39px] w-full rounded-md bg-gold text-[14px] font-medium text-ink disabled:opacity-70"
        >
          Send Password Reset Link
        </button>
      </form>
    </AuthLayout>
  )
}
