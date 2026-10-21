import { Check, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OnboardingHeader } from '../components/onboarding/OnboardingHeader'
import { firstName, useUser } from '../lib/session'

// Same faint diagonal lines and gold glow as the homepage hero (the lines are tablet and up; mobile has only a smaller glow).
const heroBackground = [
  'repeating-linear-gradient(114deg, transparent 0 35.5px, rgba(247,242,231,0.03) 35.5px 36.5px, transparent 36.5px 49.3px)',
  'radial-gradient(ellipse 480px 260px at 50% 0%, rgba(204,158,52,0.15), transparent 75%)',
].join(',')
const mobileGlow = 'radial-gradient(ellipse 200px 200px at 50% 0%, rgba(204,158,52,0.15), transparent 75%)'

const dots = [
  'left-[22.01%] top-[85px] size-1.5 bg-[#93772d]',
  'left-[63.96%] top-[66px] size-[5px] bg-cream/70',
  'left-[77.99%] top-[143px] size-[5px] bg-[#a18a50]',
  'left-[12.01%] top-[333px] size-[5px] bg-[#67501a]',
  'left-[85.97%] top-[323px] size-1.5 bg-[#93772d]',
]

const steps = [
  { title: 'We review your ID', body: 'A real reviewer checks your documents — this usually takes under 24 hours.' },
  { title: 'Your Trust Score is calculated', body: 'Based on your verification, profile completeness, and activity.' },
  { title: 'You become visible to members', body: 'Your profile starts appearing to people who match your intent and city.' },
  { title: 'Curated matches start arriving', body: "We'll notify you the moment your first matches are ready." },
]

function Pill({ children }: { children: string }) {
  return (
    <span className="mt-4 flex h-5 w-fit items-center gap-1.5 rounded-full bg-[#eadec2] px-2.5 text-[12px] leading-5 text-[#8a6a1f]">
      <span className="size-[5px] rounded-full bg-[#8a6a1f]" aria-hidden />
      {children}
    </span>
  )
}

function StatusCard({ icon, title, body, pill, className = '' }: { icon: string; title: string; body: string; pill: string; className?: string }) {
  return (
    <div className={`flex items-center gap-[18px] rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-[27px] py-[30px] ${className}`}>
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full border-[6px] border-cream font-serif text-[16px] font-semibold text-[#5c5748]">
        {icon === '—' ? <span className="h-px w-3 bg-[#5c5748]" aria-hidden /> : icon}
      </span>
      <div>
        <p className="text-[14px] font-medium leading-5 text-ink">{title}</p>
        <p className="text-[12px] md:max-w-[160px] leading-5 text-[#5c5748]">{body}</p>
        <Pill>{pill}</Pill>
      </div>
    </div>
  )
}

export function OnboardingComplete() {
  const name = firstName(useUser())
  return (
    <div className="min-h-screen bg-cream">
      <OnboardingHeader progress={false} action={{ label: 'Go to dashboard', mobileLabel: 'Save & exit', to: '/dashboard' }} />

      <section className="relative h-[476px] overflow-hidden bg-[#15120e] text-center">
        <div className="absolute inset-0 md:hidden" style={{ background: mobileGlow }} aria-hidden />
        <div className="absolute inset-0 hidden md:block" style={{ background: heroBackground }} aria-hidden />
        <div className="relative mx-auto h-full max-w-[1440px] px-4 pb-16 pt-[53px] md:px-6 md:pt-[84px]">
          {dots.map((d) => (
            <span key={d} className={`absolute hidden rounded-full md:block md:scale-x-[0.71] xl:scale-x-100 ${d}`} aria-hidden />
          ))}
          <span className="mx-auto flex size-[76px] items-center justify-center rounded-full bg-[linear-gradient(142deg,#e9ca78,#8e6e23)] text-ink">
            <Check size={26} strokeWidth={2} />
          </span>
          <p className="mt-[25px] flex items-center justify-center gap-2.5 text-[14px] font-medium leading-5 text-gold">
            <span className="size-1.5 rounded-full bg-gold" aria-hidden /> Profile complete
          </p>
          <h1 className="mt-[17px] font-serif text-[40px] leading-[48px] text-cream">
            You&apos;re all set, <span className="text-gold">{name}</span>.
          </h1>
          <p className="mx-auto mt-[17px] max-w-[470px] xl:max-w-[462px] text-[16px] leading-6 text-[#b7af9c]">
            Your photos, bio, and compatibility answers are saved. Your ID<br className="hidden md:inline xl:hidden" /> is being reviewed now — most members hear
            back within a few<br className="md:hidden" /> hours.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[666px] px-4 pb-[35px] pt-9 md:px-0 md:pb-[75px] md:pt-[70px] xl:-translate-x-[14.5px]">
        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard icon="ID" title="Identity verification" body="Submitted just now" pill="Under review" className="max-md:py-10" />
          <StatusCard icon="—" title="Trust Score" body="Calculated once your ID is approved" pill="Pending" />
        </div>

        <section className="mt-[25px] md:mt-6" aria-labelledby="next-title">
          <h2 id="next-title" className="font-serif text-[18px] font-semibold leading-6 text-ink">What happens next</h2>
          <p className="mt-1.5 text-[14px] leading-[22px] text-[#5c5748] md:mt-2 md:leading-5">A quick look at what&apos;s left before you start seeing matches.</p>
          <ol className="mt-[17px] space-y-[25px] md:mt-[19px]">
            {steps.map(({ title, body }, i) => (
              <li key={title} className="flex items-start gap-[18px]">
                <span
                  className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-[14px] ${
                    i === 0 ? 'bg-gold font-semibold text-ink' : 'border border-[#e4dcd1] bg-white font-semibold text-[#5c5748]'
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-[16px] font-medium leading-6 text-ink">{title}</p>
                  <p className="text-[14px] leading-[22px] text-[#5c5748]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-[25px]" aria-labelledby="preview-title">
          <h2 id="preview-title" className="font-serif text-[18px] font-semibold leading-6 text-ink">A preview of what&apos;s waiting</h2>
          <p className="mt-1.5 text-[14px] leading-[22px] text-[#5c5748] md:mt-2 md:leading-5">These unlock automatically the moment your verification is approved.</p>
          <div className="relative mt-4 md:mt-6">
            <div className="grid gap-4 blur-[3px] md:grid-cols-3 md:gap-[14px]" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[428px] rounded-lg md:h-[265px] bg-[linear-gradient(150deg,#bba779,#dec688)]" />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-[63px] text-center md:pb-2.5 md:pl-10">
              <span className="flex size-11 items-center justify-center rounded-full bg-ink text-gold">
                <Lock size={16} strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-[9px] font-serif text-[16px] font-semibold leading-6 text-ink">3 potential matches found nearby</p>
              <p className="mt-1 max-w-[250px] text-[14px] leading-[22px] text-[#5c5748]">
                They&apos;ll unlock as soon as your identity verification is approved.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col items-center">
          <Link to="/dashboard" className="flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink">
            Explore TrueConnect while you wait
          </Link>
          <nav className="mt-[17px] grid w-full grid-cols-[185px_1fr] gap-y-[18px] text-[14px] leading-5 text-[#5c5748] md:flex md:w-auto md:flex-wrap md:justify-center md:gap-[29px]" aria-label="More">
            <Link to="/onboarding/profile">Edit your profile</Link>
            <Link to="/invite">Invite a friend</Link>
            <Link to="/help">Visit the Help Center</Link>
          </nav>
        </div>
      </main>
    </div>
  )
}
