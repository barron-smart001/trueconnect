import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

type Section = { heading: string; body: string[] }
type Page = { eyebrow: string; title: string; intro: string; sections: Section[]; cta?: { label: string; to: string } }

const LAST_UPDATED = 'November 2026'

const infoPages: Record<string, Page> = {
  '/membership': {
    eyebrow: 'Membership',
    title: 'Membership',
    intro: 'TrueConnect is for people who want real relationships with real, verified people.',
    sections: [
      { heading: 'Verified members only', body: ['Every member confirms their identity before they can match or message. That keeps the community authentic and accountable.'] },
      { heading: 'What you get', body: ['Personalised matches based on your profile and the questions you answer, private messaging with people you have matched with, and safety tools to block and report at any time.'] },
      { heading: 'Getting started', body: ['Create an account, complete your profile, and verify your identity. Verification usually takes a few minutes.'] },
    ],
    cta: { label: 'Create your account', to: '/signup' },
  },
  '/about': {
    eyebrow: 'About',
    title: 'About TrueConnect',
    intro: 'We believe meeting someone new should feel safe, honest and human.',
    sections: [
      { heading: 'Why we exist', body: ['Too many dating spaces are full of fake profiles and low-effort interactions. TrueConnect puts identity verification and thoughtful matching first.'] },
      { heading: 'How we work', body: ['We ask members to verify who they are, we match on what people actually care about, and we give everyone clear tools to stay in control of their experience.'] },
    ],
    cta: { label: 'Get in touch', to: '/contact' },
  },
  '/careers': {
    eyebrow: 'Careers',
    title: 'Careers',
    intro: 'We are a small team building a safer way to meet people.',
    sections: [
      { heading: 'Open roles', body: ['We have no open roles listed right now. If you would like to work with us in the future, send us a note and tell us what you do best.'] },
    ],
    cta: { label: 'Contact us', to: '/contact' },
  },
  '/press': {
    eyebrow: 'Press',
    title: 'Press',
    intro: 'Writing about TrueConnect? We are happy to help.',
    sections: [
      { heading: 'Media enquiries', body: ['Use the contact form and choose the Press topic. Include your outlet, deadline and what you need, and we will reply as soon as we can.'] },
    ],
    cta: { label: 'Contact press team', to: '/contact' },
  },
  '/safety': {
    eyebrow: 'Safety',
    title: 'Safety Center',
    intro: 'Your safety comes first, on the app and when you meet in person.',
    sections: [
      { heading: 'On TrueConnect', body: ['Members verify their identity. You can block or report anyone from a conversation or profile. Blocked members cannot see or contact you.'] },
      { heading: 'Before you meet', body: ['Chat on the app first and keep personal details such as your address and workplace private until you trust someone. Tell a friend where you are going and who you are meeting.'] },
      { heading: 'When you meet', body: ['Meet in a public place, arrange your own transport, and leave if you feel uncomfortable. Trust your instincts.'] },
      { heading: 'Report a concern', body: ['If someone breaks our guidelines or you feel unsafe, report them in the app or contact us using the Safety concern topic. In an emergency, contact your local emergency services first.'] },
    ],
    cta: { label: 'Report a safety concern', to: '/contact' },
  },
  '/help': {
    eyebrow: 'Help',
    title: 'Help Center',
    intro: 'Answers to common questions.',
    sections: [
      { heading: 'I cannot sign in', body: ['Use "Forgot password" on the sign-in page to reset your password. Check your spam folder if the email does not arrive.'] },
      { heading: 'How does verification work?', body: ['After onboarding you confirm your identity with a government ID and a quick selfie through our verification partner. You will be notified when it is approved.'] },
      { heading: 'How do matches work?', body: ['When you and another member both like each other, you become a match and can message.'] },
      { heading: 'How do I delete my account?', body: ['Open your profile and choose delete account. This permanently removes your data.'] },
      { heading: 'Still stuck?', body: ['Contact us and choose Account or technical support.'] },
    ],
    cta: { label: 'Contact support', to: '/contact' },
  },
  '/guidelines': {
    eyebrow: 'Community',
    title: 'Community Guidelines',
    intro: 'These rules keep TrueConnect respectful and safe.',
    sections: [
      { heading: 'Be yourself', body: ['Use your real identity, your own photos and honest information. No impersonation or fake profiles.'] },
      { heading: 'Be respectful', body: ['No harassment, hate speech, threats, or unwanted sexual content. Accept a no.'] },
      { heading: 'Be safe', body: ['Do not share other people\'s private information, ask for money, or promote scams or commercial services.'] },
      { heading: 'Consequences', body: ['We may warn, suspend or permanently remove members who break these rules.'] },
    ],
  },
  '/privacy': {
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    intro: `Last updated ${LAST_UPDATED}.`,
    sections: [
      { heading: 'What we collect', body: ['Account details such as your email, the profile information and photos you provide, your answers to onboarding questions, your messages, and the result of identity verification.'] },
      { heading: 'How we use it', body: ['To run the service, suggest matches, keep members safe, prevent fraud, and communicate with you about your account.'] },
      { heading: 'Identity verification', body: ['Verification is handled by a third-party provider. We receive the outcome of the check, not a copy of your ID document.'] },
      { heading: 'Sharing', body: ['Other members see only what you choose to show on your profile. We do not sell your personal information. We share data with service providers who help us operate the service, and when the law requires it.'] },
      { heading: 'Your choices', body: ['You can edit your profile, and you can delete your account at any time, which removes your personal data.'] },
      { heading: 'Contact', body: ['Questions about privacy? Use the contact form.'] },
    ],
    cta: { label: 'Contact us', to: '/contact' },
  },
  '/terms': {
    eyebrow: 'Legal',
    title: 'Terms of Service',
    intro: `Last updated ${LAST_UPDATED}.`,
    sections: [
      { heading: 'Eligibility', body: ['You must be at least 18 and legally able to use the service. You agree to give accurate information and to complete identity verification.'] },
      { heading: 'Your account', body: ['You are responsible for keeping your login secure and for activity on your account.'] },
      { heading: 'Acceptable use', body: ['You agree to follow our Community Guidelines. We may suspend or remove accounts that break them.'] },
      { heading: 'Content', body: ['You own the content you post and give us permission to display it to other members in order to run the service.'] },
      { heading: 'Disclaimer', body: ['We cannot guarantee any match or outcome, and we are not responsible for the conduct of members. Use your own judgement when meeting people.'] },
      { heading: 'Ending your account', body: ['You can delete your account at any time from your profile.'] },
    ],
  },
  '/cookies': {
    eyebrow: 'Legal',
    title: 'Cookie Policy',
    intro: `Last updated ${LAST_UPDATED}.`,
    sections: [
      { heading: 'What we use', body: ['We use only the browser storage needed to keep you signed in and to remember your progress. We do not use advertising cookies.'] },
      { heading: 'Controlling it', body: ['You can clear site data in your browser at any time. This will sign you out.'] },
    ],
  },
  '/ambassador': {
    eyebrow: 'Community',
    title: 'Ambassador program',
    intro: 'Help us grow a trustworthy community.',
    sections: [
      { heading: 'What it is', body: ['Ambassadors are members who share TrueConnect with people they know and help set the tone of the community.'] },
      { heading: 'Interested?', body: ['Tell us about yourself using the contact form and choose Partnerships.'] },
    ],
    cta: { label: 'Get in touch', to: '/contact' },
  },
  '/invite': {
    eyebrow: 'Invite',
    title: 'Invite a friend',
    intro: 'Know someone who wants something real? Share TrueConnect with them.',
    sections: [
      { heading: 'How to invite', body: ['Send your friend the link to our site. They can create an account, complete their profile and verify their identity in a few minutes.'] },
    ],
    cta: { label: 'Create an account', to: '/signup' },
  },
}

export function InfoPage({ path }: { path: string }) {
  const page = infoPages[path]

  useEffect(() => {
    if (page) document.title = `${page.title} · TrueConnect`
  }, [page])

  if (!page) return null

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-ink"><Header /></div>
      <main className="mx-auto w-full max-w-[720px] px-6 py-[72px]">
        <p className="text-[12px] text-gold">{page.eyebrow}</p>
        <h1 className="mt-[6px] font-serif text-[40px] leading-[48px] text-ink">{page.title}</h1>
        <p className="mt-4 text-[16px] leading-6 text-[#5c5748]">{page.intro}</p>
        {page.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-serif text-[24px] leading-8 text-ink">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-[16px] leading-6 text-[#5c5748]">{paragraph}</p>
            ))}
          </section>
        ))}
        {page.cta && (
          <Link to={page.cta.to} className="mt-10 inline-flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink">
            {page.cta.label}
          </Link>
        )}
      </main>
      <Footer />
    </div>
  )
}
