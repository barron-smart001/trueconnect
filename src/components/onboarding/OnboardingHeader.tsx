import { Link } from 'react-router-dom'

// Three progress segments: step 1 done, step 2 in progress, step 3 not started.
const segments = [100, 44, 0]

type Props = {
  /** Show the three-segment progress bar in the middle (setup checklist). */
  progress?: boolean
  /** Link on the right; defaults to "Save & exit". */
  action?: { label: string; to: string; mobileLabel?: string }
}

export function OnboardingHeader({ progress = true, action = { label: 'Save & exit', to: '/' } }: Props) {
  return (
    <header className="border-b border-[#393631] bg-ink">
      <div className="mx-auto flex h-[85px] max-w-[1440px] items-center justify-between px-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8 xl:px-[120px]">
        <Link to="/" className="relative -top-px -ml-px flex w-fit items-center gap-[5px] font-serif text-[24px] font-semibold text-[#b7af9c]">
          <img src="/images/logo-icon.png" alt="" className="h-[33px] w-[45px]" />
          TrueConnect
        </Link>
        {progress ? (
          <div className="hidden gap-[9.5px] md:flex md:translate-x-[65px]" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={2}>
            {segments.map((fill, i) => (
              <span key={i} className="relative h-[3px] w-[87px] overflow-hidden bg-cream">
                <span className="absolute inset-y-0 left-0 bg-gold" style={{ width: `${fill}%` }} />
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <Link to={action.to} className="mr-px justify-self-end text-[14px] text-[#b7af9c]">
          {action.mobileLabel ? (
            <>
              <span className="md:hidden">{action.mobileLabel}</span>
              <span className="hidden md:inline">{action.label}</span>
            </>
          ) : (
            action.label
          )}
        </Link>
      </div>
    </header>
  )
}
