import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MobileMenu } from './MobileMenu'

const links = [
  { label: 'Discover', to: '/#find-your-lane', dropdown: true, gap: '' },
  { label: 'How it works', to: '/#how-it-works', gap: 'ml-12' },
  { label: 'Safety', to: '/#safety', gap: 'ml-10' },
  { label: 'Membership', to: '/membership', gap: 'ml-[35px]' },
]

export function Header() {
  // `?menu` previews the open small-screen menu during development.
  const [menuOpen, setMenuOpen] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('menu'),
  )

  return (
    <header className="sticky top-0 z-50 border-b border-[#393631] bg-ink/90 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[85px] max-w-[1440px] items-center justify-between px-4 md:px-8 xl:px-[120px]">
        <Link to="/" className="relative top-0 md:-top-px md:-left-px xl:left-0 flex items-center gap-[5px] font-serif text-[24px] font-semibold text-[#b7af9c]">
          <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
          TrueConnect
        </Link>
        <nav className="relative -left-0.5 hidden items-center text-[14px] xl:flex">
          {links.map((l) => (
            <Link key={l.label} to={l.to} className={`flex items-center text-[#b7af9c] hover:text-gold ${l.gap}`}>
              {l.label}
              {l.dropdown && <ChevronDown size={14} className="ml-[15px]" />}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-[18px] text-[14px] text-[#b7af9c] xl:flex">
          <Link to="/signin">Sign in</Link>
          <Link to="/signup" className="rounded-md bg-gold px-[16.5px] py-2.5 font-medium text-ink">Join TrueConnect</Link>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="relative -mr-px -mt-[2px] flex size-[18px] items-center justify-center text-[#b7af9c] before:absolute before:-inset-3 xl:hidden"
        >
          <Menu className="size-[18px] [stroke-width:0.7]" strokeWidth={1.5} />
        </button>
      </div>
      {menuOpen && createPortal(<MobileMenu onClose={() => setMenuOpen(false)} />, document.body)}
    </header>
  )
}
