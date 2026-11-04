import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PHOTO_BUCKET = 'member-profile-photos'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return jsonResponse({ error: 'Sign in to continue.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('delete-account is missing required server configuration.')
    return jsonResponse({ error: 'Account deletion is not configured. Please contact support.' }, 500)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await authClient.auth.getUser()
  if (authError || !authData.user) return jsonResponse({ error: 'Sign in to continue.' }, 401)
  const userId = authData.user.id

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    // Storage objects are not removed by database cascades, so delete the member's photos first.
    // Page through the folder in case a member has accumulated many orphaned drafts.
    for (;;) {
      const { data: objects, error: listError } = await admin.storage
        .from(PHOTO_BUCKET)
        .list(userId, { limit: 100 })
      if (listError) throw new Error('Unable to list member photos.')
      if (!objects?.length) break
      const { error: removeError } = await admin.storage
        .from(PHOTO_BUCKET)
        .remove(objects.map((object) => `${userId}/${object.name}`))
      if (removeError) throw new Error('Unable to remove member photos.')
    }

    // Deleting the auth user cascades to profiles, answers, matches, messages, and notifications.
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) throw new Error('Unable to delete the account.')
    return jsonResponse({ deleted: true })
  } catch (error) {
    console.error('delete-account failed', error instanceof Error ? error.message : error)
    return jsonResponse({ error: 'We could not delete your account. Please try again or contact support.' }, 500)
  }
})
