import { useEffect, useState, type FormEvent } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout, FieldError, PasswordInput, labelClass } from '../components/auth/parts'
import { Toast } from '../components/Toast'
import { ApiError, updatePassword } from '../lib/api'
import { MIN_PASSWORD } from '../lib/validation'

type Errors = { password?: string; confirm?: string; form?: string }

export function UpdatePassword() {
  const navigate = useNavigate()
  // `?updated` previews the success toast during development.
  const [updated, setUpdated] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('updated'),
  )
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!updated) return
    const timer = setTimeout(() => navigate('/signin'), 3500)
    return () => clearTimeout(timer)
  }, [updated, navigate])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirm = String(data.get('confirm') ?? '')

    const next: Errors = {}
    if (!password) next.password = 'Enter a new password'
    else if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`
    if (!confirm) next.confirm = 'Confirm your new password'
    else if (confirm !== password) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (next.password || next.confirm) {
      document.getElementById(next.password ? 'password' : 'confirm')?.focus()
      return
    }

    setPending(true)
    try {
      await updatePassword(password)
      setUpdated(true)
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout shift={0.5} image="/images/auth-signin.jpg">
      {updated && (
        <Toast title="Password Updated">You will be redirected to the login page to log in with your new password.</Toast>
      )}
      <form onSubmit={onSubmit} noValidate>
        <Link
          to="/signin"
          aria-label="Back to sign in"
          className="flex size-9 items-center justify-center rounded-full border border-[#e4dcd1] text-ink"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </Link>

        <h1 className="mt-[23px] text-center font-serif text-[18px] font-semibold leading-7 text-ink">Update Password</h1>
        <p className="mx-auto mt-[5px] max-w-[320px] text-center text-[14px] leading-[22px] text-[#5c5748]">
          Set a secure and unique password to access your account.
        </p>

        <label className={`mt-6 ${labelClass}`} htmlFor="password">Password</label>
        <div className="mt-1.5">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            onChange={() => errors.password && setErrors((e) => ({ ...e, password: undefined }))}
          />
        </div>
        <FieldError id="password-error">{errors.password}</FieldError>

        <label className={`mt-6 ${labelClass}`} htmlFor="confirm">Confirm password</label>
        <div className="mt-1.5">
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            placeholder="Confirm password"
            invalid={!!errors.confirm}
            onChange={() => errors.confirm && setErrors((e) => ({ ...e, confirm: undefined }))}
          />
        </div>
        <FieldError id="confirm-error">{errors.confirm}</FieldError>
        <FieldError id="form-error">{errors.form}</FieldError>

        <button
          type="submit"
          disabled={pending || updated}
          className="mt-[23px] h-[39px] w-full rounded-md bg-gold text-[14px] font-medium text-ink disabled:opacity-70"
        >
          Update Password
        </button>
      </form>
    </AuthLayout>
  )
}
