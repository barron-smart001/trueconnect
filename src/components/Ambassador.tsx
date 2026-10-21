import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Ambassador() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1440px] px-4 pb-[35px] pt-[36px] md:px-0 md:py-[69px]">
        <div className="relative mx-auto flex h-[448px] max-w-[836px] flex-col items-center justify-center overflow-hidden rounded-xl bg-[#efe7d8] px-4 pt-[2px] text-center md:h-[450px] md:px-6 md:pt-0">
          <img src="/images/coin-r-mobile.jpg" alt="" className="absolute right-0 top-[53px] w-[76px] md:hidden" />
          <img src="/images/coin-bl-mobile.jpg" alt="" className="absolute bottom-0 left-[44px] w-[145px] md:hidden" />
          <img src="/images/coin-top.jpg" alt="" className="absolute left-[428px] top-0 hidden w-[111px] md:block" />
          <img src="/images/coin-tr.jpg" alt="" className="absolute right-0 top-0 hidden w-[153px] md:block" />
          <img src="/images/coin-bl.jpg" alt="" className="absolute bottom-0 left-[123px] hidden w-[139px] md:block" />
          <img src="/images/coin-r-tablet.jpg" alt="" className="absolute bottom-0 right-0 hidden w-[149px] md:block xl:hidden" />
          <img src="/images/coin-r.jpg" alt="" className="absolute bottom-0 right-0 hidden w-[144px] xl:block" />

          <p className="relative text-[12px] text-gold">Be Proud</p>
          <h2 className="relative mt-px self-start text-left font-serif text-[40px] md:self-center md:text-center leading-[1.2] text-ink">
            Become a TrueConnect Ambassador
          </h2>
          <p className="relative mt-4 max-w-[680px] text-[14px] leading-[22px] text-[#5c5748]">
            Join our exclusive ambassador program to help build a community built on genuine intentions.
            <br className="hidden md:block" /> Earn rewards, gain early access, and shape the future of connection.
          </p>
          <Link to="/ambassador" className="relative mt-6 inline-flex items-center gap-2.5 rounded-lg bg-gold px-[19px] py-[8.5px] text-[14px] font-medium text-ink">
            Learn More <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
