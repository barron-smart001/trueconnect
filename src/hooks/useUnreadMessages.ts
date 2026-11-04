import { useCallback, useEffect, useState } from 'react'
import { countUnreadMessages, currentUserId, subscribeToIncomingMessages } from '../lib/api'

const CHANGED = 'tc:unread-changed'

/** Tell every mounted unread badge to re-count (call after reading a conversation). */
export function notifyUnreadChanged() {
  window.dispatchEvent(new Event(CHANGED))
}

/** Live count of unread messages, refreshed when messages arrive or a conversation is read. */
export function useUnreadMessages(): number {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    countUnreadMessages().then(setCount, () => {
      /* the badge is a convenience; ignore transient failures */
    })
  }, [])

  useEffect(() => {
    // Initial count from Supabase on mount.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh()
    window.addEventListener(CHANGED, refresh)
    let timer: ReturnType<typeof setTimeout> | undefined
    let stop = () => {}
    let active = true
    currentUserId().then((userId) => {
      if (!active || !userId) return
      stop = subscribeToIncomingMessages(userId, () => {
        clearTimeout(timer)
        timer = setTimeout(refresh, 300)
      })
    }, () => {})
    return () => {
      active = false
      window.removeEventListener(CHANGED, refresh)
      clearTimeout(timer)
      stop()
    }
  }, [refresh])

  return count
}
