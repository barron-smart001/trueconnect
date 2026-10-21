import { useEffect, useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { FiltersPanel } from '../components/dashboard/FiltersPanel'
import { ProfileCard } from '../components/dashboard/ProfileCard'
import { IntroductionsCard, QuickPreferences, SafetyNote } from '../components/dashboard/SidePanels'
import {
  DAILY_INTRODUCTIONS,
  DEFAULT_FILTERS,
  PROFILES,
  STARTING_USED,
  hoursUntilReset,
  matches,
  type Filters,
} from '../lib/discover'

type Decision = { id: number; action: 'like' | 'pass' }

export function Dashboard() {
  // `draft` is what the panel shows; `applied` is what the deck is filtered by (set by "Apply filters").
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const [hoursLeft, setHoursLeft] = useState(hoursUntilReset)
  // Below 768px the filters live in an overlay opened by "All Filters"; from 768px up they are a fixed column.
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setHoursLeft(hoursUntilReset()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!filtersOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFiltersOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [filtersOpen])

  const used = Math.min(DAILY_INTRODUCTIONS, STARTING_USED + decisions.length)
  const limitReached = used >= DAILY_INTRODUCTIONS

  const queue = useMemo(() => {
    const seen = new Set(decisions.map((d) => d.id))
    return PROFILES.filter((p) => matches(p, applied) && !seen.has(p.id))
  }, [applied, decisions])
  const profile = limitReached ? null : (queue[0] ?? null)

  const decide = (action: Decision['action']) => profile && setDecisions((d) => [...d, { id: profile.id, action }])
  const undo = () => setDecisions((d) => d.slice(0, -1))
  const toggleSaved = () =>
    profile &&
    setSaved((s) => {
      const next = new Set(s)
      if (!next.delete(profile.id)) next.add(profile.id)
      return next
    })

  // The "Verified only" toggle in Quick preferences changes the filter straight away.
  const setVerified = (verifiedOnly: boolean) => {
    setDraft((f) => ({ ...f, verifiedOnly }))
    setApplied((f) => ({ ...f, verifiedOnly }))
  }
  const reset = () => {
    setDraft(DEFAULT_FILTERS)
    setApplied(DEFAULT_FILTERS)
  }

  return (
    <div className="min-h-screen bg-cream">
      <DashboardHeader />
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-[calc(71px+24px)] pt-[35px] md:grid-cols-[288px_1fr_246px] md:items-start md:px-8 md:pb-[74px] md:pt-[70px] xl:px-[120px]">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
          className="-mb-2 flex h-[38px] items-center justify-between rounded-lg border border-[#e4dcd1] bg-cream px-4 text-[14px] text-ink md:hidden"
        >
          All Filters
          <Settings2 size={14} strokeWidth={1.5} aria-hidden />
        </button>

        <div
          className={`${filtersOpen ? 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60' : 'hidden'} md:static md:z-auto md:block md:overflow-visible md:bg-transparent`}
          role={filtersOpen ? 'dialog' : undefined}
          aria-modal={filtersOpen || undefined}
          aria-label={filtersOpen ? 'Filters' : undefined}
          onClick={(e) => e.target === e.currentTarget && setFiltersOpen(false)}
        >
          <FiltersPanel
            filters={draft}
            onChange={setDraft}
            onApply={() => {
              setApplied(draft)
              setFiltersOpen(false)
            }}
            onReset={reset}
          />
        </div>
        <div className="md:pt-[36px]">
          <ProfileCard
            profile={profile}
            emptyReason={limitReached ? 'limit' : 'none'}
            hoursLeft={hoursLeft}
            saved={!!profile && saved.has(profile.id)}
            canUndo={decisions.length > 0}
            onPass={() => decide('pass')}
            onLike={() => decide('like')}
            onUndo={undo}
            onSave={toggleSaved}
          />
        </div>
        <div className="space-y-6">
          <IntroductionsCard used={used} total={DAILY_INTRODUCTIONS} hoursLeft={hoursLeft} />
          <QuickPreferences filters={applied} onVerifiedChange={setVerified} />
          <SafetyNote />
        </div>
      </main>
    </div>
  )
}
