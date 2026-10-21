import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, CircleCheck, StickyNote } from 'lucide-react'

// `body` lines are joined with a space; on tablet the Figma frame breaks them onto separate lines.
// `offset` staggers the columns on tablet only.
const items = [
  { icon: ShieldCheck, title: 'ID verification', offset: '', body: ['Every member is checked before their', 'profile goes live — no exceptions, no', 'shortcuts.'] },
  { icon: Lock, title: 'Private by design', offset: 'md:mt-[22px]', body: ['No screenshots, no screen recording. What you share in conversation stays there.'] },
  { icon: CircleCheck, title: 'AI + human moderation', offset: 'md:mt-[12px]', body: ['Reports are reviewed by real people,', 'backed by automated checks around the clock.'] },
  { icon: StickyNote, title: 'Three-strike policy', offset: 'md:mt-[22px]', body: ['Members who break trust get three strikes, then a permanent ban. No second accounts.'] },
]

export function Safety() {
  return (
    <section id="safety" className="scroll-mt-[86px] border-t border-[#e4dcd1] bg-[#efe7d8] text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pb-[33px] pt-[37px] md:px-8 md:pb-[35px] md:pt-[86px] xl:pb-[71px] xl:px-[120px] xl:pt-[119px]">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[12px] text-gold">Your Safety</p>
            <h2 className="mt-[5px] md:-ml-px max-w-[460px] font-serif text-[40px] leading-[48px]">
              Safety isn&apos;t a feature<br /> here. It&apos;s the foundation.
            </h2>
          </div>
          <Link to="/safety" className="rounded-lg border border-[#e4dcd1] px-[18px] py-[9.5px] text-[14px] font-medium">
            Visit the Safety Center
          </Link>
        </div>
        <div className="mt-[25px] grid gap-[19px] md:mt-[26px] md:grid-cols-[repeat(4,224px)] md:gap-x-6 xl:grid-cols-4 xl:gap-x-[70px]">
          {items.map(({ icon: Icon, title, body, offset }) => (
            <article key={title} className={`${offset} xl:mt-0`}>
              <Icon size={24} className="text-[#8a6a1f]" strokeWidth={1.5} />
              <h3 className="mt-[19px] text-[14px] font-medium">{title}</h3>
              <p className="mt-[11px] text-[14px] leading-[22px] text-[#5c5748] md:mt-3">{body.map((line, i) => (
                  <Fragment key={line}>
                    {i > 0 && <><span className="xl:hidden"><br /></span><span className="hidden xl:inline"> </span></>}
                    {line}
                  </Fragment>
                ))}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
