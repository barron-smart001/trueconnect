import { ArrowLeft, Ban, Flag, UserMinus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { MemberAvatar } from '../components/social/MemberAvatar'
import { Dialog, ReportDialog, primaryButton, secondaryButton } from '../components/social/SafetyDialogs'
import { notifyUnreadChanged } from '../hooks/useUnreadMessages'
import {
  ApiError,
  blockMember,
  currentUserId,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  subscribeToMessages,
  unmatch,
  type Conversation,
  type Message,
} from '../lib/api'

const MAX_LENGTH = 2000

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function shortTime(iso: string) {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString() ? timeFormat.format(date) : dayFormat.format(date)
}

function Thread({ conversation, userId, onChanged, onClosed }: {
  conversation: Conversation
  userId: string
  onChanged: () => void
  onClosed: () => void
}) {
  const matchId = conversation.matchId
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<'report' | 'block' | 'unmatch' | null>(null)
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  const markRead = useCallback(() => {
    markConversationRead(matchId).then(() => {
      notifyUnreadChanged()
      onChanged()
    }, () => {})
  }, [matchId, onChanged])

  useEffect(() => {
    let active = true
    listMessages(matchId).then(
      (page) => {
        if (!active) return
        setMessages(page.messages)
        setHasMore(page.hasMore)
        setLoading(false)
        markRead()
      },
      (cause) => {
        if (!active) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load this conversation.')
        setLoading(false)
      },
    )
    const stop = subscribeToMessages(matchId, (message) => {
      setMessages((current) => (current.some((existing) => existing.id === message.id) ? current : [...current, message]))
      if (message.senderId !== userId) markRead()
      onChanged()
    })
    return () => {
      active = false
      stop()
    }
  }, [matchId, userId, markRead, onChanged])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function loadOlder() {
    const oldest = messages[0]?.id
    if (oldest === undefined) return
    try {
      const page = await listMessages(matchId, oldest)
      setMessages((current) => [...page.messages, ...current])
      setHasMore(page.hasMore)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not load earlier messages.')
    }
  }

  async function onSend(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    try {
      await sendMessage(matchId, body)
      setDraft('')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function confirm(kind: 'block' | 'unmatch') {
    setBusy(true)
    setError('')
    try {
      if (kind === 'block') await blockMember(conversation.profileId)
      else await unmatch(matchId)
      setDialog(null)
      onClosed()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Something went wrong. Please try again.')
      setDialog(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex h-[calc(100vh-85px-71px)] min-w-0 flex-1 flex-col md:h-[calc(100vh-85px)]" aria-label={`Conversation with ${conversation.name}`}>
      <header className="flex items-center gap-3 border-b border-[#e4dcd1] px-4 py-3">
        <Link to="/messages" aria-label="Back to conversations" className="md:hidden">
          <ArrowLeft size={20} />
        </Link>
        <MemberAvatar name={conversation.name} photo={conversation.photo} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[18px] font-semibold leading-6 text-ink">{conversation.name}, {conversation.age}</p>
          <p className="truncate text-[12px] text-[#5c5748]">{conversation.location}</p>
        </div>
        <button type="button" onClick={() => setDialog('report')} aria-label="Report" title="Report" className="p-2 text-[#5c5748]"><Flag size={18} /></button>
        <button type="button" onClick={() => setDialog('unmatch')} aria-label="Unmatch" title="Unmatch" className="p-2 text-[#5c5748]"><UserMinus size={18} /></button>
        <button type="button" onClick={() => setDialog('block')} aria-label="Block" title="Block" className="p-2 text-[#5c5748]"><Ban size={18} /></button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Messages">
        {hasMore && (
          <button type="button" onClick={() => void loadOlder()} className="mx-auto mb-4 block text-[14px] text-gold">
            Load earlier messages
          </button>
        )}
        {loading && <p className="text-center text-[14px] text-[#5c5748]">Loading…</p>}
        {!loading && messages.length === 0 && (
          <p className="mt-10 text-center text-[14px] leading-[22px] text-[#5c5748]">
            You matched with {conversation.name}. Start the conversation with something specific from their profile.
          </p>
        )}
        <ul className="space-y-2">
          {messages.map((message) => {
            const mine = message.senderId === userId
            return (
              <li key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-[14px] leading-5 ${mine ? 'bg-gold text-ink' : 'bg-[#efe8d8] text-ink'}`}>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className="mt-1 text-[11px] text-[#5c5748]">{shortTime(message.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div ref={bottom} />
      </div>

      {error && <p role="alert" className="px-4 pb-2 text-[14px] text-[#ff383c]">{error}</p>}
      {notice && <p role="status" className="px-4 pb-2 text-[14px] text-[#5c5748]">{notice}</p>}
      <form onSubmit={onSend} className="flex items-end gap-2 border-t border-[#e4dcd1] p-3">
        <label htmlFor="message" className="sr-only">Message</label>
        <textarea
          id="message"
          value={draft}
          rows={1}
          maxLength={MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="Write a message"
          className="max-h-32 min-h-[38px] flex-1 resize-none rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-3 py-2 text-[14px] text-ink outline-none focus:border-gold"
        />
        <button type="submit" disabled={sending || !draft.trim()} className={primaryButton}>Send</button>
      </form>

      {dialog === 'report' && (
        <ReportDialog
          memberId={conversation.profileId}
          name={conversation.name}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null)
            setError('')
            setNotice('Thank you. Your report was sent to our safety team. You can also block this member.')
          }}
        />
      )}
      {(dialog === 'block' || dialog === 'unmatch') && (
        <Dialog title={dialog === 'block' ? `Block ${conversation.name}?` : `Unmatch with ${conversation.name}?`} onClose={() => setDialog(null)}>
          <p className="mt-2 text-[14px] leading-[22px] text-[#5c5748]">
            {dialog === 'block'
              ? 'You will no longer see each other and this conversation will be closed.'
              : 'This conversation will be closed. You will not be matched again.'}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setDialog(null)} className={secondaryButton}>Cancel</button>
            <button type="button" disabled={busy} onClick={() => void confirm(dialog)} className={primaryButton}>
              {dialog === 'block' ? 'Block' : 'Unmatch'}
            </button>
          </div>
        </Dialog>
      )}
    </section>
  )
}

export function Messages() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    listConversations().then(setConversations, (cause) =>
      setError(cause instanceof ApiError ? cause.message : 'Could not load your conversations.'))
  }, [])

  useEffect(() => {
    // Load conversations and the current user id from Supabase on entry.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh()
    currentUserId().then(setUserId, () => {})
  }, [refresh])

  const selected = conversations?.find((conversation) => conversation.matchId === matchId) ?? null

  return (
    <div className="min-h-screen bg-cream pb-[71px] md:pb-0">
      <DashboardHeader />
      <main className="mx-auto flex max-w-[1100px]">
        <aside
          className={`${matchId ? 'hidden md:block' : 'block'} h-[calc(100vh-85px-71px)] w-full shrink-0 overflow-y-auto border-r border-[#e4dcd1] md:h-[calc(100vh-85px)] md:w-[340px]`}
          aria-label="Conversations"
        >
          <h1 className="px-4 pb-2 pt-6 font-serif text-[28px] leading-9 text-ink">Messages</h1>
          {error && <p role="alert" className="px-4 text-[14px] text-[#ff383c]">{error}</p>}
          {conversations === null && !error && <p className="px-4 text-[14px] text-[#5c5748]" role="status">Loading…</p>}
          {conversations?.length === 0 && (
            <p className="px-4 text-[14px] leading-[22px] text-[#5c5748]">
              No conversations yet. Matches appear here as soon as you and another member like each other.
            </p>
          )}
          <ul>
            {conversations?.map((conversation) => (
              <li key={conversation.matchId}>
                <Link
                  to={`/messages/${conversation.matchId}`}
                  aria-current={conversation.matchId === matchId ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 ${conversation.matchId === matchId ? 'bg-[#efe8d8]' : ''}`}
                >
                  <MemberAvatar name={conversation.name} photo={conversation.photo} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium text-ink">{conversation.name}</span>
                      <span className="shrink-0 text-[11px] text-[#5c5748]">
                        {shortTime(conversation.lastMessageAt ?? conversation.matchedAt)}
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[13px] ${conversation.unreadCount ? 'font-medium text-ink' : 'text-[#5c5748]'}`}>
                        {conversation.lastMessage ?? 'New match — say hello'}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#c0452c] px-1 text-[10px] text-cream">
                          <span className="sr-only">{conversation.unreadCount} unread</span>
                          <span aria-hidden>{conversation.unreadCount}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {selected && userId ? (
          <Thread
            key={selected.matchId}
            conversation={selected}
            userId={userId}
            onChanged={refresh}
            onClosed={() => {
              refresh()
              navigate('/messages', { replace: true })
            }}
          />
        ) : (
          <div className="hidden flex-1 items-center justify-center md:flex">
            <p className="text-[14px] text-[#5c5748]">
              {matchId && conversations ? 'This conversation is no longer available.' : 'Select a conversation to start talking.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
