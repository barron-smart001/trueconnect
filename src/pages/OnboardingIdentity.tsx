import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, Check, ChevronLeft, CircleCheck, Heart, IdCard, Lock, Plus, type LucideIcon } from 'lucide-react'
import { StepHeader } from '../components/onboarding/StepHeader'
import { ApiError, submitIdentity } from '../lib/api'
import { completeStep } from '../lib/onboarding'

// Simple line icons matching the design's passport and licence glyphs.
const PassportIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="6.5" y="3.5" width="11" height="17" rx="2.5" />
    <circle cx="12" cy="9" r="1.8" />
    <path d="M9.5 15h5" />
  </svg>
)
const LicenseIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
    <circle cx="8" cy="12" r="1.8" />
    <path d="M13.5 12h5" />
  </svg>
)

const idTypes: { label: string; icon: LucideIcon | typeof PassportIcon }[] = [
  { label: 'National ID', icon: IdCard },
  { label: 'Passport', icon: PassportIcon },
  { label: "Driver's License", icon: LicenseIcon },
]

const assurances: { icon: LucideIcon; size: number; title: string; body: ReactNode; width: string; lift?: boolean }[] = [
  { icon: Lock, size: 20, title: 'Encrypted & secure', body: 'Documents are encrypted end-to-end and only used for verification.', width: 'max-w-[190px]' },
  { icon: CircleCheck, size: 20, title: 'Reviewed by real people', body: 'A human reviewer double-checks every submission, not just an algorithm.', width: 'max-w-[155px]' },
  { icon: Heart, size: 20, title: 'Never shown publicly', body: <>Your ID and selfie are never<br className="md:hidden" /> visible to other members — only your verified badge is.</>, width: 'md:max-w-[180px]', lift: true },
]

function Section({ title, hint, children, first }: { title: string; hint: string; children: ReactNode; first?: boolean }) {
  return (
    <section className={`md:pr-[2px] ${first ? 'mt-6' : 'mt-[25px]'}`} aria-label={title}>
      <h2 className="font-serif text-[18px] font-semibold leading-6 text-ink">{title}</h2>
      <p className="mt-[7px] text-[14px] leading-5 text-[#5c5748]">{hint}</p>
      {children}
    </section>
  )
}

function UploadTile({ side, file, onFile, className = '' }: { side: 'front' | 'back'; file: string | null; onFile: (name: string) => void; className?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const open = () => input.current?.click()

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0].name)}
      />
      {file ? (
        <button
          type="button"
          onClick={open}
          className={`flex flex-col items-center justify-center rounded-lg border border-[#5f7a56] bg-[linear-gradient(149deg,#e8e6d8,#f1ede1)] text-center ${className}`}
        >
          <Check size={23} strokeWidth={1.5} className="text-[#5f7a56]" aria-hidden />
          <span className="mt-[5px] text-[12px] leading-[18px] text-ink">{side === 'front' ? 'Front' : 'Back'} side uploaded</span>
          <span className="mt-px text-[12px] leading-[18px] text-[#797466]">{file}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d0c9ba] bg-[#efe7d6] pb-0 pl-0 pr-1 pt-[3px] text-center ${className}`}
        >
          <Plus size={22} strokeWidth={1.5} className="text-[#8a6a1f]" aria-hidden />
          <span className="mt-2 text-[12px] leading-[18px] text-ink">Upload {side} side</span>
          <span className="mt-px text-[12px] leading-[18px] text-[#797464]">JPG or PNG, up to 10MB</span>
        </button>
      )}
    </>
  )
}

