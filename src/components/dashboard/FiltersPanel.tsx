import {
  DEFAULT_FILTERS,
  ageLabel,
  distanceLabel,
  trustLabel,
  type Filters,
  type Intent,
  type ShowMe,
} from '../../lib/discover'

const showMe: ShowMe[] = ['Women', 'Men', 'Everyone']
const lookingFor: Intent[] = ['Marriage Minded', 'Meaningful Dating', 'Concierge']

function Pill({ active, children, className = '', onClick }: { active: boolean; children: string; className?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-[38px] rounded-full border text-[12px] ${
        active ? 'border-[#e4dcd1] bg-ink text-cream' : 'border-[#e4dcd1] bg-[#efe8d8] text-[#5c5748]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// Visual slider (position 0–1). The range input on top keeps it keyboard- and screen-reader-operable.
function Slider({ label, display, value, onChange }: { label: string; display: string; value: number; onChange: (v: number) => void }) {
  const pct = `${value * 100}%`
  return (
    <div className="border-b border-[#e4dcd1] pb-[16px] pt-[23px] first:pt-0">
      <div className="flex items-baseline justify-between">
        <label className="text-[14px] font-medium leading-5 text-ink">{label}</label>
        <span className="text-[12px] leading-5 text-gold">{display}</span>
      </div>
      <div className="relative mt-[1px] h-[14px]">
        <div className="absolute inset-x-0 top-[4px] h-[5px] rounded-full bg-cream" />
        <div className="absolute left-0 top-[4px] h-[5px] rounded-full bg-[#c9972e]" style={{ width: `min(100%, calc(${pct} + 10px))` }} />
        <span className="absolute top-0 size-[14px] -translate-x-1/2 rounded-full bg-[#fceed8]" style={{ left: pct }} aria-hidden>
          <span className="absolute inset-[2px] rounded-full bg-[#efe8d8]" />
          <span className="absolute inset-[4px] rounded-full bg-[#c9972e]" />
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(value * 100)}
          aria-label={label}
          aria-valuetext={display}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-[22px] w-11 shrink-0 rounded-full ${on ? 'bg-gold' : 'bg-[#e4dcd1]'}`}
    >
      <span className={`absolute top-[2px] size-[18px] rounded-full bg-cream transition-[left] ${on ? 'left-[24px]' : 'left-[2px]'}`} />
    </button>
  )
}

type Props = {
  filters: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onReset: () => void
}

export function FiltersPanel({ filters, onChange, onApply, onReset }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value })

  return (
    <aside className="w-full max-w-[375px] rounded-[16px] border border-[#e4dcd1] bg-white px-4 pb-[14px] pt-[14px] md:max-w-none md:px-[15px]" aria-label="Filters">
      <div className="flex items-center justify-between pb-[23px] pt-[1px]">
        <h2 className="font-serif text-[16px] font-semibold leading-6 text-ink">Filters</h2>
        <button type="button" onClick={onReset} className="text-[12px] text-gold">Reset</button>
      </div>
      <div className="border-t border-[#e4dcd1]" />

      <h3 className="mt-[23px] text-[14px] font-medium leading-6 text-ink">Show me</h3>
      <div className="mt-[15px] flex gap-x-[31.5px] md:grid md:grid-cols-[120.5px_1fr] md:gap-x-[14px] md:gap-y-[14px]">
        {showMe.map((o) => (
          <Pill key={o} active={filters.show === o} onClick={() => set('show', o)} className="w-[87.5px]">{o}</Pill>
        ))}
      </div>

      <h3 className="mt-[21px] text-[14px] font-medium leading-6 text-ink">Looking For</h3>
      <div className="mt-[15px] grid grid-cols-2 gap-x-[14px] gap-y-[14px] md:grid-cols-[120.5px_1fr]">
        {lookingFor.map((o) => (
          <Pill key={o} active={filters.looking === o} onClick={() => set('looking', o)} className="w-full">{o}</Pill>
        ))}
      </div>

      <div className="mt-[23px]">
        <Slider label="Age Range" display={ageLabel(filters.age)} value={filters.age} onChange={(v) => set('age', v)} />
        <Slider label="Distance" display={distanceLabel(filters.distance)} value={filters.distance} onChange={(v) => set('distance', v)} />
        <Slider label="Minimum Trust Score" display={trustLabel(filters.trust)} value={filters.trust} onChange={(v) => set('trust', v)} />
      </div>

      <div className="flex items-center justify-between border-b border-[#e4dcd1] py-[21px] md:pb-[36px] md:pt-[21px]">
        <span className="text-[14px] font-medium leading-6 text-ink">ID-verified only</span>
        <Toggle on={filters.verifiedOnly} onChange={(v) => set('verifiedOnly', v)} label="ID-verified only" />
      </div>
      <div className="flex items-center justify-between border-b border-[#e4dcd1] py-[21px] md:hidden">
        <span className="text-[14px] font-medium leading-6 text-ink">Active this week</span>
        <Toggle on={filters.activeThisWeek} onChange={(v) => set('activeThisWeek', v)} label="Active this week" />
      </div>

      <button type="button" onClick={onApply} className="mt-[24px] h-[38px] w-full rounded-lg bg-gold text-[14px] font-medium text-ink">
        Apply filters
      </button>
    </aside>
  )
}

export { DEFAULT_FILTERS }
