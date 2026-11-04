import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

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