export function OnboardingIdentity() {
  const navigate = useNavigate()
  const [idType, setIdType] = useState(0)
  const [front, setFront] = useState<string | null>('national-id-front.jpg')
  const [back, setBack] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  // A passport only has a photo page; the other documents need both sides.
  const needsBack = idTypes[idType].label !== 'Passport'

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream">
      <StepHeader step={3} total={3} label="Setting up your profile" />

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!front) return setError('Upload the front of your ID to continue.')
          if (needsBack && !back) return setError('Upload the back of your ID to continue.')
          setError(undefined)
          setPending(true)
          try {
            await submitIdentity()
            completeStep('identity')
            navigate('/onboarding/complete')
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
          } finally {
            setPending(false)
          }
        }}
        className="mx-auto w-full max-w-[666px] px-4 pb-5 pt-9 md:px-0 md:pb-[80px] md:pt-[72px]"
      >
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 whitespace-nowrap text-[14px] leading-5 text-[#5c5748]">
          <Link to="/onboarding/questions" className="flex items-center gap-2">
            <ChevronLeft size={12} strokeWidth={1.5} aria-hidden /> Back to compatibility questions
          </Link>
          <span className="size-1.5 shrink-0 rounded-full bg-[#8a6a1f]" aria-hidden />
          <span className="font-medium text-[#8a6a1f]">Identity verification</span>
        </nav>

        <h1 className="mt-[25px] font-serif md:mt-6 text-[40px] leading-[48px] text-ink">Last step — verify it&apos;s really you</h1>
        <p className="mt-[18px] max-w-[510px] text-[16px] leading-6 text-[#5c5748]">
          This is what unlocks your visibility to other verified members. It takes<br className="md:hidden" /> about two minutes, and your documents are never shown on your<br className="md:hidden" /> profile.
        </p>

        <Section first title="Choose your ID type" hint="Must be current and government-issued">
          <div role="radiogroup" aria-label="ID type" className="mt-[17px] grid grid-cols-3 gap-2">
            {idTypes.map(({ label, icon: Icon }, i) => {
              const selected = idType === i
              return (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setIdType(i)}
                  className={`flex h-[90px] flex-col items-center rounded-lg border px-4 md:h-[75px] md:px-0 text-[12px] leading-[18px] ${
                    selected ? 'justify-center gap-2 pb-[2px] border-ink bg-ink text-cream' : 'justify-center gap-[6px] pb-[6px] border-[#e4dcd1] bg-cream text-[#5c5748]'
                  }`}
                >
                  <Icon size={24} className={selected ? 'text-gold' : 'text-[#5c5748]'} />
                  {label}
                </button>
              )
            })}
          </div>
        </Section>

        <Section title="Upload your ID" hint="Clear photo, all four corners visible, no glare">
          <div className="mt-[17px] grid gap-4 md:grid-cols-2">
            <UploadTile side="front" file={front} onFile={setFront} className="h-[191px]" />
            <UploadTile side="back" file={back} onFile={setBack} className="h-[186px] md:mt-[3px]" />
          </div>
        </Section>

        <Section title="Take a quick selfie" hint="We match this to your ID to confirm it's really you">
          <div className="mt-[17px] flex items-center gap-6 rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-6 py-6">
            <span className="flex size-[90px] shrink-0 items-center justify-center rounded-full border border-dashed border-[#8a6a1f] bg-cream text-[#8a6a1f]">
              <Camera size={28} strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <h3 className="font-serif text-[16px] font-semibold leading-6 text-ink">Face verification</h3>
              <p className="mt-[5px] max-w-[440px] text-[14px] leading-[22px] text-[#5c5748]">
                Look directly at the camera in good lighting, with no hat, sunglasses,<br className="md:hidden" /> or filters.
              </p>
              <button
                type="button"
                className="mt-[10px] flex h-[37px] items-center gap-2 rounded-md border border-[#e6ded2] px-[17px] text-[14px] text-ink"
              >
                <Camera size={12} strokeWidth={1.5} aria-hidden /> Open camera
              </button>
            </div>
          </div>
        </Section>

        <ul className="mt-[25px] grid gap-10 md:grid-cols-[235px_235px_1fr] md:gap-0" aria-label="How we protect your documents">
          {assurances.map(({ icon: Icon, size, title, body, width, lift }) => (
            <li key={title}>
              <Icon size={size} strokeWidth={1.5} className="text-[#8a6a1f]" aria-hidden />
              <p className={`text-[14px] font-medium leading-5 text-ink ${lift ? 'mt-[11px]' : 'mt-4'}`}>{title}</p>
              <p className={`${lift ? 'mt-0.5' : 'mt-px'} text-[14px] leading-[22px] text-[#5c5748] ${width}`}>{body}</p>
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="mt-6 text-[14px] leading-[22px] text-[#ff383c]">
            {error}
          </p>
        )}

        <label className={`${error ? 'mt-4' : 'mt-6'} flex cursor-pointer items-start gap-3`}>
          <span className="relative mt-0.5 shrink-0">
            <input type="checkbox" required className="peer sr-only" />
            <span className="flex size-[18px] items-center justify-center rounded border border-[#706b5c] text-gold peer-checked:border-ink peer-checked:bg-ink peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50">
              <Check size={12} strokeWidth={2.5} className="opacity-0" aria-hidden />
            </span>
          </span>
          <span className="text-[14px] leading-[22px] text-[#5c5748]">
            <span className="font-medium text-ink">I confirm this ID belongs to me</span> and that the information
            provided is accurate. I understand submitting false documents may result in a permanent ban.
          </span>
        </label>

        <div className="mt-[55px] flex flex-col-reverse items-center gap-[17px] border-t border-[#e4dcd1] pt-[19px] md:flex-row md:justify-between md:pt-4">
          <Link to="/" className="text-[14px] text-[#5c5748]">Save &amp; continue later</Link>
          <button type="submit" disabled={pending} className="h-[38px] rounded-md bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-70">
            Submit for verification
          </button>
        </div>
      </form>
    </div>
  )
}
