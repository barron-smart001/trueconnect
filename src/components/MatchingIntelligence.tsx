import { Check } from 'lucide-react'

const points = [
  'Weighs family and communal expectations, not just individual swipe patterns',
  'Reads faith, language, and cultural background alongside lifestyle fit',
  'Learns from real outcomes across Lagos, London, Toronto, and Accra',
  'Flags mismatched intent before a conversation ever starts',
]

const insights = [
  ['Cultural alignment', 92],
  ['Family & faith', 88],
  ['Communication style', 95],
  ['Long-term intent', 97],
] as const

export function MatchingIntelligence() {
  return (
    <section id="matching-intelligence" className="scroll-mt-[86px] bg-ink">
      <div className="mx-auto max-w-[1440px] px-4 pb-[59px] pt-[36px] md:px-8 md:pb-[34px] md:pt-[35.5px] xl:px-[120px] xl:pb-[69px] xl:pt-[70.5px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-[12px] text-gold">Matching Intelligence</p>
            <h2 className="mt-1.5 max-w-[420px] md:-ml-0.5 font-serif text-[40px] leading-[48px]">
              AI that understand African love.
            </h2>
          </div>
          <p className="text-[14px] md:max-w-[320px] md:mr-[3px] md:mt-[27px] leading-[22px] text-[#b7af9c]">
            Built specifically for African relationships. Our AI learns from cultural nuances, family dynamics,
            and values unique to the African diaspora.
          </p>
        </div>

        <div className="mt-[24px] grid grid-cols-[minmax(0,1fr)] gap-[40px] md:mt-[64.5px] md:grid-cols-2 md:items-start md:gap-12">
          <ul className="w-[calc(100%+9px)] space-y-[19px] md:w-auto md:max-w-[350px] xl:max-w-[345px]">
            {points.map((p) => (
              <li key={p} className="flex gap-[14px] text-[14px] md:gap-3 leading-[22.5px] text-[#b7af9c]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#8a6a1f] text-[#ddbe6d]">
                  <Check size={10} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mx-6 md:mx-0 md:-mt-[15.5px] xl:-mt-[16.5px] md:ml-auto md:mr-[25px] md:w-full md:max-w-[402px] xl:mr-[26px] xl:max-w-[486px]">
            <div className="flex items-center justify-between">
              <h3 className="-mt-[3px] font-serif text-[16px] font-semibold md:mt-0">Match insight</h3>
              <span className="flex items-center gap-1.5 rounded-full border border-cream px-3 py-[6.5px] text-[11px] text-gold">
                <span className="size-1.5 rounded-full bg-gold" /> Live
              </span>
            </div>
            <div className="mt-[19px] space-y-[19px]">
              {insights.map(([label, pct]) => (
                <div key={label}>
                  <div className="flex justify-between text-[14px] leading-4">
                    <span className="text-[#b7af9c]">{label}</span>
                    <span className="text-cream">{pct}%</span>
                  </div>
                  <div className="mt-2 h-[6px] rounded-full bg-cream">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8b6b1f,#c9a239)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
