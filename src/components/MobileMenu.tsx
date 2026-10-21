import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IntentPanel, IntentPanelMobile } from './IntentPanel'

const links = [
  { label: 'How it works', to: '/#how-it-works', nudge: '-translate-x-[3.5px]' },
  { label: 'Safety', to: '/#safety', nudge: '-translate-x-px' },
  { label: 'Membership', to: '/membership', nudge: '-translate-x-[3.5px]' },
]

/** Full-screen navigation shown on small screens (opened from the header's menu button). */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const [discoverOpen, setDiscoverOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink text-[14px] text-[#b7af9c]">
      <div className="mx-4 flex h-[86px] shrink-0 items-center justify-end border-b border-[rgba(227,219,207,0.5)] pb-px">
        <button type="button" onClick={onClose} aria-label="Close menu" className="relative flex size-7 items-center justify-center before:absolute before:-inset-3.5">
          <X size={28} strokeWidth={0.7} />
        </button>
      </div>

      <nav className="flex flex-col items-center pt-[44px]" aria-label="Main">
        <button
          type="button"
          aria-expanded={discoverOpen}
          onClick={() => setDiscoverOpen((v) => !v)}
          className="flex items-center gap-[14px] leading-5 hover:text-gold"
        >
          Discover
          <ChevronDown size={14} strokeWidth={1.25} className={`transition-transform ${discoverOpen ? 'rotate-180' : ''}`} />
        </button>
        {discoverOpen && (
          <div className="mt-6">
            <div className="hidden sm:block">
              <IntentPanel />
            </div>
            <div className="sm:hidden">
              <IntentPanelMobile />
            </div>
          </div>
        )}
        {links.map(({ label, to, nudge }, i) => (
          <Link key={label} to={to} onClick={onClose} className={`leading-5 hover:text-gold ${nudge} ${i === 0 ? 'mt-10' : 'mt-[30px]'}`}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex shrink-0 flex-col items-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-10">
        <Link to="/signin" onClick={onClose} className="leading-5 hover:text-gold">Sign in</Link>
        <Link
          to="/signup"
          onClick={onClose}
          className="mt-[17px] flex h-[38px] w-full items-center justify-center rounded-md bg-gold font-medium text-ink"
        >
          Join TrueConnect
        </Link>
      </div>
    </div>
  )
}
