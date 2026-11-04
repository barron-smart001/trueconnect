import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { RouteEffects } from './components/RouteEffects'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'

// Everything except the homepage and the two entry forms is split into its own chunk.
const AuthCallback = lazy(() => import('./pages/AuthCallback').then((m) => ({ default: m.AuthCallback })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const UpdatePassword = lazy(() => import('./pages/UpdatePassword').then((m) => ({ default: m.UpdatePassword })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Matches = lazy(() => import('./pages/Matches').then((m) => ({ default: m.Matches })))
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })))
const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })))
const OnboardingProfile = lazy(() => import('./pages/OnboardingProfile').then((m) => ({ default: m.OnboardingProfile })))
const OnboardingQuestions = lazy(() => import('./pages/OnboardingQuestions').then((m) => ({ default: m.OnboardingQuestions })))
const OnboardingIdentity = lazy(() => import('./pages/OnboardingIdentity').then((m) => ({ default: m.OnboardingIdentity })))
const OnboardingComplete = lazy(() => import('./pages/OnboardingComplete').then((m) => ({ default: m.OnboardingComplete })))
const ComingSoon = lazy(() => import('./pages/Placeholder').then((m) => ({ default: m.ComingSoon })))
const NotFound = lazy(() => import('./pages/Placeholder').then((m) => ({ default: m.NotFound })))

// Pages that are linked from the UI but not designed yet (see pages/Placeholder.tsx).
const marketing: [string, string][] = [
  ['/membership', 'Membership'],
  ['/about', 'About TrueConnect'],
  ['/careers', 'Careers'],
  ['/press', 'Press'],
  ['/safety', 'Safety Center'],
  ['/help', 'Help Center'],
  ['/guidelines', 'Community Guidelines'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms of Service'],
  ['/cookies', 'Cookie Policy'],
  ['/ambassador', 'Ambassador program'],
  ['/invite', 'Invite a friend'],
]

// Signed-in pages. The database enforces access with row-level security; this guard only improves the experience.
function guarded(element: ReactNode) {
  return <RequireAuth>{element}</RequireAuth>
}

function App() {
  return (
    <>
      <RouteEffects />
      <Suspense fallback={<div className="min-h-screen bg-cream" role="status" aria-label="Loading" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={guarded(<Dashboard />)} />
          <Route path="/discover" element={guarded(<Dashboard />)} />
          <Route path="/matches" element={guarded(<Matches />)} />
          <Route path="/messages" element={guarded(<Messages />)} />
          <Route path="/messages/:matchId" element={guarded(<Messages />)} />
          <Route path="/profile" element={guarded(<Profile />)} />
          <Route path="/onboarding" element={guarded(<Onboarding />)} />
          <Route path="/onboarding/profile" element={guarded(<OnboardingProfile />)} />
          <Route path="/onboarding/questions" element={guarded(<OnboardingQuestions />)} />
          <Route path="/onboarding/identity" element={guarded(<OnboardingIdentity />)} />
          <Route path="/onboarding/complete" element={guarded(<OnboardingComplete />)} />
          {marketing.map(([path, title]) => (
            <Route key={path} path={path} element={<ComingSoon title={title} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
