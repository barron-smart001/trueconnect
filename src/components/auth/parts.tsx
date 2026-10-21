import { useState, type CSSProperties, type ReactNode } from 'react'
import { Eye, EyeClosed } from 'lucide-react'
import { Link } from 'react-router-dom'

export const labelClass = 'block text-[14px] font-medium leading-5 text-[#5c5748]'

export const fieldClass =
  'h-[41px] w-full rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-4 text-[14px] text-ink outline-none placeholder:text-[#5c5748] focus:border-gold aria-[invalid=true]:border-[#ff383c]'

const socialClass =
  'flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#e4dcd1] bg-[#efe8d8] text-[14px] text-ink'

export function AuthLayout({ image, children, shift = 2 }: { image: string; children: ReactNode; shift?: number }) {
  return (
    <div className="grid min-h-screen bg-cream md:grid-cols-[544px_1fr] xl:grid-cols-[704px_1fr]">
      <main
        className="flex items-center justify-center px-4 py-[68px] md:px-6 md:pb-(--pb) md:pt-(--pt)"
        style={{ '--pt': `${40 + shift}px`, '--pb': `${40 - shift}px` } as CSSProperties}
      >
        <div className="w-full max-w-[350px]">{children}</div>
      </main>
      <aside className="relative hidden md:block">
        <img src={image.replace('.jpg', '-tablet.jpg')} alt="" className="absolute inset-0 size-full object-cover xl:hidden" />
        <img src={image} alt="" className="absolute inset-0 hidden size-full object-cover object-left xl:block" />
      </aside>
    </div>
  )
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Link to="/" className="mx-auto block w-fit" aria-label="TrueConnect home">
        <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
      </Link>
      <h1 className="mt-[21px] text-center font-serif text-[18px] font-semibold leading-7 text-ink">{title}</h1>
      <p className="mt-[5px] text-center text-[14px] leading-[22px] text-[#5c5748]">{subtitle}</p>
    </>
  )
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-[5px] text-[14px] leading-[22px] text-[#ff383c]">
      {children}
    </p>
  )
}

export function PasswordInput({
  id,
  autoComplete,
  placeholder = 'Password',
  required,
  invalid,
  onChange,
}: {
  id: string
  autoComplete: string
  placeholder?: string
  required?: boolean
  invalid?: boolean
  onChange?: () => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={onChange}
        className={`${fieldClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5c5748]"
      >
        {show ? <Eye size={16} /> : <EyeClosed size={16} />}
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

export function OrContinueWith({ googleLabel = 'Continue with Google' }: { googleLabel?: string }) {
  return (
    <>
      <div className="mt-[17px] flex items-center gap-5 text-[12px] leading-4 text-[#5c5748]">
        <span className="h-px flex-1 bg-[#ede7dc]" />
        or continue with
        <span className="h-px flex-1 bg-[#ede7dc]" />
      </div>
      <button type="button" className={`mt-[18px] ${socialClass}`}>
        <GoogleIcon /> {googleLabel}
      </button>
      <button type="button" className={`mt-3.5 ${socialClass}`}>
        <AppleIcon /> Continue with Apple
      </button>
    </>
  )
}
