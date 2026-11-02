import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, Lock, ShieldCheck } from 'lucide-react'
import { StepHeader } from '../components/onboarding/StepHeader'
import {
  ApiError,
  getIdentityVerificationStatus,
  startIdentityVerification,
  type IdentityVerificationStatus,
} from '../lib/api'

const statusLabels: Record<IdentityVerificationStatus, string> = {
  not_started: 'Not started',
  pending: 'In progress',
  under_review: 'Under review',
  approved: 'Approved',
  declined: 'Action required',
}

export function OnboardingIdentity() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<IdentityVerificationStatus>('not_started')
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [pending, setPending] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')

  const refreshStatus = useCallback(async () => {
    try {
      const result = await getIdentityVerificationStatus()
      setStatus(result.status)
      setError('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your verification status.')
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    // Load persisted verification status when the page opens and after returning from Persona.
    // oxlint-disable-next-line react/set-state-in-effect
    void refreshStatus()
    const onFocus = () => void refreshStatus()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshStatus])

  async function beginVerification() {
    if (status === 'under_review' || status === 'approved') {
      navigate('/onboarding/complete')
      return
    }
    if (!consent) {
      setError('Confirm the verification consent before continuing.')
      return
    }

    setPending(true)
    setError('')
    try {
      const result = await startIdentityVerification()
      if (result.url) {
        window.location.assign(result.url)
      } else {
        await refreshStatus()
        if (result.status === 'under_review' || result.status === 'approved') {
          navigate('/onboarding/complete')
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start identity verification. Please try again.')
      setPending(false)
    }
  }

  const canContinue = status === 'under_review' || status === 'approved'

  return (
    <div className="min-h-screen bg-cream">
      <StepHeader step={3} total={3} label="Setting up your profile" />

      <main className="mx-auto w-full max-w-[666px] px-4 pb-10 pt-9 md:px-0 md:pb-[80px] md:pt-[72px]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 whitespace-nowrap text-[14px] leading-5 text-[#5c5748]">
          <Link to="/onboarding/questions" className="flex items-center gap-2">
            <ChevronLeft size={12} strokeWidth={1.5} aria-hidden /> Back to compatibility questions
          </Link>
          <span className="size-1.5 shrink-0 rounded-full bg-[#8a6a1f]" aria-hidden />
          <span className="font-medium text-[#8a6a1f]">Identity verification</span>
        </nav>

        <h1 className="mt-[25px] font-serif text-[40px] leading-[48px] text-ink md:mt-6">
          Last step — verify it&apos;s really you
        </h1>
        <p className="mt-[18px] max-w-[510px] text-[16px] leading-6 text-[#5c5748]">
          Verify securely with Persona. Your ID and selfie are collected directly by their hosted verification flow and
          are never uploaded to TrueConnect.
        </p>

        <section className="mt-6 rounded-lg border border-[#e4dcd1] bg-[#efe8d8] p-6" aria-labelledby="verification-title">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-[#8a6a1f]">
              <ShieldCheck size={22} strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h2 id="verification-title" className="font-serif text-[18px] font-semibold leading-6 text-ink">
                Private and secure verification
              </h2>
              <p className="mt-2 text-[14px] leading-[22px] text-[#5c5748]">
                Persona will guide you through selecting a government-issued ID and taking a selfie. TrueConnect only
                receives your verification status, not document images or identity details.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[#dcd5c6] pt-4">
            <span className="flex items-center gap-2 text-[14px] text-[#5c5748]">
              <Lock size={14} className="text-[#8a6a1f]" aria-hidden />
              Verification status
            </span>
            <span className="rounded-full bg-cream px-3 py-1 text-[12px] font-medium text-ink" role="status">
              {loadingStatus ? 'Checking…' : statusLabels[status]}
            </span>
          </div>
          {status === 'declined' && (
            <p className="mt-3 text-[14px] leading-[22px] text-[#5c5748]">
              Persona could not verify this submission. You can start a new verification or contact support if you
              believe this is a mistake.
            </p>
          )}
        </section>

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <span className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked)
                setError('')
              }}
              className="peer sr-only"
            />
            <span className="flex size-[18px] items-center justify-center rounded border border-[#5c5748] bg-cream text-[#8a6a1f] peer-checked:border-ink peer-checked:bg-ink peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50">
              <Check size={12} className="opacity-0" aria-hidden />
            </span>
          </span>
          <span className="text-[14px] leading-[22px] text-[#5c5748]">
            By continuing, you confirm that the identity information you provide is accurate and that you agree to
            Persona&apos;s verification process.
          </span>
        </label>

        {error && <p role="alert" className="mt-6 text-[14px] leading-[22px] text-[#ff383c]">{error}</p>}

        <div className="mt-[55px] flex flex-col-reverse items-center gap-[17px] border-t border-[#e4dcd1] pt-[19px] md:flex-row md:justify-between md:pt-4">
          <Link to="/" className="text-[14px] text-[#5c5748]">Save &amp; continue later</Link>
          <div className="flex items-center gap-4">
            {status !== 'not_started' && (
              <button type="button" onClick={() => void refreshStatus()} className="text-[14px] text-[#8a6a1f]">
                Refresh status
              </button>
            )}
            <button
              type="button"
              onClick={() => void beginVerification()}
              disabled={pending || loadingStatus}
              className="h-[38px] rounded-md bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-70"
            >
              {pending
                ? 'Opening Persona…'
                : canContinue
                  ? 'Continue'
                  : status === 'pending'
                    ? 'Continue verification'
                    : 'Start verification'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
