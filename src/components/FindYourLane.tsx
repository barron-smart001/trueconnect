import { Link } from 'react-router-dom'
import { Clock, Heart, PanelsTopLeft } from 'lucide-react'

const lanes = [
  {
    icon: Heart,
    size: 20,
    title: 'Marriage-minded',
    body: 'For members ready to build a life with someone. Deeper profile prompts, family-oriented filters, and matches who are just as ready as you are.',
    cta: 'Explore marriage-minded',
  },
  {
    icon: Clock,
    size: 16,
    title: 'Meaningful Dating',
    body: 'No pressure, no games — just thoughtful people who show up as themselves. Built for real conversation before the first date.',
    cta: 'Explore meaningful dating',
  },
  {
    icon: PanelsTopLeft,
    size: 16,
    title: 'Concierge & discreet',
    body: 'Private matchmaking for executives and public figures. A dedicated matchmaker handles everything — you never appear on the open platform.',
    cta: 'Enquire about concierge',
  },
]

export function FindYourLane() {
  return (
    <section id="find-your-lane" className="scroll-mt-[86px] bg-cream text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pb-[49px] pt-[36px] md:px-8 md:pb-[86px] md:pt-[71px] xl:pb-[84px] xl:px-[120px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-[12px] text-gold">Your People Are Here</p>
            <h2 className="mt-1.5 max-w-[480px] font-serif text-[40px] leading-[48px]">
              Find your lane, then<br />match with people who share it.
            </h2>
          </div>
          <p className="max-w-[300px] text-[14px] md:mt-[50px] leading-[22px] text-[#5c5748]">
            Your intent is locked for 90 days, so you&apos;re only ever shown people looking for the same thing you are.
          </p>
        </div>
        <div className="mt-[40px] grid gap-[47px] md:mt-[38px] md:grid-cols-3 md:gap-0">
          {lanes.map(({ icon: Icon, size, title, body, cta }, i) => (
            <article key={title} className={`${i === 1 ? 'max-w-[302px] md:max-w-[306px] md:mt-[11px] xl:max-w-[297px]' : `${i === 0 ? 'max-w-[295px]' : 'max-w-[296px]'} md:max-w-[306px] xl:max-w-[277px]`} pl-4`}>
              <span className="flex size-[46px] items-center justify-center rounded-full border border-[#e4dcd1] text-[#8a6a1f]">
                <Icon size={size} strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 font-serif text-[18px] font-semibold">{title}</h3>
              <p className="mt-3.5 text-[14px] leading-[22px] text-[#5c5748]">{body}</p>
              <Link to="/signup" className="mt-[17.5px] inline-block md:mt-[16.5px] text-[14px] text-gold">{cta}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
