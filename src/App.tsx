import { Route, Routes } from 'react-router-dom'
import { RouteEffects } from './components/RouteEffects'
import { Dashboard } from './pages/Dashboard'
import { ForgotPassword } from './pages/ForgotPassword'
import { Home } from './pages/Home'
import { Onboarding } from './pages/Onboarding'
import { OnboardingComplete } from './pages/OnboardingComplete'
import { OnboardingIdentity } from './pages/OnboardingIdentity'
import { OnboardingProfile } from './pages/OnboardingProfile'
import { OnboardingQuestions } from './pages/OnboardingQuestions'
import { ComingSoon, NotFound } from './pages/Placeholder'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { UpdatePassword } from './pages/UpdatePassword'

// Pages that are linked from the UI but not designed yet (see pages/Placeholder.tsx).
const marketing: [string, string][] = [
  ['/membership', 'Membership'],
  ['/about', 'About TrueConnect'],
  ['/careers', 'Careers'],
  ['/press', 'Press'],
  ['/contact', 'Contact'],
  ['/safety', 'Safety Center'],
  ['/help', 'Help Center'],
  ['/guidelines', 'Community Guidelines'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms of Service'],
  ['/cookies', 'Cookie Policy'],
  ['/ambassador', 'Ambassador program'],
  ['/invite', 'Invite a friend'],
]

const app: [string, string][] = [
  ['/discover', 'Discover'],
  ['/matches', 'Matches'],
  ['/messages', 'Messages'],
  ['/profile', 'Profile'],
]

function App() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/profile" element={<OnboardingProfile />} />
        <Route path="/onboarding/questions" element={<OnboardingQuestions />} />
        <Route path="/onboarding/identity" element={<OnboardingIdentity />} />
        <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        {marketing.map(([path, title]) => (
          <Route key={path} path={path} element={<ComingSoon title={title} />} />
        ))}
        {app.map(([path, title]) => (
          <Route key={path} path={path} element={<ComingSoon title={title} app />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
