import { Ambassador } from '../components/Ambassador'
import { FindYourLane } from '../components/FindYourLane'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { MatchingIntelligence } from '../components/MatchingIntelligence'
import { Reviews } from '../components/Reviews'
import { Safety } from '../components/Safety'
import { VerifiedDating } from '../components/VerifiedDating'

export function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <MatchingIntelligence />
        <FindYourLane />
        <VerifiedDating />
        <Reviews />
        <Safety />
        <Ambassador />
      </main>
      <Footer />
    </>
  )
}
