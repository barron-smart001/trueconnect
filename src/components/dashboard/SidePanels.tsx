import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Toggle } from './FiltersPanel'
import { ageLabel, distanceLabel, intentLabel, type Filters } from '../../lib/discover'

const card = 'rounded-[16px] border border-[#e4dcd1] bg-white px-[23px] py-[22px]'

export function IntroductionsCard({ used, total, hoursLeft }: { used: number; total: number; hoursLeft: number }) {
  return (
    <section className={card} aria-label="Today's introductions">
      <h2 className="font-serif text-[16px] font-semibold leading-[22px] text-ink">Today&apos;s introductions</h2>
      <p className="mt-[1px] text-[12px] leading-5 text-[#5c5748]">Quality over quantity — no endless feed</p>
      <div className="mt-[10px] h-2 rounded-full bg-[#eee5d2]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#8b6b1f,#c9a239)]"
          style={{ width: `${(used / total) * 100}%` }}
          role="progressbar"
          aria-label="Introductions used today"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className="mt-[10px] flex justify-between text-[12px] leading-5">
        <span className="text-[#5c5748]">{used} of {total} used</span>
        <span className="font-medium text-ink">Resets in {hoursLeft}h</span>
      </div>
    </section>
  )
}

export function QuickPreferences({ filters, onVerifiedChange }: { filters: Filters; onVerifiedChange: (v: boolean) => void }) {
  const prefs = [
    ['Looking for', intentLabel(filters.looking)],
    ['Age range', ageLabel(filters.age)],
    ['Distance', distanceLabel(filters.distance)],
  ]
  return (
    <section className={`${card} pb-[15px] pt-[18px] md:pb-[11px]`} aria-label="Quick preferences">
      <h2 className="font-serif text-[16px] font-semibold leading-[22px] text-ink">Quick preferences</h2>
      <p className="mt-[1px] text-[12px] leading-5 text-[#5c5748]">Fine-tune who shows up here</p>
      <dl className="mt-[13px]">
        {prefs.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-[#e4dcd1] py-2 text-[12px]">
            <dt className="text-[14px] leading-[22px] text-ink">{k}</dt>
            <dd className="text-[#5c5748]">{v}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between pt-[13px] md:pt-[16px]">
          <dt className="text-[14px] text-ink">Verified only</dt>
          <dd><Toggle on={filters.verifiedOnly} onChange={onVerifiedChange} label="Verified only" /></dd>
        </div>
      </dl>
    </section>
  )
}

export function SafetyNote() {
  return (
    <section className="flex gap-3 rounded-[16px] border border-[#e4dcd1] bg-white pb-[22px] pl-[26px] pr-[26px] pt-[20px] md:pl-[18px] md:pr-[17px]" aria-label="Safety">
      <Shield size={16} strokeWidth={1.5} className="mt-[3px] shrink-0 text-[#8a6a1f]" />
      <p className="text-[14px] leading-[22px] text-[#5c5748]">
        Feeling unsure about someone? You can report or block a profile at any time.{' '}
        <Link to="/safety" className="font-medium text-[#8a6a1f] md:block">Visit Safety Center</Link>
      </p>
    </section>
  )
}
