const photos = [
  { src: 'rev-a', style: 'left-[1.5px] top-[92px] w-[270px] h-[240px]' },
  { src: 'rev-b', style: 'left-[272px] top-[155.5px] w-[294px] h-[289px]' },
  { src: 'rev-c', style: 'left-[916.5px] top-[227px] w-[230px] h-[220px]' },
  { src: 'rev-d', style: 'left-[1168px] top-[79.5px] w-[261px] h-[253px]' },
]

// tail: which bottom corner gets the small "speech bubble" radius
const cards = [
  { style: 'left-[126px] top-[1px] w-[269px]', tail: 'rounded-bl-[4px]' },
  { style: 'left-[479px] top-[82px] w-[269px]', tail: 'rounded-bl-[4px]' },
  { style: 'left-[900px] top-[54px] w-[359px]', tail: 'rounded-br-[4px]' },
  { style: 'left-[598px] top-[296px] w-[360px]', tail: 'rounded-br-[4px]' },
]

function Card({ className, tail }: { className: string; tail: string }) {
  return (
    <figure className={`rounded-[20px] bg-[#efe7d8] px-4 py-4 text-[14px] leading-[22px] text-[#5c5748] ${tail} ${className}`}>
      <blockquote>For members ready to build a life with someone. Deeper profile prompts,</blockquote>
      <figcaption className="mt-2 font-medium text-[#5c5748]">
        <div className="flex items-center justify-between">
          <span>Funmi O.</span>
          <span className="-mr-[2.65px] text-[16px] tracking-[3.65px] text-gold" aria-label="5 stars">★★★★★</span>
        </div>
        <div className="mt-1">Lagos, Nigeria · Marriage-minded</div>
      </figcaption>
    </figure>
  )
}

export function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-[86px] overflow-hidden bg-cream text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pb-[30px] pt-[36px] md:px-0 md:pb-[66.5px] md:pt-[70px]">
        <div className="flex flex-col justify-between gap-[15px] md:flex-row md:items-center md:px-8 xl:px-[120px]">
          <div>
            <p className="text-[12px] text-gold">Reviews</p>
            <h2 className="mt-1.5 md:-ml-px max-w-[440px] font-serif text-[40px] leading-[48px]">
              Trusted by people who found what they were looking for.
            </h2>
          </div>
          <p className="text-[14px] leading-[29px] text-[#5c5748] md:leading-normal">
            <span className="mr-[7px] font-serif text-[18px] font-semibold text-gold md:mr-1 md:text-[20px]">4.9</span>
            average member rating · 1,200+ verified reviews
          </p>
        </div>

        <div className="overflow-hidden md:overflow-visible">
          <div className="relative ml-px mt-[15px] h-[450px] md:mt-5 w-[1440px] md:ml-0 xl:mx-auto">
            {photos.map((p) => (
              <img key={p.src} src={`/images/${p.src}.jpg`} alt="" className={`absolute ${p.style}`} />
            ))}
            {cards.map((c) => (
              <Card key={c.style} className={`absolute ${c.style}`} tail={c.tail} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
