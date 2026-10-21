import { Link } from 'react-router-dom'

const stats = [
  { value: '100%', label: 'ID-verified members', width: 'w-[119px] md:w-[214px] xl:w-[213px]', labelWidth: 'max-w-[75px]' },
  { value: '90 days', label: 'Intent locked per match cycle', width: 'w-[118px] md:w-[282px]', labelWidth: 'max-w-[100px] md:max-w-[150px]' },
  { value: '3 cities', label: 'Live matchmaking events', width: '', labelWidth: 'max-w-[105px] md:max-w-[125px]' },
]

// Warm gold glow top-right, red-brown glow bottom-left, faint diagonal lines — sampled from the Figma export.
const heroBackground = [
  'repeating-linear-gradient(114deg, transparent 0 48.3px, rgba(247,242,231,0.03) 48.3px 49.3px)',
  'radial-gradient(ellipse 720px 300px at 86% 0%, rgba(201,146,46,0.16), transparent 75%)',
  'radial-gradient(ellipse 480px 190px at 5% 100%, rgba(190,85,55,0.13), transparent 75%)',
  '#15120e',
].join(',')

export function Hero() {
  return (
    <section className="overflow-hidden" style={{ background: heroBackground }}>
      <div className="relative mx-auto max-w-[1440px] px-4 pb-[16px] pt-[17px] md:h-[631px] md:px-8 md:pb-0 md:pt-[71px] xl:px-[120px]">
        <div>
          <p className="text-[12px] text-gold">Verified Members Only</p>
          <h1 className="ml-px [font-variation-settings:'opsz'_56] md:ml-0 xl:[font-variation-settings:'opsz'_60] mt-[6px] max-w-[620px] font-serif text-[60px] leading-[68px] md:text-[64px] md:leading-[72px]">
            Real people. Real intent. <span className="text-gold">Connections built to last.</span>
          </h1>
          <p className="mt-[15.5px] max-w-[610px] text-[14px] leading-[22px] md:mt-[16px] xl:leading-[22.5px] text-[#b7af9c]">
            TrueConnect is the first verified, intent-based relationship platform for Africans worldwide —
            every profile checked, every intent locked, zero tolerance for fakes.
          </p>
          <div className="mt-[24px] flex items-center gap-4 text-[14px] md:mt-[24px] md:items-stretch xl:mt-[23px]">
            <Link to="/signup" className="rounded-md bg-gold px-4 h-[38px] md:h-auto flex items-center py-0 md:block md:py-[9.5px] xl:py-2.5 font-medium text-ink">Join TrueConnect</Link>
            <Link to="/#how-it-works" className="rounded-md border border-cream/60 px-4 h-[42px] md:h-auto flex items-center py-0 md:block md:py-[9.5px] md:px-5 xl:py-2.5">How verification works</Link>
          </div>
          <dl className="mt-[23px] xl:mt-[22px] flex max-w-[601px] border-t border-cream/30 pt-[25px] md:pt-6">
            {stats.map((s) => (
              <div key={s.value} className={`shrink-0 ${s.width}`}>
                <dt className="font-serif leading-[32px] text-[25px] xl:text-[26px]">{s.value}</dt>
                <dd className={`-mt-px md:mt-0 text-[12px] xl:text-[13px] leading-[20px] text-[#b7af9c] ${s.labelWidth}`}>{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 hidden md:mt-0 md:block">
          <img src="/images/hero-small.jpg" alt="" className="absolute left-[699px] top-[358px] xl:left-[900px] h-[230px] w-[200px] rounded-[20px] object-cover" />
          <img src="/images/hero-big.jpg" alt="" className="absolute left-[863px] top-[70.5px] xl:left-[1063px] h-[358px] w-[278px] rounded-[20px] object-cover" />
          <div className="absolute left-[689px] top-[201px] xl:left-[890px] flex h-10 items-center gap-2.5 rounded-lg bg-cream pl-[11px] pr-4 text-[14px] text-ink shadow-lg">
            <span className="size-[7px] rounded-full bg-[#4c7a5c]" /> Amara matched with Daniel
          </div>
        </div>
      </div>
    </section>
  )
}
