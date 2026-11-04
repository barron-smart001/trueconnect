import { Compass, Heart, House, MessageSquare, User } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useUnreadMessages } from '../../hooks/useUnreadMessages'
import { initialOf, useUser } from '../../lib/session'
import { NotificationBell } from './NotificationBell'

const links = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/matches', label: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
]

function Badge({ count }: { count: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0452c] px-1 text-[10px] leading-none text-cream">
      <span className="sr-only">{count} unread</span>
      <span aria-hidden>{count > 9 ? '9+' : count}</span>
    </span>
  )
}

// Signed-in app header and (below 768px) bottom tab bar.
export function DashboardHeader() {
  const user = useUser()
  const unread = useUnreadMessages()
  return (
    <>
    <header className="border-b border-[#393631] bg-ink">
      <div className="mx-auto flex h-[85px] max-w-[1440px] items-center px-4 md:px-8 xl:px-[120px]">
        <Link to="/" className="relative -top-px md:-left-px xl:left-0 flex items-center gap-[5px] font-serif text-[24px] font-semibold text-[#b7af9c]">
          <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
          TrueConnect
        </Link>

        <nav className="ml-[73px] hidden gap-[41px] md:flex" aria-label="Main">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-[9px] text-[14px] font-medium ${isActive ? 'text-gold' : 'text-[#b7af9c]'}`
              }
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
              {to === '/messages' && unread > 0 && <Badge count={unread} />}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-[18px]">
          <NotificationBell />
          <Link
            to="/profile"
            aria-label="Your profile"
            className="hidden size-[38px] items-center justify-center rounded-full border-2 border-[#e4dcd1] bg-[linear-gradient(140deg,#b99432,#8b6b1f)] md:flex font-serif text-[18px] font-semibold text-ink"
          >
            {initialOf(user)}
          </Link>
        </div>
      </div>
    </header>

    {/* Below 768px the main nav moves to a bar fixed to the bottom of the screen. */}
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 bg-cream px-[10px] pb-[18px] pt-[10px] md:hidden"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-[9px] text-[14px] font-medium ${isActive ? 'text-gold' : 'text-[#b7af9c]'}`
          }
        >
          <Icon size={14} strokeWidth={1.5} />
          {label}
          {to === '/messages' && unread > 0 && <Badge count={unread} />}
        </NavLink>
      ))}
    </nav>
    </>
  )
}
