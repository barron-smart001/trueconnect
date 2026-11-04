import { BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { MemberAvatar } from '../components/social/MemberAvatar'
import {
  ApiError,
  getSavedProfiles,
  listConversations,
  type Conversation,
  type MemberSummary,
  type SavedProfile,
} from '../lib/api'

type Tab = 'matches' | 'saved'

function MemberRow({ member, action }: { member: MemberSummary; action?: { to: string; label: string } }) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-[#e4dcd1] bg-[#efe8d8] p-4">
      <MemberAvatar name={member.name} photo={member.photo} size={56} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-serif text-[18px] font-semibold leading-6 text-ink">
          {member.name}, {member.age}
          {member.verified && <BadgeCheck size={16} className="text-gold" aria-label="Verified" />}
        </p>
        <p className="truncate text-[14px] leading-5 text-[#5c5748]">{member.location} · {member.intent}</p>
      </div>
      {action && (
        <Link to={action.to} className="flex h-[38px] shrink-0 items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink">
          {action.label}
        </Link>
      )}
    </li>
  )
}

export function Matches() {
  const [tab, setTab] = useState<Tab>('matches')
  const [matches, setMatches] = useState<Conversation[] | null>(null)
  const [saved, setSaved] = useState<SavedProfile[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listConversations(), getSavedProfiles()]).then(
      ([matchList, savedList]) => {
        if (!active) return
        setMatches(matchList)
        setSaved(savedList)
      },
      (cause) => active && setError(cause instanceof ApiError ? cause.message : 'Could not load your matches. Please try again.'),
    )
    return () => {
      active = false
    }
  }, [])

  const list = tab === 'matches' ? matches : saved

  return (
    <div className="min-h-screen bg-cream pb-[71px] md:pb-0">
      <DashboardHeader />
      <main className="mx-auto max-w-[760px] px-4 py-10 md:px-8 md:py-16">
        <h1 className="font-serif text-[40px] leading-[48px] text-ink">Matches</h1>
        <div role="tablist" aria-label="Matches and saved profiles" className="mt-6 flex gap-2">
          {(['matches', 'saved'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`h-[38px] rounded-full border px-4 text-[14px] font-medium ${tab === value ? 'border-gold bg-gold text-ink' : 'border-[#e4dcd1] text-[#5c5748]'}`}
            >
              {value === 'matches' ? `Matches${matches ? ` (${matches.length})` : ''}` : `Saved${saved ? ` (${saved.length})` : ''}`}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-6 text-[14px] text-[#ff383c]">{error}</p>}
        {!error && list === null && <p className="mt-6 text-[14px] text-[#5c5748]" role="status">Loading…</p>}
        {list?.length === 0 && (
          <p className="mt-6 text-[16px] leading-6 text-[#5c5748]">
            {tab === 'matches'
              ? 'No matches yet. When you and another member both like each other, you’ll see them here.'
              : 'No saved profiles. Use the save button on a profile in your daily introductions.'}
          </p>
        )}
        {tab === 'matches' && matches && matches.length > 0 && (
          <ul className="mt-6 space-y-3">
            {matches.map((match) => (
              <MemberRow key={match.matchId} member={match} action={{ to: `/messages/${match.matchId}`, label: 'Message' }} />
            ))}
          </ul>
        )}
        {tab === 'saved' && saved && saved.length > 0 && (
          <ul className="mt-6 space-y-3">
            {saved.map((profile) => <MemberRow key={profile.profileId} member={profile} />)}
          </ul>
        )}
      </main>
    </div>
  )
}
