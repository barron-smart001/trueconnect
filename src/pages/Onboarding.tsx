import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Clock, FileText, Briefcase, MapPin, ShieldCheck, type LucideIcon } from 'lucide-react'
import { OnboardingHeader } from '../components/onboarding/OnboardingHeader'
import { LocationModal } from '../components/onboarding/LocationModal'
import { STEP_PATH, nextStep, useOnboardingProgress, type Step } from '../lib/onboarding'
import { firstName, useUser } from '../lib/session'

type Status = 'done' | 'required' | 'not-started'

const steps: { icon: LucideIcon; key?: Step; title: string; body: string; status: Status; row: string; text: string; to?: string }[] = [
  { icon: Check, title: 'Create account', body: 'Email confirmed and password set.', status: 'done', row: 'px-[25px] pb-[15px] pt-[17px] md:px-6', text: 'ml-4 md:ml-5' },
  {
    icon: Briefcase,
    key: 'profile',
    title: 'Add photos & write your bio',
    body: 'At least three photos and a short bio help you get better, faster matches.',
    status: 'required',
    to: '/onboarding/profile',
    row: 'border-t border-[#dcd5c6] px-[17px] pb-4 pt-[21px] md:px-6',
    text: 'ml-4 max-w-[98px] md:max-w-none',
  },
  {
    icon: Clock,
    key: 'questions',
    title: 'Answer a few compatibility questions',
    body: 'Helps our matching model understand your values, family expectations, and lifestyle.',
    status: 'not-started',
    to: '/onboarding/questions',
    row: 'border-t border-[#dcd5c6] px-[17px] pb-4 pt-[21px] md:px-6',
    text: 'ml-4 max-w-[107px] md:ml-[17px] md:max-w-none',
  },
  {
    icon: FileText,
    key: 'identity',
    title: 'Verify your identity',
    body: 'Upload a government ID — this is what unlocks your visibility to other members.',
    status: 'not-started',
    to: '/onboarding/identity',
    row: 'px-[17px] pb-[15px] pt-[21px] md:px-6',
    text: 'ml-4 max-w-[107px] md:ml-[17px] md:max-w-none',
  },
]

function StatusPill({ status }: { status: Status }) {
  if (status === 'done') return <span className="hidden rounded-full bg-[#5f7a56] px-3 py-[5px] text-[12px] leading-[18px] text-cream md:inline">Done</span>
  if (status === 'required') return <span className="rounded-full bg-gold px-3 py-[5px] text-[12px] leading-[18px] text-ink">Required</span>
  return <span className="rounded-full border border-[#e4dcd1] px-[13px] py-[5px] text-[12px] leading-[18px] text-[#5c5748]">Not started</span>
}

