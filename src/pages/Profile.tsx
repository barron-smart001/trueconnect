import { BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { MemberAvatar } from '../components/social/MemberAvatar'
import { Dialog, primaryButton, secondaryButton } from '../components/social/SafetyDialogs'
import {
  ApiError,
  deleteAccount,
  getMyProfile,
  setDiscoveryPaused,
  signOut,
  type IdentityVerificationStatus,
  type MyProfile,
} from '../lib/api'
import { clearUser } from '../lib/session'

const verificationLabel: Record<IdentityVerificationStatus, string> = {
  not_started: 'Not started',
  pending: 'In progress',
  under_review: 'Under review',
  approved: 'Verified',
  declined: 'Declined',
}

export function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<MyProfile | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    let active = true
    getMyProfile().then(
      (result) => active && setProfile(result),
      (cause) => {
        if (!active) return
        setError(cause instanceof ApiError ? cause.message : 'Could not load your profile. Please try again.')
        setProfile(null)
      },
    )
    return () => {
      active = false
    }
  }, [])

  async function onSignOut() {
    setBusy(true)
    try {
      await signOut()
      clearUser()
      navigate('/', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not sign out. Please try again.')
      setBusy(false)
    }
  }

  async function onTogglePause() {
    if (!profile) return
    setBusy(true)
    setError('')
    try {
      await setDiscoveryPaused(!profile.paused)
      setProfile({ ...profile, paused: !profile.paused })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not update your visibility. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    setBusy(true)
    setError('')
    try {
      await deleteAccount()
      clearUser()
      navigate('/', { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not delete your account. Please try again.')
      setDeleting(false)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-[71px] md:pb-0">
      <DashboardHeader />
      <main className="mx-auto max-w-[760px] px-4 py-10 md:px-8 md:py-16">
        <h1 className="font-serif text-[40px] leading-[48px] text-ink">Your profile</h1>
        {error && <p role="alert" className="mt-4 text-[14px] text-[#ff383c]">{error}</p>}
        {profile === undefined && <p className="mt-6 text-[14px] text-[#5c5748]" role="status">Loading…</p>}

        {profile === null && !error && (
          <p className="mt-6 text-[16px] leading-6 text-[#5c5748]">
            You haven’t created your profile yet.{' '}
            <Link to="/onboarding" className="text-gold underline">Finish setting up</Link>
          </p>
        )}

        {profile && (
          <>
            <section className="mt-6 rounded-lg border border-[#e4dcd1] bg-[#efe8d8] p-6" aria-label="Profile preview">
              <div className="flex items-center gap-4">
                <MemberAvatar name={profile.fullName} photo={profile.photos[0]?.url} size={72} />
                <div>
                  <p className="flex items-center gap-1.5 font-serif text-[24px] font-semibold leading-8 text-ink">
                    {profile.fullName}{profile.age !== null && `, ${profile.age}`}
                    {profile.verification === 'approved' && <BadgeCheck size={18} className="text-gold" aria-label="Verified" />}
                  </p>
                  <p className="text-[14px] text-[#5c5748]">{profile.location} · {profile.intent}</p>
                </div>
              </div>
              {profile.bio && <p className="mt-4 text-[14px] leading-[22px] text-ink">{profile.bio}</p>}
              {profile.promptAnswer && (
                <p className="mt-4 text-[14px] leading-[22px] text-ink">
                  <span className="text-[#5c5748]">{profile.prompt}</span> {profile.promptAnswer}
                </p>
              )}
              {profile.photos.length > 1 && (
                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {profile.photos.map((photo) => (
                    <li key={photo.path}><img src={photo.url} alt="" loading="lazy" className="aspect-square w-full rounded-md object-cover" /></li>
                  ))}
                </ul>
              )}
              <Link to="/onboarding/profile" className={`${secondaryButton} mt-6 w-fit`}>Edit profile</Link>
            </section>

            <section className="mt-6 rounded-lg border border-[#e4dcd1] p-6" aria-label="Identity verification">
              <h2 className="font-serif text-[18px] font-semibold leading-6 text-ink">Identity verification</h2>
              <p className="mt-1 text-[14px] text-[#5c5748]">Status: {verificationLabel[profile.verification]}</p>
              {(profile.verification === 'not_started' || profile.verification === 'pending' || profile.verification === 'declined') && (
                <Link to="/onboarding/identity" className={`${primaryButton} mt-4 w-fit`}>
                  {profile.verification === 'declined' ? 'Try again' : 'Verify your identity'}
                </Link>
              )}
            </section>

            <section className="mt-6 rounded-lg border border-[#e4dcd1] p-6" aria-label="Visibility">
              <h2 className="font-serif text-[18px] font-semibold leading-6 text-ink">Visibility</h2>
              <p className="mt-1 text-[14px] leading-[22px] text-[#5c5748]">
                {profile.paused
                  ? 'Your profile is hidden. Nobody new will see you in their introductions; existing matches can still message you.'
                  : 'Your profile is visible to members who match your intent and city.'}
              </p>
              <button type="button" disabled={busy} onClick={() => void onTogglePause()} className={`${secondaryButton} mt-4`}>
                {profile.paused ? 'Show my profile' : 'Pause my profile'}
              </button>
            </section>
          </>
        )}

        <section className="mt-6 flex flex-wrap gap-3" aria-label="Account">
          <button type="button" disabled={busy} onClick={() => void onSignOut()} className={secondaryButton}>Sign out</button>
          <Link to="/contact" className={secondaryButton}>Contact support</Link>
          <button type="button" disabled={busy} onClick={() => setDeleting(true)} className={`${secondaryButton} text-[#ff383c]`}>
            Delete account
          </button>
        </section>
      </main>

      {deleting && (
        <Dialog title="Delete your account?" onClose={() => { setDeleting(false); setConfirmation('') }}>
          <p className="mt-2 text-[14px] leading-[22px] text-[#5c5748]">
            This permanently removes your profile, photos, matches and messages. It cannot be undone.
          </p>
          <label htmlFor="delete-confirm" className="mt-4 block text-[14px] text-ink">Type DELETE to confirm</label>
          <input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="mt-1 h-[41px] w-full rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-4 text-[14px] text-ink outline-none focus:border-gold"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => { setDeleting(false); setConfirmation('') }} className={secondaryButton}>Cancel</button>
            <button type="button" disabled={busy || confirmation !== 'DELETE'} onClick={() => void onDelete()} className={primaryButton}>
              {busy ? 'Deleting…' : 'Delete account'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
