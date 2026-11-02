import type { User as SupabaseUser } from '@supabase/supabase-js'
import {
  DEFAULT_FILTERS,
  ageRange,
  distanceKm,
  minTrust,
  type Filters,
  type Profile,
} from './discover'
import { getSupabaseClient, SupabaseConfigurationError } from './supabase'
import type { Step } from './onboarding'

export class ApiError extends Error {
  field?: string
  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.field = field
  }
}

export type User = { name: string; email: string }
export type OAuthProvider = 'google' | 'apple'

type DiscoverRow = Omit<Profile, 'photo'> & { photo_paths: string[] }

function supabaseClient() {
  try {
    return getSupabaseClient()
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) throw new ApiError(error.message)
    throw error
  }
}

function toUser(authUser: SupabaseUser, fallbackEmail = ''): User {
  const email = authUser.email ?? fallbackEmail
  const metadataName = authUser.user_metadata.name
    ?? authUser.user_metadata.full_name
    ?? [authUser.user_metadata.given_name, authUser.user_metadata.family_name]
      .filter((part): part is string => typeof part === 'string')
      .join(' ')
  const name = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : email.split('@')[0] || 'Amara'
  return { name, email }
}

function authErrorMessage(message: string): string {
  if (message === 'Invalid login credentials') return 'Email or password is incorrect.'
  if (message === 'Email not confirmed') return 'Confirm your email address before signing in.'
  if (message === 'User already registered') return 'An account with this email already exists.'
  return message
}

/** Sign in through Supabase Auth and return the profile used by the app. */
export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await supabaseClient().auth.signInWithPassword({ email, password })
  if (error) throw new ApiError(authErrorMessage(error.message))
  if (!data.user) throw new ApiError('Sign in did not return a user. Please try again.')
  return toUser(data.user, email)
}

/** Start Google or Apple authentication and return to the requested app route. */
export async function signInWithOAuth(provider: OAuthProvider, destination: '/onboarding' | '/dashboard'): Promise<void> {
  const redirectTo = new URL('/auth/callback', window.location.origin)
  redirectTo.searchParams.set('next', destination)
  const { error } = await supabaseClient().auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo.toString() },
  })
  if (error) throw new ApiError(authErrorMessage(error.message))
}

/** Load the authenticated Supabase user after returning from an OAuth provider. */
export async function getAuthenticatedUser(): Promise<User> {
  const { data, error } = await supabaseClient().auth.getUser()
  if (error) throw new ApiError(authErrorMessage(error.message))
  if (!data.user) throw new ApiError('Authentication did not return a user. Please try again.')
  return toUser(data.user)
}

/** Create an account with Supabase Auth. Email confirmation may be required by project settings. */
export async function signUp(input: { name: string; email: string; password: string }): Promise<{
  user: User
  requiresEmailConfirmation: boolean
}> {
  const { data, error } = await supabaseClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  })
  if (error) throw new ApiError(authErrorMessage(error.message))
  if (!data.user) throw new ApiError('Account creation did not return a user. Please try again.')
  return { user: toUser(data.user, input.email), requiresEmailConfirmation: !data.session }
}

/** Send a password recovery link through Supabase Auth. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  })
  if (error) throw new ApiError(error.message)
}

/** Update the password for the recovery session established from the email link. */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabaseClient().auth.updateUser({ password })
  if (error) throw new ApiError(error.message)
}

async function authenticatedUserId(): Promise<string> {
  const { data, error } = await supabaseClient().auth.getUser()
  if (error) throw new ApiError(error.message)
  if (!data.user) throw new ApiError('Sign in before saving your onboarding details.')
  return data.user.id
}

export type OnboardingProfileFields = {
  fullName: string
  dateOfBirth: string
  gender: string
  phone: string
  location: string
  intent: string
  bio: string
  prompt: string
  promptAnswer: string
}

export type OnboardingCompatibilityDraft = {
  answers: Record<string, string>
  loveLanguages: string[]
  notes: string
}

export type OnboardingPhoto = { path: string; url: string }
export type OnboardingPhotoSelection = { file: File } | { path: string }

