import { Link } from 'react-router-dom'

const intents = [
  ['Marriage-minded', 'Looking to build a life together'],
  ['Meaningful-dating', 'Thoughtful, no pressure'],
  ['Concierge & discreet', 'Private Matchmaking'],
]
const cities = ['Lagos', 'London', 'Toronto', 'Accra']

/**
 * Tablet version of the dark "AI that understands African love" section (540 × 308).
 * Built to the Figma frame; not used yet — it will go in the tablet layout of the homepage.
 */
export function IntentPanel() {
  return (
    <div
      className="relative h-[308px] w-[540px] rounded-xl border border-[#49443f] bg-ink text-left shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute left-6 top-[38px]">
        <p className="text-[14px] font-medium leading-5 text-gold">By Intent</p>
      </div>
      <ul className="absolute left-6 top-[81px] space-y-[17.5px]">
        {intents.map(([title, sub]) => (
          <li key={title}>
            <Link to="/#find-your-lane" className="block">
              <span className="block text-[16px] leading-6 text-[#5c5748]">{title}</span>
              <span className="mt-[8.5px] block text-[12px] leading-[18px] text-[#5c5748]">{sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="absolute left-[219px] top-11 text-[14px] font-medium leading-5 text-gold">Cities &amp; events</p>
      <ul className="absolute left-[220px] top-[87px] space-y-6">
        {cities.map((city) => (
          <li key={city}>
            <Link to="/#reviews" className="block text-[16px] leading-6 text-[#5c5748]">{city}</Link>
          </li>
        ))}
      </ul>

      <div
        className="absolute left-[351px] top-[23px] h-[260px] w-[164px] rounded-xl border border-[#2e2c26]"
        style={{ background: 'radial-gradient(ellipse 260px 120px at 100% 0%, rgba(201,146,46,0.14), transparent 100%)' }}
      >
        <p className="absolute left-[15px] top-4 text-[14px] font-medium leading-5 text-gold">Trust Score</p>
        <p className="absolute left-[15px] top-[41px] w-[132px] font-serif text-[18px] font-semibold leading-6 text-cream">
          Every profile, verified
        </p>
        <p className="absolute left-[15px] top-[105px] w-[134px] text-[13px] leading-5 text-[#5c5748]">
          ID checks, linked socials, and a 0–100 trust score decide who gets seen — not just who swipes fastest.
        </p>
        <Link to="/#how-it-works" className="absolute left-[15px] top-[221px] text-[16px] font-medium leading-6 text-gold">
          See how it works
        </Link>
      </div>
    </div>
  )
}

/** Mobile version of the panel (345 × 305): shown when "Discover" is expanded in the small-screen menu. */
export function IntentPanelMobile() {
  return (
    <div className="relative h-[305px] w-[345px] max-w-full rounded-xl border border-[#6c6a67] bg-ink text-left">
      <p className="absolute left-[17px] top-[16px] text-[14px] leading-5 text-gold">By Intent</p>
      <ul>
        {intents.map(([title, sub], i) => (
          <li key={title} className="absolute left-[17px]" style={{ top: [59, 127, 195][i] }}>
            <Link to="/#find-your-lane" className="block">
              <span className="block text-[16px] leading-6 text-cream">{title}</span>
              <span className="mt-[8px] block text-[12px] leading-[18px] text-[#5c5748]">{sub}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/#reviews" className="absolute left-[17px] top-[269px] text-[14px] leading-5 text-gold">
        Cities &amp; events
      </Link>
    </div>
  )
}
