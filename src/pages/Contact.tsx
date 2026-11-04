import { useEffect, useState, type FormEvent } from 'react'
import { FieldError, fieldClass, labelClass } from '../components/auth/parts'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ApiError, submitContactMessage, type ContactTopic } from '../lib/api'
import { isEmail } from '../lib/validation'

const topics: { value: ContactTopic; label: string }[] = [
  { value: 'support', label: 'Account or technical support' },
  { value: 'safety', label: 'Safety concern' },
  { value: 'press', label: 'Press' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'other', label: 'Something else' },
]

type Errors = { name?: string; email?: string; message?: string; form?: string }

export function Contact() {
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    document.title = 'Contact · TrueConnect'
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const topic = String(data.get('topic') ?? 'support') as ContactTopic
    const message = String(data.get('message') ?? '').trim()

    const next: Errors = {}
    if (!name) next.name = 'Enter your name'
    if (!email) next.email = 'Enter your email address'
    else if (!isEmail(email)) next.email = 'Enter a valid email address'
    if (message.length < 10) next.message = 'Tell us a little more (at least 10 characters)'
    setErrors(next)
    const first = (['name', 'email', 'message'] as const).find((key) => next[key])
    if (first) {
      document.getElementById(first)?.focus()
      return
    }

    setPending(true)
    try {
      await submitContactMessage({ name, email, topic, message })
      setSent(true)
    } catch (cause) {
      setErrors({ form: cause instanceof ApiError ? cause.message : 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-ink"><Header /></div>
      <main className="mx-auto w-full max-w-[560px] px-6 py-[72px]">
        <p className="text-[12px] text-gold">Contact</p>
        <h1 className="mt-[6px] font-serif text-[40px] leading-[48px] text-ink">How can we help?</h1>
        {sent ? (
          <p role="status" className="mt-6 text-[16px] leading-6 text-[#5c5748]">
            Thank you. We’ve received your message and will reply by email.
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6">
            <label className={labelClass} htmlFor="name">Name</label>
            <input id="name" name="name" autoComplete="name" maxLength={120} className={fieldClass} aria-invalid={!!errors.name} />
            <FieldError id="name-error">{errors.name}</FieldError>

            <label className={`mt-4 ${labelClass}`} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" maxLength={254} className={fieldClass} aria-invalid={!!errors.email} />
            <FieldError id="email-error">{errors.email}</FieldError>

            <label className={`mt-4 ${labelClass}`} htmlFor="topic">Topic</label>
            <select id="topic" name="topic" defaultValue="support" className={fieldClass}>
              {topics.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>

            <label className={`mt-4 ${labelClass}`} htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              maxLength={4000}
              aria-invalid={!!errors.message}
              className="block h-[160px] w-full resize-none rounded-lg border border-[#e4dcd1] bg-[#efe8d8] p-4 text-[14px] text-ink outline-none focus:border-gold aria-[invalid=true]:border-[#ff383c]"
            />
            <FieldError id="message-error">{errors.message}</FieldError>

            {errors.form && <p role="alert" className="mt-4 text-[14px] text-[#ff383c]">{errors.form}</p>}
            <button type="submit" disabled={pending} className="mt-6 flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-60">
              {pending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}