async function uploadMemberPhotos(
  client: ReturnType<typeof supabaseClient>,
  userId: string,
  files: File[],
): Promise<string[]> {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  }
  const uploadedPaths: string[] = []
  for (const file of files) {
    const extension = extensions[file.type]
    if (!extension || file.size > 10 * 1024 * 1024) {
      const { error: cleanupError } = uploadedPaths.length
        ? await client.storage.from('member-profile-photos').remove(uploadedPaths)
        : { error: null }
      const reason = !extension ? 'Choose a supported image file.' : 'Each photo must be 10 MB or smaller.'
      throw new ApiError(cleanupError ? `${reason} Cleanup also failed: ${cleanupError.message}` : reason)
    }

    const path = `${userId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await client.storage
      .from('member-profile-photos')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      const { error: cleanupError } = uploadedPaths.length
        ? await client.storage.from('member-profile-photos').remove(uploadedPaths)
        : { error: null }
      throw new ApiError(cleanupError
        ? `${uploadError.message} Photo cleanup also failed: ${cleanupError.message}`
        : uploadError.message)
    }
    uploadedPaths.push(path)
  }
  return uploadedPaths
}

async function signMemberPhotos(paths: string[]): Promise<OnboardingPhoto[]> {
  const client = supabaseClient()
  return Promise.all(paths.map(async (path) => {
    const { data, error } = await client.storage.from('member-profile-photos').createSignedUrl(path, 60 * 60)
    if (error) throw new ApiError(error.message)
    return { path, url: data.signedUrl }
  }))
}

/** Load the saved profile or its unfinished draft, including private photo previews. */
export async function getOnboardingProfileDraft(): Promise<{
  fields: OnboardingProfileFields | null
  photos: OnboardingPhoto[]
}> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const [draftResult, profileResult] = await Promise.all([
    client.from('member_onboarding_drafts').select('profile_draft, profile_photo_paths').eq('user_id', userId).maybeSingle(),
    client.from('member_profiles')
      .select('full_name, date_of_birth, gender, phone, location, intent, bio, prompt, prompt_answer, photo_paths')
      .eq('user_id', userId)
      .maybeSingle(),
  ])
  if (draftResult.error) throw new ApiError(draftResult.error.message)
  if (profileResult.error) throw new ApiError(profileResult.error.message)

  const savedProfile = profileResult.data
  const savedFields: OnboardingProfileFields | null = savedProfile ? {
    fullName: savedProfile.full_name,
    dateOfBirth: savedProfile.date_of_birth,
    gender: savedProfile.gender,
    phone: savedProfile.phone.replace(/^\+234/, ''),
    location: savedProfile.location,
    intent: savedProfile.intent,
    bio: savedProfile.bio,
    prompt: savedProfile.prompt,
    promptAnswer: savedProfile.prompt_answer,
  } : null
  const draftFields = draftResult.data?.profile_draft as OnboardingProfileFields | null
  const fields = draftFields ?? savedFields
  const paths = draftFields
    ? draftResult.data?.profile_photo_paths ?? []
    : savedProfile?.photo_paths ?? []
  return { fields, photos: await signMemberPhotos(paths) }
}

/** Save an unfinished profile and its selected photos to the member's private draft. */
export async function saveOnboardingProfileDraft(
  fields: OnboardingProfileFields,
  photos: OnboardingPhotoSelection[],
): Promise<OnboardingPhoto[]> {
  if (photos.length > 6) throw new ApiError('You can add up to 6 profile photos.')
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const [draftResult, profileResult] = await Promise.all([
    client.from('member_onboarding_drafts').select('profile_photo_paths').eq('user_id', userId).maybeSingle(),
    client.from('member_profiles').select('photo_paths').eq('user_id', userId).maybeSingle(),
  ])
  if (draftResult.error) throw new ApiError(draftResult.error.message)
  if (profileResult.error) throw new ApiError(profileResult.error.message)

  const uploadedPaths = await uploadMemberPhotos(
    client,
    userId,
    photos.flatMap((photo) => 'file' in photo ? [photo.file] : []),
  )
  let uploadedIndex = 0
  const paths = photos.map((photo) => 'file' in photo ? uploadedPaths[uploadedIndex++] : photo.path)
  const permittedPaths = new Set([
    ...(draftResult.data?.profile_photo_paths ?? []),
    ...(profileResult.data?.photo_paths ?? []),
  ])
  if (paths.some((path) => !permittedPaths.has(path) && !uploadedPaths.includes(path))) {
    if (uploadedPaths.length) {
      const { error } = await client.storage.from('member-profile-photos').remove(uploadedPaths)
      if (error) throw new ApiError(`Invalid draft photo path. Uploaded photo cleanup also failed: ${error.message}`)
    }
    throw new ApiError('A selected photo is not available in your account.')
  }

  const { error: saveError } = await client.from('member_onboarding_drafts').upsert({
    user_id: userId,
    profile_draft: fields,
    profile_photo_paths: paths,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (saveError) {
    const { error: cleanupError } = uploadedPaths.length
      ? await client.storage.from('member-profile-photos').remove(uploadedPaths)
      : { error: null }
    throw new ApiError(cleanupError
      ? `${saveError.message} Photo cleanup also failed: ${cleanupError.message}`
      : saveError.message)
  }

  const retainedPaths = new Set([...paths, ...(profileResult.data?.photo_paths ?? [])])
  const pathsToRemove = (draftResult.data?.profile_photo_paths ?? []).filter((path: string) => !retainedPaths.has(path))
  if (pathsToRemove.length) {
    const { error } = await client.storage.from('member-profile-photos').remove(pathsToRemove)
    if (error) throw new ApiError(`Draft saved, but removed photos could not be cleaned up: ${error.message}`)
  }
  return signMemberPhotos(paths)
}

/** Save the member's completed profile and selected private photos. */
export async function saveOnboardingProfile(input: OnboardingProfileFields & {
  photos: OnboardingPhotoSelection[]
}): Promise<void> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const { data: city, error: cityError } = await client
    .from('supported_cities')
    .select('id')
    .eq('display_name', input.location.trim())
    .maybeSingle()
  if (cityError) throw new ApiError(cityError.message)
  if (!city) throw new ApiError('Choose a supported city before saving your profile.')

  const [profileResult, draftResult] = await Promise.all([
    client.from('member_profiles').select('photo_paths').eq('user_id', userId).maybeSingle(),
    client.from('member_onboarding_drafts').select('profile_photo_paths').eq('user_id', userId).maybeSingle(),
  ])
  if (profileResult.error) throw new ApiError(profileResult.error.message)
  if (draftResult.error) throw new ApiError(draftResult.error.message)

  const permittedPaths = new Set([
    ...(profileResult.data?.photo_paths ?? []),
    ...(draftResult.data?.profile_photo_paths ?? []),
  ])
  const existingPaths = input.photos.flatMap((photo) => 'path' in photo ? [photo.path] : [])
  if (existingPaths.some((path) => !permittedPaths.has(path))) {
    throw new ApiError('A selected photo is not available in your account.')
  }

  const uploadedPaths = await uploadMemberPhotos(
    client,
    userId,
    input.photos.flatMap((photo) => 'file' in photo ? [photo.file] : []),
  )
  let uploadedIndex = 0
  const photoPaths = input.photos.map((photo) => 'file' in photo ? uploadedPaths[uploadedIndex++] : photo.path)
  if (photoPaths.length < 3 || photoPaths.length > 6) {
    const { error } = uploadedPaths.length
      ? await client.storage.from('member-profile-photos').remove(uploadedPaths)
      : { error: null }
    throw new ApiError(error
      ? `Add between 3 and 6 photos. Photo cleanup also failed: ${error.message}`
      : 'Add between 3 and 6 photos.')
  }

  const { error: saveError } = await client.from('member_profiles').upsert({
    user_id: userId,
    city_id: city.id,
    full_name: input.fullName.trim(),
    date_of_birth: input.dateOfBirth.trim(),
    gender: input.gender,
    phone: input.phone.trim(),
    location: input.location.trim(),
    intent: input.intent,
    bio: input.bio.trim(),
    prompt: input.prompt,
    prompt_answer: input.promptAnswer.trim(),
    photo_paths: photoPaths,
  }, { onConflict: 'user_id' })
  if (saveError) {
    const { error } = uploadedPaths.length
      ? await client.storage.from('member-profile-photos').remove(uploadedPaths)
      : { error: null }
    throw new ApiError(error ? `${saveError.message} Photo cleanup also failed: ${error.message}` : saveError.message)
  }

  const { error: clearDraftError } = await client.from('member_onboarding_drafts').upsert({
    user_id: userId,
    profile_draft: null,
    profile_photo_paths: [],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (clearDraftError) throw new ApiError(`Profile saved, but its draft could not be cleared: ${clearDraftError.message}`)

  const oldPaths = new Set([
    ...(profileResult.data?.photo_paths ?? []),
    ...(draftResult.data?.profile_photo_paths ?? []),
  ])
  const pathsToRemove = [...oldPaths].filter((path) => !photoPaths.includes(path))
  if (pathsToRemove.length) {
    const { error } = await client.storage.from('member-profile-photos').remove(pathsToRemove)
    if (error) throw new ApiError(`Profile saved, but previous photos could not be removed: ${error.message}`)
  }
}

/** Save private matching answers and preferences for the authenticated member. */
export async function saveOnboardingCompatibility(input: OnboardingCompatibilityDraft): Promise<void> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const { error } = await client.from('member_compatibility').upsert({
    user_id: userId,
    answers: input.answers,
    love_languages: input.loveLanguages,
    notes: input.notes.trim(),
  }, { onConflict: 'user_id' })

  if (error) throw new ApiError(error.message)
  const { error: clearDraftError } = await client.from('member_onboarding_drafts').upsert({
    user_id: userId,
    compatibility_draft: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (clearDraftError) throw new ApiError(`Answers saved, but their draft could not be cleared: ${clearDraftError.message}`)
}

/** Load unfinished or completed compatibility answers for the signed-in member. */
export async function getOnboardingCompatibilityDraft(): Promise<OnboardingCompatibilityDraft | null> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const [draftResult, savedResult] = await Promise.all([
    client.from('member_onboarding_drafts').select('compatibility_draft').eq('user_id', userId).maybeSingle(),
    client.from('member_compatibility').select('answers, love_languages, notes').eq('user_id', userId).maybeSingle(),
  ])
  if (draftResult.error) throw new ApiError(draftResult.error.message)
  if (savedResult.error) throw new ApiError(savedResult.error.message)
  return (draftResult.data?.compatibility_draft as OnboardingCompatibilityDraft | null)
    ?? (savedResult.data ? {
      answers: savedResult.data.answers as Record<string, string>,
      loveLanguages: savedResult.data.love_languages,
      notes: savedResult.data.notes,
    } : null)
}

/** Persist compatibility choices without marking the step complete. */
export async function saveOnboardingCompatibilityDraft(input: OnboardingCompatibilityDraft): Promise<void> {
  const { error } = await supabaseClient().from('member_onboarding_drafts').upsert({
    user_id: await authenticatedUserId(),
    compatibility_draft: input,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw new ApiError(error.message)
}

export type IdentityVerificationStatus = 'not_started' | 'pending' | 'under_review' | 'approved' | 'declined'

/** Read persisted onboarding completion from the data saved for each step. */
export async function getOnboardingProgress(): Promise<Step[]> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const [profile, compatibility, verification] = await Promise.all([
    client.from('member_profiles').select('user_id').eq('user_id', userId).maybeSingle(),
    client.from('member_compatibility').select('user_id').eq('user_id', userId).maybeSingle(),
    client.from('identity_verifications').select('status').eq('user_id', userId).maybeSingle(),
  ])
  if (profile.error) throw new ApiError(profile.error.message)
  if (compatibility.error) throw new ApiError(compatibility.error.message)
  if (verification.error) throw new ApiError(verification.error.message)

  const completed: Step[] = []
  if (profile.data) completed.push('profile')
  if (compatibility.data) completed.push('questions')
  if (verification.data?.status === 'under_review' || verification.data?.status === 'approved') {
    completed.push('identity')
  }
  return completed
}

/** Create or resume the member's Persona hosted verification inquiry. */
export async function startIdentityVerification(): Promise<{ url?: string; status?: IdentityVerificationStatus }> {
  await authenticatedUserId()
  const { data, error } = await supabaseClient().functions.invoke<{
    url?: string
    status?: IdentityVerificationStatus
  }>('persona-create-inquiry')
  if (error) throw new ApiError(error.message)
  if (!data?.url && data?.status !== 'under_review' && data?.status !== 'approved') {
    throw new ApiError('Identity verification did not return a secure link. Please try again.')
  }
  return data
}

/** Read the member's verification status; the status is updated by Persona webhooks. */
export async function getIdentityVerificationStatus(): Promise<{
  status: IdentityVerificationStatus
  submittedAt: string | null
}> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  const { data, error } = await client
    .from('identity_verifications')
    .select('status, submitted_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new ApiError(error.message)
  return {
    status: (data?.status as IdentityVerificationStatus | undefined) ?? 'not_started',
    submittedAt: data?.submitted_at ?? null,
  }
}

/** Add an email to the public newsletter list. Duplicate subscriptions are successful and idempotent. */
export async function subscribeNewsletter(email: string): Promise<void> {
  const { error } = await supabaseClient()
    .from('newsletter_subscribers')
    .insert({ email: email.trim().toLowerCase() })

  if (error && error.code !== '23505') throw new ApiError(error.message)
}

export async function getSupportedCities(): Promise<string[]> {
  const { data, error } = await supabaseClient()
    .from('supported_cities')
    .select('display_name')
    .order('display_name')
  if (error) throw new ApiError(error.message)
  return data.map((city) => city.display_name)
}

function currentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function filtersFromRow(row: {
  show_me: Filters['show']
  looking_for: Filters['looking']
  min_age: number
  max_distance_km: number
  minimum_trust_score: number
  verified_only: boolean
  active_this_week: boolean
}): Filters {
  return {
    show: row.show_me,
    looking: row.looking_for,
    age: Math.max(0, Math.min(1, (row.min_age - 18) / 30)),
    distance: Math.max(0, Math.min(1, row.max_distance_km / 162)),
    trust: Math.max(0, Math.min(1, (row.minimum_trust_score - 71) / 29)),
    verifiedOnly: row.verified_only,
    activeThisWeek: row.active_this_week,
  }
}

export type DashboardData = {
  filters: Filters
  profiles: Profile[]
  used: number
  total: number
  canUndo: boolean
  savedIds: string[]
}

/** Load saved filters, server-ranked profiles, introduction usage, and saved profile IDs. */
export async function loadDashboard(filtersOverride?: Filters): Promise<DashboardData> {
  const client = supabaseClient()
  const userId = await authenticatedUserId()
  let filters = filtersOverride ?? DEFAULT_FILTERS

  if (!filtersOverride) {
    const { data: savedFilters, error: filtersError } = await client
      .from('member_discover_preferences')
      .select('show_me, looking_for, min_age, max_distance_km, minimum_trust_score, verified_only, active_this_week')
      .eq('user_id', userId)
      .maybeSingle()
    if (filtersError) throw new ApiError(filtersError.message)
    if (savedFilters) filters = filtersFromRow(savedFilters)
  }

  const [minAge, maxAge] = ageRange(filters.age)
  const { error: saveFiltersError } = await client.from('member_discover_preferences').upsert({
    user_id: userId,
    show_me: filters.show,
    looking_for: filters.looking,
    min_age: minAge,
    max_age: maxAge,
    max_distance_km: distanceKm(filters.distance),
    minimum_trust_score: minTrust(filters.trust),
    verified_only: filters.verifiedOnly,
    active_this_week: filters.activeThisWeek,
    time_zone: currentTimeZone(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (saveFiltersError) throw new ApiError(saveFiltersError.message)

  const [profilesResult, stateResult] = await Promise.all([
    client.rpc('get_discover_profiles', {
      p_show_me: filters.show,
      p_looking_for: filters.looking,
      p_min_age: minAge,
      p_max_age: maxAge,
      p_max_distance_km: distanceKm(filters.distance),
      p_minimum_trust_score: minTrust(filters.trust),
      p_verified_only: filters.verifiedOnly,
      p_active_this_week: filters.activeThisWeek,
      p_limit: 50,
    }),
    client.rpc('get_discover_state', { p_time_zone: currentTimeZone() }),
  ])
  if (profilesResult.error) throw new ApiError(profilesResult.error.message)
  if (stateResult.error) throw new ApiError(stateResult.error.message)

  const rows = profilesResult.data as DiscoverRow[]
  const profiles = await Promise.all(rows.map(async ({ photo_paths: photoPaths, ...profile }) => {
    let photo: string | undefined
    if (profile.verified && photoPaths.length > 0) {
      const { data, error } = await client.storage
        .from('member-profile-photos')
        .createSignedUrl(photoPaths[0], 60 * 60)
      if (error) throw new ApiError(error.message)
      photo = data.signedUrl
    }
    return { ...profile, photo }
  }))

  const state = stateResult.data?.[0]
  if (!state) throw new ApiError('Dashboard state was not returned. Please refresh and try again.')
  return {
    filters,
    profiles,
    used: state.used_count,
    total: state.daily_limit,
    canUndo: state.can_undo,
    savedIds: state.saved_profile_ids,
  }
}

export async function recordDiscoverAction(profileId: string, action: 'like' | 'pass'): Promise<void> {
  const { error } = await supabaseClient().rpc('record_discover_action', {
    p_profile_id: profileId,
    p_action: action,
    p_time_zone: currentTimeZone(),
  })
  if (error) throw new ApiError(error.message)
}

export async function undoLastDiscoverAction(): Promise<void> {
  const { data, error } = await supabaseClient().rpc('undo_last_discover_action', {
    p_time_zone: currentTimeZone(),
  })
  if (error) throw new ApiError(error.message)
  if (!data) throw new ApiError('There is no introduction to undo.')
}

export async function toggleSavedProfile(profileId: string): Promise<void> {
  const { error } = await supabaseClient().rpc('toggle_saved_profile', { p_profile_id: profileId })
  if (error) throw new ApiError(error.message)
}
