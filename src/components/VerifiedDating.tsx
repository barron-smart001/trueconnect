const paragraphs = [
  'TrueConnect was built for a simple reason: dating apps kept failing African singles, whether they were in Lagos, London, Toronto, or Accra. Fake profiles, mismatched intentions, and platforms that treated the diaspora as an afterthought made genuine connection harder than it needed to be. TrueConnect changes that by putting verification and intent at the center of every match.',
  "Every member completes ID verification before their profile goes live, and can link LinkedIn, Instagram, or Facebook for extra credibility. Behind the scenes, a Trust Score from 0 to 100 reflects how authentic and active a member is — higher scores unlock better visibility and premium features. Members also declare their intent up front, whether that's marriage, meaningful dating, or something more discreet, and that intent stays locked for 90 days so matches are never mismatched.",
  'Conversations stay private by design: no screenshots, no screen recording, with AI and human moderation working together and a strict three-strike policy for anyone who breaks trust. From matchmaking events in major cities to a concierge service for members who need absolute privacy, TrueConnect is built around one idea — real people, showing up with real intent.',
]

export function VerifiedDating() {
  return (
    <section id="about" className="scroll-mt-[86px] bg-cream text-ink">
      <div className="mx-auto grid max-w-[1440px] items-start gap-[23px] px-4 pb-0 md:grid-cols-[480px_1fr] md:gap-[23px] md:px-8 md:pb-0 xl:gap-[175px] xl:px-[120px]">
        <figure className="relative md:mt-[1px] xl:mt-0 h-[619px] overflow-hidden rounded-lg bg-ink">
          <img src="/images/verified-mobile.jpg" alt="" className="absolute inset-0 size-full object-cover md:hidden" />
          <img src="/images/verified.jpg" alt="" className="absolute inset-0 hidden size-full object-cover md:block" />
          <figcaption className="absolute inset-x-6 bottom-6 md:inset-x-12 border-t border-cream/45 pt-[6px] md:border-cream/60 md:pt-1 text-[12px] leading-5 md:leading-[18px] xl:text-[11px] text-cream">
            Verification in progress — ID check, social link, trust score assignment
          </figcaption>
        </figure>
        <div className="mr-px max-w-[500px] md:mr-[2px] xl:mr-0 md:mt-[-2px] xl:mt-0 xl:pt-[7px]">
          <h2 className="max-w-[440px] font-serif text-[40px] leading-[48px]">Verified dating for Africans, wherever you are.</h2>
          <div className="mt-4 space-y-6 text-[14px] leading-[22px] text-[#5c5748]">
            {paragraphs.map((p, i) => <p key={p.slice(0, 20)} className={i === 2 ? 'mr-[2px] md:mr-0' : undefined}>{p}</p>)}
          </div>
        </div>
      </div>
    </section>
  )
}
