# TrueConnect — frontend

Web frontend for TrueConnect, a verified, intent-based relationship platform for Africans worldwide.
This repo contains the TrueConnect frontend and Supabase migrations/Edge Functions. Authentication, newsletter
subscriptions, onboarding profile data, Persona identity-verification status, and dashboard discovery use Supabase.

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, lucide-react icons
- **Scope built so far:** desktop (1440px) for the homepage, auth pages and onboarding; the **tablet homepage, auth pages, onboarding and dashboard** (designed at 1024px); the **mobile homepage, menu, auth pages, onboarding and dashboard** (designed at 375px). Breakpoints: base = mobile, `md:` (768px) = tablet, `xl:` (1280px) = desktop.
- **Design source:** the Figma file "Trueconnect". Screens were matched to the design by measurement, so spacing and text sizes are pixel-accurate at the design widths.

## 1. Getting started

```bash
npm install
npm run dev       # dev server (Vite), http://localhost:5173
npm run build     # type-check (tsc -b) + production build into dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable (or anon) key from your
Supabase project's API settings before starting the app:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
```

Configure the project's email confirmation and password recovery redirect settings to allow the app's origin,
`/update-password`, and `/auth/callback` routes.

To enable Google and Apple sign-up/sign-in, enable both providers in **Supabase Dashboard → Authentication → Providers**
and enter the OAuth credentials from their developer consoles. Set each provider's callback/return URL to
`https://<project-ref>.supabase.co/auth/v1/callback`. Add the app origins to **Authentication → URL Configuration**
redirect URLs, including `http://localhost:5173/auth/callback` for local development and the production app URL with
`/auth/callback`. The app uses that callback to send new social sign-ups to onboarding and returning users to the
dashboard. Apple may only provide a user's name on their first authorization, so the app falls back to the email name
when the provider does not return it later.

Run the SQL files in `supabase/migrations/` in filename order in the Supabase project's SQL Editor. They create the
newsletter subscriber table, private onboarding tables, private member photo storage and identity status, plus the
private onboarding-drafts table, city directory, discovery preferences, and server-side matching/action functions with
row-level security.

The city directory stores approximate city-center coordinates only; it does not collect device GPS or use a third-party
geocoder. The initial directory is intentionally small. Admins must add supported cities to `supported_cities` before
members in those cities can save profiles or be matched.

Identity verification uses Persona Hosted Flow. Configure a Persona inquiry template and webhook in the Persona
dashboard, then set the server-side Supabase Function secrets `PERSONA_API_KEY`, `PERSONA_INQUIRY_TEMPLATE_ID`, and
`PERSONA_WEBHOOK_SECRET`. Never put these values in a `VITE_` variable. Deploy `persona-create-inquiry` and
`persona-webhook`; subscribe the webhook to `inquiry.completed`, `inquiry.marked-for-review`, `inquiry.approved`, and
`inquiry.declined`, and point it at
`https://<project-ref>.supabase.co/functions/v1/persona-webhook`. Use Persona Sandbox credentials and a Sandbox inquiry
template until the flow has been tested. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

