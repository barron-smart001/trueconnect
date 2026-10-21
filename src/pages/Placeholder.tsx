import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

// These pages have no Figma frame yet. They exist so every link in the app lands somewhere sensible
// instead of a blank screen; replace each one when its design arrives.

type Props = { eyebrow: string; title: string; body: string; cta: { label: string; to: string } }

function Message({ eyebrow, title, body, cta }: Props) {
  return (
    <main className="mx-auto flex min-h-[520px] w-full max-w-[666px] flex-col items-center justify-center px-6 py-[96px] text-center">
      <p className="text-[12px] text-gold">{eyebrow}</p>
      <h1 className="mt-[6px] font-serif text-[40px] leading-[48px] text-ink">{title}</h1>
      <p className="mt-4 max-w-[460px] text-[16px] leading-6 text-[#5c5748]">{body}</p>
      <Link to={cta.to} className="mt-8 flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink">
        {cta.label}
      </Link>
    </main>
  )
}

/** A page that has not been designed yet. `app` pages sit inside the signed-in header, the rest inside the marketing one. */
export function ComingSoon({ title, app = false }: { title: string; app?: boolean }) {
  useEffect(() => {
    document.title = `${title} · TrueConnect`
  }, [title])

  return (
    <div className={`min-h-screen bg-cream ${app ? 'pb-[71px] md:pb-0' : ''}`}>
      {app ? <DashboardHeader /> : <div className="bg-ink"><Header /></div>}
      <Message
        eyebrow="Coming soon"
        title={title}
        body="We're still putting this page together. Check back shortly."
        cta={app ? { label: 'Back to home', to: '/dashboard' } : { label: 'Back to the homepage', to: '/' }}
      />
      {!app && <Footer />}
    </div>
  )
}

export function NotFound() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-ink"><Header /></div>
      <Message
        eyebrow="Error 404"
        title="We couldn't find that page"
        body="The link may be broken, or the page may have moved."
        cta={{ label: 'Back to the homepage', to: '/' }}
      />
      <Footer />
    </div>
  )
}