export function Onboarding() {
  // The location modal appears when a new location is detected; `?location` previews it.
  const [modalOpen, setModalOpen] = useState(() => new URLSearchParams(window.location.search).has('location'))
  const navigate = useNavigate()
  const user = useUser()
  const done = useOnboardingProgress()
  const next = nextStep(done)

  // First unfinished step is "Required", later ones "Not started", finished ones "Done".
  const rows = steps.map((s) => ({
    ...s,
    status: (!s.key ? 'done' : done.includes(s.key) ? 'done' : s.key === next ? 'required' : 'not-started') as Status,
  }))

  return (
    <div className="min-h-screen bg-cream">
      <OnboardingHeader />

      <main className="mx-auto w-full max-w-[664px] px-4 pb-[71px] pt-[35px] md:px-0 md:pt-[70px]">
        <span className="flex size-14 items-center justify-center rounded-full bg-[linear-gradient(140deg,#f0d29c,#967325)] text-ink">
          <Check size={22} strokeWidth={2} />
        </span>

        <p className="mt-[25px] flex items-center gap-2.5 text-[14px] font-medium leading-5 text-gold">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden /> Account created
        </p>

        <h1 className="mt-[19px] font-serif text-[40px] leading-[48px] text-ink">
          Welcome to TrueConnect, <span className="text-gold">{firstName(user)}</span>.
        </h1>

        <p className="mt-[15px] text-[16px] leading-6 text-[#5c5748]">
          Your account is live. Before you&apos;re visible to other verified members,
          <br /> there are a few quick things to finish — most people are done in under ten minutes.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-[14px] text-ink">
          <p className="flex h-9 items-center gap-[9px] rounded-full border border-[#e4dcd1] bg-[#efe8d8] pl-[15px] pr-4">
            <ShieldCheck size={10} strokeWidth={1.5} className="text-[#967a36]" aria-hidden /> Intent locked for{' '}
            <span className="-ml-1 font-medium">90 days</span>
          </p>
          <p className="flex h-9 items-center gap-[9px] rounded-full border border-[#e4dcd1] bg-[#efe8d8] pl-[15px] pr-[30px]">
            <MapPin size={10} strokeWidth={1.5} className="text-[#967a36]" aria-hidden /> Based in:{' '}
            <span className="-ml-1 font-medium">Ikeja, Lagos</span>
          </p>
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-[#e4dcd1] border-b-2 border-b-[#dcd5c6] bg-[#efe8d8]">
          <div className="flex min-h-[67px] items-center justify-between border-b border-[#e8e1d3] px-[25px] py-[21px] md:py-0">
            <h2 className="max-w-[140px] font-serif text-[18px] font-semibold leading-6 text-ink md:max-w-none">Finish setting up your profile</h2>
            <span className="whitespace-nowrap text-[14px] text-[#5c5748]">{rows.filter((r) => r.status === 'done').length} of 4 complete</span>
          </div>
          <ul>
            {rows.map(({ icon, title, body, status, row, text, to }) => {
              const Icon = status === 'done' ? Check : icon
              return (
              <li key={title} className={to ? 'relative' : undefined}>
                {to && <Link to={to} aria-label={title} className="absolute inset-0" />}
                <div className={`flex items-center ${row}`}>
                <span
                  className={`flex size-[42px] shrink-0 items-center justify-center rounded-full border ${
                    status === 'done'
                      ? 'border-[#5f7a56] bg-[#e3dfce] text-[#5f7a56]'
                      : status === 'required'
                        ? 'border-[#8a6a1f] bg-[#ece1ca] text-[#8a6a1f]'
                        : 'border-[#e4dcd1] text-[#5c5748]'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} aria-hidden />
                </span>
                <div className={`flex-1 ${text}`}>
                  <p className="text-[16px] font-semibold leading-6 text-ink">{title}</p>
                  <p className="max-w-[401px] text-[14px] leading-[22px] text-[#5c5748]">{body}</p>
                </div>
                <div className="flex shrink-0 items-center gap-[18px]">
                  <StatusPill status={status} />
                  {status !== 'done' && <ChevronRight size={14} className="text-[#5c5748]" aria-hidden />}
                </div>
                </div>
              </li>
              )
            })}
          </ul>
        </section>

        <div className="mt-[25px] flex items-center gap-[27px]">
          <button
            type="button"
            onClick={() => navigate(next ? STEP_PATH[next] : '/onboarding/complete')}
            className="h-[38px] w-[165px] rounded-md bg-gold text-[14px] font-medium text-ink"
          >
            Continue
          </button>
          <Link to="/" className="text-[14px] text-[#5c5748]">I&apos;ll do this later</Link>
        </div>

        <section className="mt-6 flex items-center gap-[27px] rounded-lg bg-ink py-4 pl-4 md:py-[27px] pr-6 md:pl-[29px] md:pr-8">
          <span className="flex size-[84px] shrink-0 items-center justify-center rounded-full border-[10px] border-[#393631] bg-[#1d1912]">
            <span className="h-px w-3 bg-[#a49c8b]" aria-hidden />
          </span>
          <div className="max-w-[345px]">
            <h2 className="font-serif text-[16px] font-semibold leading-6 text-cream">Your Trust Score is pending</h2>
            <p className="mt-1 text-[14px] leading-[22px] text-[#b8b09c]">
              It&apos;s calculated once your ID is verified and your profile<br className="md:hidden" /> is complete — the higher it is, the more visibility and<br className="md:hidden" /> better matches you get.
            </p>
          </div>
        </section>
      </main>

      {modalOpen && (
        <LocationModal location="ikeja, Lagos" onClose={() => setModalOpen(false)} onConfirm={() => setModalOpen(false)} />
      )}
    </div>
  )
}
