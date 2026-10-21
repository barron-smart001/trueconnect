# TrueConnect — frontend

Web frontend for TrueConnect, a verified, intent-based relationship platform for Africans worldwide.
This repo is **frontend only**: every screen is built to the Figma designs, and every backend call goes through one stub
file (`src/lib/api.ts`). Section 5 lists what the backend needs to supply.

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

`npm run build` (which type-checks the code) should pass before you push.

**Lint note:** `npm run lint` uses oxlint, which needs a native binary. On the machine this frontend was built on it was
blocked by Windows Application Control ("An Application Control policy has blocked this file"), so lint was **not**
run there. Please run it on your own machine or in CI and fix anything it reports.

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

Routes are declared in `src/App.tsx`. There is **no auth guard**: any visitor can open `/dashboard`. Add one when real
auth exists (the signed-in user is available from `useUser()` in `src/lib/session.ts`).

The "Coming soon" and 404 pages are **not from Figma** — they exist so no link in the app dead-ends. Replace each page
when its design arrives (delete its entry from the two lists in `App.tsx`).

## 3. Project structure

```
src/
  App.tsx                  route table
  main.tsx                 app entry (BrowserRouter)
  index.css                Tailwind import + design tokens (colors, fonts)
  lib/
    api.ts                 STUB API layer — every backend call goes through here (see section 5)
    session.ts             signed-in user (localStorage) + useUser()
    onboarding.ts          which onboarding steps are done (localStorage) + useOnboardingProgress()
    discover.ts            dashboard filter rules and the demo profile deck
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

Every call is a function in **`src/lib/api.ts`**. Today each one waits ~half a second and succeeds. To connect the real
API, replace the function bodies with `fetch` calls and keep the signatures.

To report a failure, throw `new ApiError(message, field)`: the page shows `message` under the named field
(`email`, `password`, …) or as a general message when there is no field. Pages already handle this.

| Function | Used by | Notes |
|---|---|---|
| `signIn(email, password)` | Sign in | Returns the user. Throw `ApiError('This email is incorrect', 'email')` / `('This password is incorrect', 'password')` to show the designed error state. |
| `signUp({ name, email, password })` | Sign up | Returns the new user. Then the app goes to `/onboarding`. |
| `requestPasswordReset(email)` | Reset Password | Must succeed whether or not the email exists (the toast says "if your email exists"). |
| `updatePassword(password)` | Update Password | Needs the reset token from the emailed link (read it from the URL). |
| `submitIdentity()` | Identity verification | Currently sends nothing: add ID type, front/back images and selfie. |
| `subscribeNewsletter(email)` | Footer "Stay in the loop" | |

### What already works (no backend needed)

- **Validation** on sign up, sign in, reset password, update password and the newsletter field (required fields,
  email format, password of at least 8 characters, matching confirmation, consent checkbox), with inline messages in the
  designed error style and focus moved to the first problem.
- **Demo session:** a successful sign in / sign up stores the user in `localStorage` (`tc.user`). Any well-formed
  email and password signs in. The "Welcome to TrueConnect, <name>" and "You're all set, <name>" headings and the
  dashboard avatar initial use it (falling back to "Amara" / "A").
- **Onboarding progress** is saved in `localStorage` (`tc.onboarding`): finishing a step marks it Done in the checklist,
  advances the "Required" pill and the "N of 4 complete" count, and the checklist's Continue button goes to the next
  unfinished step (or to the final screen when all are done). Identity verification requires the front of the ID (and the
  back, except for a passport).
- **Navigation:** every link goes somewhere. Header, hero, footer and menu links scroll to the matching homepage section
  (`#how-it-works`, `#safety`, `#find-your-lane`, `#reviews`) or open a "Coming soon" page. Each navigation scrolls to the
  top (or to the anchor) and sets the page title.
- **Dashboard:** see below.

### Onboarding screens

| Screen | Collects | To do |
|---|---|---|
| `/onboarding` | — | Location ("Ikeja, Lagos") is hardcoded. The "New Location Detected" modal should open when the API reports a new location (today it opens only with `?location`). |
| Photos & bio | `name`, `dob`, gender, phone (+234 prefix), `location` (read-only), looking-for, `bio` (max 500), up to 6 photos, one prompt + `answer` | Values are demo defaults and are **not saved or sent**: only "step done" is remembered. Photos are previewed locally (object URLs); nothing is uploaded. The first three slots show placeholder "A" tiles that count as added photos, so the 3-photo minimum is not enforced. |
| Compatibility questions | 4 single-choice answers, up to 2 "love language" picks, optional `notes` | Answers live in React state only. Collect and send them. |
| Identity verification | ID type, front image, back image, selfie, consent checkbox | File picker only stores the file name. Needs real upload and selfie capture ("Open camera" does nothing). |
| Complete (`/onboarding/complete`) | — | The "Under review" / "Pending" statuses, "Submitted just now", the review time estimates and "3 potential matches found nearby" are hardcoded. |

"Save & exit", "Save & continue later" and "I'll do this later" currently just go to the homepage.

### Dashboard (`/dashboard`)

Built from the tablet "Home" frame (1024px) and the mobile frames (375px); the desktop frame does not exist yet (at desktop
width the layout keeps the same column widths with larger margins). On mobile the filters open as an overlay from "All
Filters" and the main nav becomes a bottom tab bar; the mobile filters add an "Active this week" toggle, which is stored but
does not filter the demo deck yet.

| Part | What works today | Backend to do |
|---|---|---|
| Header | Nav links, active state, avatar initial from the session. The bell does nothing. "Discover/Matches/Messages/Profile" open "Coming soon" pages. | Unread-notification flag; real pages. |
| Filters | Show me / looking for / three sliders / ID-verified toggle all work. The slider labels follow the sliders ("27 – 36", "Within 50km", "80+"). "Apply filters" filters the deck; "Reset" restores the defaults. | Persist and load saved filters; do the filtering server-side. Rules and slider ranges are in `src/lib/discover.ts`. |
| Profile card | Like / pass / undo / save work on a **demo deck of 11 profiles** (`PROFILES` in `discover.ts`); only the first has a real photo — the others show an initial on a gold tile. When the deck or the day's introductions run out, a message replaces the card. | Fetch the next profile; record like / pass / save; photos (the photo-progress segments are static). |
| Introductions | The count goes up on every like/pass and back down on undo; 15 per day; "Resets in Nh" counts hours to local midnight. Starts at 8 of 15 as in the design. | Real used/total and reset time from the server. |
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