Alternatively, deploy with the Supabase CLI after installing it and linking the project:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase secrets set PERSONA_API_KEY="<persona-api-key>" PERSONA_INQUIRY_TEMPLATE_ID="<template-id>" PERSONA_WEBHOOK_SECRET="<webhook-secret>"
supabase functions deploy persona-create-inquiry
supabase functions deploy persona-webhook
```

Replace the quoted placeholders with secrets from Persona. Do not commit credentials or put them in frontend environment
variables.

`npm run build` (which type-checks the code) should pass before you push.

**Hosting note:** routing uses `BrowserRouter`, so the server must return `index.html` for any unknown path
(single-page-app fallback). `vite dev` and `vite preview` already do this.

## 2. Routes

| Route | Page | File |
|---|---|---|
| `/` | Homepage (marketing) | `src/pages/Home.tsx` |
| `/signup` | Create an Account | `src/pages/SignUp.tsx` |
| `/signin` | Welcome Back (sign in) | `src/pages/SignIn.tsx` |
| `/forgot-password` | Reset Password | `src/pages/ForgotPassword.tsx` |
| `/update-password` | Update Password | `src/pages/UpdatePassword.tsx` |
| `/onboarding` | Welcome + setup checklist | `src/pages/Onboarding.tsx` |
| `/onboarding/profile` | Step 1 of 3 — Photos & bio | `src/pages/OnboardingProfile.tsx` |
| `/onboarding/questions` | Step 2 of 3 — Compatibility questions | `src/pages/OnboardingQuestions.tsx` |
| `/onboarding/identity` | Step 3 of 3 — Identity verification | `src/pages/OnboardingIdentity.tsx` |
| `/onboarding/complete` | "You're all set" (profile complete, ID under review) | `src/pages/OnboardingComplete.tsx` |
| `/dashboard` | Signed-in Home: filters, suggested profile, introductions counter, quick preferences (**tablet layout only so far**) | `src/pages/Dashboard.tsx`, `src/components/dashboard/` |
| `/discover` `/matches` `/messages` `/profile` | "Coming soon" (no designs yet), inside the signed-in header | `src/pages/Placeholder.tsx` |
| `/membership` `/about` `/careers` `/press` `/contact` `/safety` `/help` `/guidelines` `/privacy` `/terms` `/cookies` `/ambassador` `/invite` | "Coming soon" (no designs yet), inside the marketing header and footer | `src/pages/Placeholder.tsx` |
| anything else | 404 | `src/pages/Placeholder.tsx` |

Routes are declared in `src/App.tsx`. There is **no auth guard**: any visitor can open `/dashboard`. The client-side
user state in `useUser()` is for UI only and is not an authorization boundary.

The "Coming soon" and 404 pages are **not from Figma** — they exist so no link in the app dead-ends. Replace each page
when its design arrives (delete its entry from the two lists in `App.tsx`).

## 3. Project structure

```
src/
  App.tsx                  route table
  main.tsx                 app entry (BrowserRouter)
  index.css                Tailwind import + design tokens (colors, fonts)
  lib/
    api.ts                 Supabase Auth and application backend calls (see section 5)
    supabase.ts            Supabase client, configured from VITE_SUPABASE_* environment variables
    session.ts             signed-in user (localStorage) + useUser()
    onboarding.ts          which onboarding steps are done (localStorage) + useOnboardingProgress()
    discover.ts            dashboard filter rules, value mappings, and display helpers
    validation.ts          email check, minimum password length
  pages/                   one file per route
  components/
    Header, Hero, ...      homepage sections
    RouteEffects.tsx       scroll-to-top / #anchor scrolling and page titles on every navigation
    Toast.tsx              success toast (used by reset/update password)
    MobileMenu.tsx         full-screen menu for small screens (opened by the header's menu button; below 768px)
    IntentPanel.tsx        the "By Intent / Cities & events / Trust Score" panel, shown when "Discover" is expanded in the menu
    dashboard/             signed-in Home: DashboardHeader, FiltersPanel, ProfileCard, SidePanels
    auth/parts.tsx         shared auth pieces: layout, fields, social buttons
    onboarding/            StepHeader (steps 1–3), OnboardingHeader, LocationModal
public/images/             photos, coins, logo (see Assets)
```

## 4. Design tokens

Defined in `src/index.css` and used as Tailwind classes (`bg-ink`, `text-gold`, ...):

| Token | Hex | Use |
|---|---|---|
| `ink` | `#15120E` | dark backgrounds, primary text |
| `cream` | `#F7F2E7` | page background |
| `gold` | `#C9922E` | buttons, accents |

Other colors appear as literals because they only occur in a few places: sand `#EFE8D8` (inputs, cards), border
`#E4DCD1`, muted text `#5C5748`, dark gold `#8A6A1F`, error red `#FF383C`, green `#5F7A56`.

**Fonts** (loaded from Google Fonts in `index.html`): **Fraunces** for headings (`font-serif`, plus its italic for the
profile quote) and **Geist** for body text (`font-sans`). Body text is 14px; type scale in the design is 12/14/16/18/24/40/64.

## 5. Where the backend plugs in

### How the frontend talks to the backend

Every call is a function in **`src/lib/api.ts`**. Sign-in, sign-up, password reset and password update use Supabase
Auth; newsletter subscriptions, onboarding details, and Persona verification status are saved to Supabase.

To report a failure, throw `new ApiError(message, field)`: the page shows `message` under the named field
(`email`, `password`, …) or as a general message when there is no field. Pages already handle this.

| Function | Used by | Notes |
|---|---|---|
| `signIn(email, password)` | Sign in | Supabase Auth password sign-in; the app stores the returned display name and email for its UI. |
| `signUp({ name, email, password })` | Sign up | Creates a Supabase Auth account; email-confirmation projects show a confirmation prompt. |
| `requestPasswordReset(email)` | Reset Password | Sends a Supabase recovery email to `/update-password`. |
| `updatePassword(password)` | Update Password | Updates the password using the Supabase recovery session. |
| `saveOnboardingProfile(profile)` | Photos & bio | Saves text fields and uploads 3–6 selected photos to the private `member-profile-photos` bucket, restricted to the signed-in member. |
| `saveOnboardingCompatibility(answers)` | Compatibility questions | Saves private matching answers to `member_compatibility`, restricted to the signed-in member. |
| `getOnboardingProgress()` | Setup checklist | Rebuilds completed steps from the saved profile, compatibility answers, and identity-verification status. |
| `getOnboardingProfileDraft()` / `saveOnboardingProfileDraft(...)` | Photos & bio | Loads saved profile fields and private photo previews; "Save & exit" stores unfinished text and selected photos in `member_onboarding_drafts` and the private photo bucket. |
| `getOnboardingCompatibilityDraft()` / `saveOnboardingCompatibilityDraft(...)` | Compatibility questions | Loads and saves unfinished answers, love-language picks, and notes in the member's private onboarding draft. |
| `startIdentityVerification()` | Identity verification | Calls an authenticated Supabase Edge Function, which creates or resumes a Persona inquiry and returns a one-time hosted link. Persona collects ID images and the selfie; TrueConnect does not store those documents. |
| `getIdentityVerificationStatus()` | Identity verification | Reads the signed-in member's private status; a signature-verified Persona webhook updates it. |
| `loadDashboard(filters?)` | Dashboard | Loads the member's saved filters and server-side matching results, usage count, and saved-profile IDs. Approved members receive signed photo URLs for approved profiles only. |
| `recordDiscoverAction(profileId, action)` | Dashboard | Records a like or pass, enforces the daily introduction limit, and excludes that profile from subsequent recommendations. |
| `undoLastDiscoverAction()` | Dashboard | Removes the latest same-day like/pass and restores that profile to the recommendation deck. |
| `toggleSavedProfile(profileId)` | Dashboard | Adds or removes a profile from the member's private saved list. |
| `subscribeNewsletter(email)` | Footer "Stay in the loop" | Adds a normalized email to `newsletter_subscribers`; duplicate subscriptions are treated as success. |

### What already works (no backend needed)

- **Validation** on sign up, sign in, reset password, update password and the newsletter field (required fields,
  email format, password of at least 8 characters, matching confirmation, consent checkbox), with inline messages in the
  designed error style and focus moved to the first problem.
- **Session display:** successful Supabase sign-in / sign-up stores the display name and email in `localStorage`
  (`tc.user`) for the UI. Supabase Auth validates credentials and manages its own auth session. The "Welcome to
  TrueConnect, <name>" and "You're all set, <name>" headings and the dashboard avatar initial use the stored display
  name (falling back to "Amara" / "A").
- **Onboarding progress** is loaded from Supabase: saved profile and compatibility rows, plus Persona verification
  status, determine which checklist steps are Done and where Continue sends the member. Unfinished profile and question
  drafts are stored in the private `member_onboarding_drafts` table; selected profile photos remain in private storage.
- **Navigation:** every link goes somewhere. Header, hero, footer and menu links scroll to the matching homepage section
  (`#how-it-works`, `#safety`, `#find-your-lane`, `#reviews`) or open a "Coming soon" page. Each navigation scrolls to the
  top (or to the anchor) and sets the page title.
- **Dashboard:** see below.

### Onboarding screens

| Screen | Collects | To do |
|---|---|---|
| `/onboarding` | — | The welcome card location ("Ikeja, Lagos") is still hardcoded. The "New Location Detected" modal opens only with `?location`. |
| Photos & bio | `name`, `dob`, gender, phone (+234 prefix), city, looking-for, `bio` (max 500), 3–6 photos, one prompt + `answer` | Text fields, supported city, and private photo object paths are saved to `member_profiles`; photos are stored in Supabase Storage. |
| Compatibility questions | 4 single-choice answers, up to 2 "love language" picks, optional `notes` | Private answers are saved to `member_compatibility`. |
| Identity verification | Consent; Persona collects ID type, document, and selfie in its hosted flow | Inquiry creation and one-time links run in a server-side Supabase Edge Function. Status is private and updated only by signature-verified Persona webhooks. Configure the Persona template, API key, webhook secret, and webhook events before enabling this in production. |
| Complete (`/onboarding/complete`) | — | The actual verification status is checked in the identity step; review time estimates and "3 potential matches found nearby" remain hardcoded. |

"Save & exit" and "Save & continue later" persist profile or compatibility drafts before returning home. "I'll do this later"
on the setup checklist and identity step returns home; identity status is already persisted by the Persona integration.

### Dashboard (`/dashboard`)

Built from the tablet "Home" frame (1024px) and the mobile frames (375px); the desktop frame does not exist yet (at desktop
width the layout keeps the same column widths with larger margins). On mobile the filters open as an overlay from "All
Filters" and the main nav becomes a bottom tab bar. Recommendations and preferences are backed by Supabase; only approved
members can discover. The mobile "Active this week" toggle filters using dashboard activity recorded in the last seven days.

| Part | What works today | Backend to do |
|---|---|---|
| Header | Nav links, active state, avatar initial from the session. The bell does nothing. "Discover/Matches/Messages/Profile" open "Coming soon" pages. | Unread-notification flag; real pages. |
| Filters | Show me / looking for / three sliders / ID-verified toggle and active-this-week filter run server-side; preferences persist in the member's row. City distance is calculated between approximate city centers. Rules and slider mappings are in `src/lib/discover.ts` and migration `202611020005_dashboard_matching.sql`. | Expand the admin-maintained city directory as launch regions are added. |
| Profile card | Recommendations come from completed member profiles; signed photo URLs are available only for approved photos. Like / pass / undo / save actions persist in Supabase and are scoped to the signed-in member. | Mutual-match behavior, saved-profile browsing, and complete profile photo galleries are not implemented. |
| Introductions | The server enforces a limit of 15 recorded likes/passes per member per day, using the member's local timezone; undo removes the latest same-day action. The count no longer starts from demo data. | |
| Quick preferences | Shows the applied filters; the "Verified only" toggle changes the filter immediately. | |
| Safety note | "Visit Safety Center" opens `/safety` ("Coming soon"). | |

### Content and data that is placeholder

- **Dropdown options:** Gender (`Female`, `Male`, `Prefer not to say`) and "What are you looking for?"
  (`Marriage-minded`, `Meaningful Dating`, `Concierge & discreet`, taken from the homepage). Confirm the real lists
  with product.
- **Date of birth** is a plain text box (`DD/MM/YY`) with a chevron — not a date picker.
- **Homepage:** all copy is static. Reviews, stats ("1,200+ verified reviews", "4.9") and cities are hardcoded.
- **Consent checkboxes** (sign up, identity verification) start **unchecked**, although the Figma frames show them
  checked. They are legal confirmations, so pre-ticking is not recommended.
- **Google / Apple buttons** do nothing yet (OAuth). The social icons in the footer have no URLs.

### Dev-only preview shortcuts (remove or keep out of production)

| URL | Shows |
|---|---|
| `/signin?error` | Sign-in error state (dev server only) |
| `/forgot-password?sent` | "Request Successful" toast (dev server only) |
| `/update-password?updated` | "Password Updated" toast, then redirect (dev server only) |
| `/onboarding?location` | Location modal (**works in production too** — remove once the real trigger exists) |
| `/?menu` | The small-screen menu, open (dev server only) |

To reset the demo state, clear `tc.user` and `tc.onboarding` from the browser's local storage.

## 6. Assets

Photos, the gold coins, the logo mark, the auth portraits and the dashboard profile photo in `public/images/` were
**cropped from Figma exports**, so some look slightly soft. The `*-mobile.jpg` files (`verified-mobile`, `coin-r-mobile`, `coin-bl-mobile`) were cut from the 1x mobile frame, so they are the softest. Replace them with the original exports from Figma (same file
names) before launch.

## 7. Notes for whoever continues the UI

- Pages were matched to the designs by measuring screenshots, so many spacing values are exact pixel values
  (for example `mt-[17px]`). Please keep them unless the design changes.
- Gradients use plain CSS (`bg-[linear-gradient(150deg,...)]`) rather than Tailwind's `from-`/`to-` utilities, because
  Tailwind v4 blends colors in a different color space and the result no longer matched Figma.
- The final onboarding screen is shifted 14.5px left at desktop width (`xl:-translate-x-[14.5px]`) because that is how the
  desktop design is laid out; the tablet design is centred.
- Several tablet values are intentionally different from desktop (for example the hero heading's optical size and the
  Safety columns); they are written as `md:…` overrides next to the `xl:…` desktop values.

## 8. Known gaps

- Desktop (1440px) is built for the homepage, auth pages and onboarding; tablet (1024px) for those plus the dashboard;
  mobile (375px) for all of those too. Widths between the design widths (for example 800px or 1100px) are not designed: the layout clips instead of
  scrolling sideways.
- The dashboard has no desktop frame. The "Coming soon" and 404 pages have no design.
- No automated tests are committed. The behaviour above was checked with a one-off browser script, not kept in the repo.
