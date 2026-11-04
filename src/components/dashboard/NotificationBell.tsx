import { Bell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  currentUserId,
  listNotifications,
  markNotificationsRead,
  subscribeToNotifications,
  type NotificationItem,
} from '../../lib/api'

function describe(item: NotificationItem): { text: string; to: string } {
  if (item.type === 'match') {
    const name = typeof item.payload.name === 'string' ? item.payload.name : 'a member'
    return { text: `You and ${name} liked each other. Say hello!`, to: `/messages/${String(item.payload.match_id ?? '')}` }
  }
  return item.payload.status === 'approved'
    ? { text: 'Your identity is verified. Discovery is unlocked.', to: '/dashboard' }
    : { text: "We couldn't verify your identity. Try again from your profile.", to: '/onboarding/identity' }
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const unread = items.filter((item) => !item.read).length

  useEffect(() => {
    let active = true
    let stop = () => {}
    listNotifications().then((list) => active && setItems(list), () => {})
    currentUserId().then((userId) => {
      if (!active || !userId) return
      stop = subscribeToNotifications(userId, (item) => setItems((current) => [item, ...current].slice(0, 20)))
    }, () => {})
    return () => {
      active = false
      stop()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    const onClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      markNotificationsRead().then(
        () => setItems((current) => current.map((item) => ({ ...item, read: true }))),
        () => {},
      )
    }
  }

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex size-[38px] items-center justify-center rounded-full border border-[#e4dcd1] bg-cream text-ink"
      >
        <Bell size={18} strokeWidth={1.25} />
        {unread > 0 && (
          <span className="absolute right-[10px] top-[9px] size-[7px] rounded-full border border-[#8f3a27] bg-[#c0452c]" aria-hidden />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[46px] z-50 w-[300px] rounded-lg border border-[#e4dcd1] bg-cream p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="p-3 text-[14px] text-[#5c5748]">No notifications yet.</p>
          ) : (
            <ul>
              {items.map((item) => {
                const { text, to } = describe(item)
                return (
                  <li key={item.id}>
                    <Link
                      to={to}
                      onClick={() => setOpen(false)}
                      className="block rounded-md p-3 text-[14px] leading-5 text-ink hover:bg-[#efe8d8]"
                    >
                      {text}
                      <span className="mt-1 block text-[12px] text-[#5c5748]">{new Date(item.createdAt).toLocaleString()}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
