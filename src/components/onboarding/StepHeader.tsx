import { Link } from 'react-router-dom'

type Props = { step: number; total: number; label: string }

// Two-row onboarding header: brand row on top, "Step n of N" progress row beneath.
export function StepHeader({ step, total, label }: Props) {
  return (
    <header className="border-b border-[#e4dcd1] bg-ink">
      <div className="border-b border-[#393631]">
        <div className="mx-auto flex h-[85px] max-w-[1440px] items-center justify-between px-4 pb-0.5 md:px-[120px]">
          <Link to="/" className="-ml-px flex items-center gap-[5px] font-serif text-[24px] font-semibold text-[#b7af9c]">
            <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
            TrueConnect
          </Link>
          <Link to="/" className="text-[14px] text-[#b7af9c]">Save &amp; exit</Link>
        </div>
      </div>
      <div className="flex h-[46px] items-center justify-between px-4 md:justify-center md:px-6">
        <p className="text-[12px] text-[#b7af9c] md:w-[240px]">
          <span className="text-gold">Step {step} of {total}</span> — {label}
        </p>
        <div
          className="flex gap-2"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step}
          aria-label={`Step ${step} of ${total}: ${label}`}
        >
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-[3px] w-[29px] md:w-[203px] md:max-w-[26vw] ${i < step ? 'bg-gold' : 'bg-cream'}`} />
          ))}
        </div>
      </div>
    </header>
  )
}
