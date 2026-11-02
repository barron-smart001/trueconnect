import { useCallback, useEffect, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { FiltersPanel } from '../components/dashboard/FiltersPanel'
import { ProfileCard } from '../components/dashboard/ProfileCard'
import { IntroductionsCard, QuickPreferences, SafetyNote } from '../components/dashboard/SidePanels'
import {
  ApiError,
  loadDashboard,
  recordDiscoverAction,
  toggleSavedProfile,
  undoLastDiscoverAction,
  type DashboardData,
} from '../lib/api'
import { DAILY_INTRODUCTIONS, DEFAULT_FILTERS, hoursUntilReset, type Filters } from '../lib/discover'

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS)
  const [hoursLeft, setHoursLeft] = useState(hoursUntilReset)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async (filters?: Filters) => {
    setLoading(true)
    try {
      const result = await loadDashboard(filters)
      setDashboard(result)
      setDraft(result.filters)
      setApplied(result.filters)
      setError('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load discovery. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load member-specific filters and recommendations from Supabase on entry.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()
  }, [refresh])

  useEffect(() => {
    const timer = setInterval(() => setHoursLeft(hoursUntilReset()), 60_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!filtersOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setFiltersOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [filtersOpen])

  const profile = dashboard?.profiles[0] ?? null
  const used = dashboard?.used ?? 0
  const total = dashboard?.total ?? DAILY_INTRODUCTIONS

  async function applyFilters(filters: Filters) {
    setPendingAction(true)
    setError('')
    try {
      const result = await loadDashboard(filters)
      setDashboard(result)
      setDraft(result.filters)
      setApplied(result.filters)
      setFiltersOpen(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not apply these filters. Please try again.')
    } finally {
      setPendingAction(false)
    }
  }

  async function decide(action: 'like' | 'pass') {
    if (!profile) return
    setPendingAction(true)
    setError('')
    try {
      await recordDiscoverAction(profile.id, action)
      const result = await loadDashboard(applied)
      setDashboard(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your response. Please try again.')
    } finally {
      setPendingAction(false)
    }
  }

  async function undo() {
    setPendingAction(true)
    setError('')
    try {
      await undoLastDiscoverAction()
      const result = await loadDashboard(applied)
      setDashboard(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not undo that response. Please try again.')
    } finally {
      setPendingAction(false)
    }
  }

  async function toggleSaved() {
    if (!profile) return
    setPendingAction(true)
    setError('')
    try {
      await toggleSavedProfile(profile.id)
      const result = await loadDashboard(applied)
      setDashboard(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your saved profiles. Please try again.')
    } finally {
      setPendingAction(false)
    }
  }

  async function setVerified(verifiedOnly: boolean) {
    const next = { ...applied, verifiedOnly }
    setDraft(next)
    await applyFilters(next)
  }

  async function reset() {
    setDraft(DEFAULT_FILTERS)
    await applyFilters(DEFAULT_FILTERS)
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
          onClick={(event) => event.target === event.currentTarget && setFiltersOpen(false)}
        >
          <FiltersPanel
            filters={draft}
            onChange={setDraft}
            onApply={() => void applyFilters(draft)}
            onReset={() => void reset()}
          />
        </div>
        <div className="md:pt-[36px]">
          {error && <p role="alert" className="mb-4 text-[14px] leading-[22px] text-[#ff383c]">{error}</p>}
          <ProfileCard
            profile={profile}
            emptyReason={loading ? 'loading' : used >= total ? 'limit' : 'none'}
            hoursLeft={hoursLeft}
            saved={!!profile && (dashboard?.savedIds.includes(profile.id) ?? false)}
            canUndo={dashboard?.canUndo ?? false}
            pending={pendingAction}
            onPass={() => void decide('pass')}
            onLike={() => void decide('like')}
            onUndo={() => void undo()}
            onSave={() => void toggleSaved()}
          />
        </div>
        <div className="space-y-6">
          <IntroductionsCard used={used} total={total} hoursLeft={hoursLeft} />
          <QuickPreferences filters={applied} onVerifiedChange={(value) => void setVerified(value)} />
          <SafetyNote />
        </div>
      </main>
    </div>
  )
}
