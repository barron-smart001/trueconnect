import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, subscribeNewsletter } from '../lib/api'
import { isEmail } from '../lib/validation'

const columns: { title: string; links: [string, string][] }[] = [
  { title: 'Platform', links: [['Discover', '/#find-your-lane'], ['How it works', '/#how-it-works'], ['Membership', '/membership'], ['Success stories', '/#reviews']] },
  { title: 'Company', links: [['About', '/about'], ['Careers', '/careers'], ['Press', '/press'], ['Contact', '/contact']] },
  { title: 'Support', links: [['Safety Center', '/safety'], ['Help Center', '/help'], ['Community Guidelines', '/guidelines'], ['Privacy Policy', '/privacy']] },
]

const socials = [
  {
    label: 'Instagram',
    d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5v.01',
  },
  { label: 'X', d: 'M4 4l16 16M20 4 4 20' },
  { label: 'TikTok', d: 'M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.2 4 5 4.2' },
  { label: 'Facebook', d: 'M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.700 1.800-1.700H18V3.100C17.600 3 16.700 3 15.700 3 13.400 3 11 4.500 11 7.300V9.500H8V13h3v8' },
]

export function Footer() {
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string }>()
  const [pending, setPending] = useState(false)

  async function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = String(new FormData(form).get('email') ?? '').trim()
    if (!isEmail(email)) {
      setStatus({ kind: 'error', text: email ? 'Enter a valid email address.' : 'Enter your email address.' })
      return
    }
    setPending(true)
    try {
      await subscribeNewsletter(email)
      form.reset()
      setStatus({ kind: 'success', text: "Thanks — you're subscribed." })
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-[1440px] px-4 pt-[38px] md:px-4 md:pt-[72px] xl:px-[120px]">
        <div className="grid grid-cols-[214px_1fr] md:gap-x-0 md:grid-cols-[244px_168px_169px_132px_1fr] xl:grid-cols-[264px_169px_169px_154px_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="mt-[1.5px] flex items-center gap-2.5 font-serif text-[24px] font-semibold text-[#b7af9c]">
              <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
              TrueConnect
            </Link>
            <p className="mt-2.5 max-w-[245px] text-[14px] leading-[22px] text-[#b7af9c]">
              The first verified, intent-based relationship platform for Africans globally. Real connections, real
              identities, zero tolerance for fakes.
            </p>
            <div className="mt-[16.5px] flex gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="flex size-9 items-center justify-center rounded-full border border-[#e4dcd1] text-[#b7af9c]">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {columns.map((c, i) => (
            <nav key={c.title} className={`${i === 2 ? 'mt-[17px]' : 'mt-[26px]'} md:mt-0 md:pt-[5px]`}>
              <h3 className="text-[14px] font-medium">{c.title}</h3>
              <ul className="mt-4 max-w-[125px] space-y-2.5 text-[14px] leading-[22px] text-[#b7af9c]">
                {c.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="hover:text-gold">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 mt-[25px] min-w-0 md:col-span-1 md:mt-0 md:pt-[10.5px]">
            <h3 className="text-[14px] font-medium">Stay in the loop</h3>
            <p className="mt-[15.5px] max-w-[280px] md:mt-[16.5px] text-[14px] leading-[22px] text-[#b7af9c]">
              Match tips, city events, and product updates — sent about once a month.
            </p>
            <form className="mt-4 flex h-11 items-center rounded-lg border border-[#e4dcd1] py-[2px] pl-0 pr-px" onSubmit={onSubscribe} noValidate>
              <input
                type="email"
                name="email"
                aria-label="Email address"
                aria-invalid={status?.kind === 'error' ? true : undefined}
                onChange={() => status?.kind === 'error' && setStatus(undefined)}
                placeholder="you@email.com"
                className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-cream outline-none placeholder:text-[#b7af9c]"
              />
              <button type="submit" disabled={pending} className="h-[38px] rounded-lg bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-70">Subscribe</button>
            </form>
            <p role={status ? 'status' : undefined} className={`mt-[6.5px] text-[12px] md:mt-[5.5px] ${status?.kind === 'error' ? 'text-[#ff383c]' : status ? 'text-gold' : 'text-[#8e8878]'}`}>
              {status?.text ?? 'No spam. Unsubscribe anytime.'}
            </p>
          </div>
        </div>

        <div className="mt-[24px] flex flex-col justify-between gap-[18px] border-t border-[#e4dcd1] pb-[37px] pt-[17px] md:gap-4 md:mt-[34px] md:pt-[25px] text-[12px] text-[#b7af9c] md:flex-row md:pb-[64.5px]">
          <p>© 2026 TrueConnect LLC. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
