import { Bell, Compass, Heart, House, MessageSquare, User } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { initialOf, useUser } from '../../lib/session'

const links = [
  { to: '/dashboard', label: 'Home', icon: House },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/matches', label: 'Matches', icon: Heart },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
]

// Signed-in app header. The nav targets other than /dashboard are not built yet (no frames).
export function DashboardHeader() {
  const user = useUser()
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
              end
              className={({ isActive }) =>
                `flex items-center gap-[9px] text-[14px] font-medium ${isActive ? 'text-gold' : 'text-[#b7af9c]'}`
              }
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-[18px]">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-[38px] items-center justify-center rounded-full border border-[#e4dcd1] bg-cream text-ink"
          >
            <Bell size={18} strokeWidth={1.25} />
            <span className="absolute right-[10px] top-[9px] size-[7px] rounded-full border border-[#8f3a27] bg-[#c0452c]" aria-hidden />
          </button>
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
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-[9px] text-[14px] font-medium ${isActive ? 'text-gold' : 'text-[#b7af9c]'}`
          }
        >
          <Icon size={14} strokeWidth={1.5} />
          {label}
        </NavLink>
      ))}
    </nav>
    </>
  )
}
