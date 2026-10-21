const steps = [
  ['01', 'Verify who you are', 'Create a profile and upload an ID and link one social account. Most members are verified within minutes, not days.'],
  ['02', 'Set your intent', "Tell us if you're marriage-minded, dating meaningfully, or want concierge matchmaking. It's locked for 90 days."],
  ['03', 'Get matched by AI', 'Our model weighs values, family expectations, and lifestyle — not just a photo and a bio.'],
  ['04', 'Meet with confidence', 'Message privately, with no screenshots and a visible trust score, before you ever meet in person.'],
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-[86px] bg-cream text-ink">
      <div className="mx-auto max-w-[1440px] px-4 pb-[35px] pt-[37px] md:px-8 md:pb-[69px] md:pt-[71px] xl:pb-[70px] xl:px-[120px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-[12px] text-gold">How it Works</p>
            <h2 className="mt-[5px] max-w-[420px] font-serif text-[40px] leading-[48px]">
              From sign-up to first conversation, here&apos;s what happens.
            </h2>
          </div>
          <p className="max-w-[270px] text-[14px] md:mr-[10px] md:mt-[50px] leading-[22px] text-[#5c5748]">
            No endless swiping — just four steps designed to get you to the right person faster.
          </p>
        </div>
        <div className="mt-[24px] md:mt-[25px]">
          <ol className="hidden gap-4 md:grid md:grid-cols-[repeat(4,241.7px)] md:gap-0 xl:grid-cols-[repeat(4,301.3px)]" aria-hidden>
            {steps.map(([n]) => (
              <li key={n} className="flex items-center pr-[13px] xl:pr-[50px]">
                <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full border border-[#e4dcd1] text-[13px]">{n}</span>
                <span className="hidden h-px flex-1 bg-[#e4dcd1] md:block" />
              </li>
            ))}
          </ol>
          <ol className="grid gap-4 md:mt-[15px] md:grid-cols-[180px_180px_180px_1fr] md:gap-x-20 md:gap-y-0 xl:grid-cols-[repeat(4,240px)] xl:gap-x-20">
            {steps.map(([n, t, d], i) => (
              <li key={n} className={i === 2 ? 'md:pt-[12px] xl:pt-[11px]' : i === 3 ? 'xl:pt-[11px]' : 'md:pt-px xl:pt-0'}>
                <span aria-hidden className="mb-[15px] flex size-[60px] items-center justify-center rounded-full border border-[#e4dcd1] font-serif text-[16px] font-semibold md:hidden">{n}</span>
                <h3 className={`font-serif text-[18px] font-semibold ${i === 3 ? 'md:pt-[2.25px] md:leading-[24.5px] xl:pt-0 xl:leading-normal' : ''}`}><span className="sr-only">Step {n}: </span>{t}</h3>
                <p className="mt-[3px] text-[14px] md:max-w-[245px] leading-[22px] text-[#5c5748]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
