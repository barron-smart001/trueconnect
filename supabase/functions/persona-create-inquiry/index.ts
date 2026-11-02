import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type PersonaInquiryResponse = {
  data?: { id?: string }
  meta?: { 'one-time-link'?: string }
}

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
  const personaApiKey = Deno.env.get('PERSONA_API_KEY')
  const templateId = Deno.env.get('PERSONA_INQUIRY_TEMPLATE_ID')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !personaApiKey || !templateId) {
    console.error('Persona inquiry function is missing required server configuration.')
    return jsonResponse({ error: 'Identity verification is not configured. Please contact support.' }, 500)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await authClient.auth.getUser()
  if (authError || !authData.user) return jsonResponse({ error: 'Sign in to continue.' }, 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const { data: existing, error: existingError } = await admin
      .from('identity_verifications')
      .select('persona_inquiry_id, status')
      .eq('user_id', authData.user.id)
      .maybeSingle()
    if (existingError) throw new Error('Unable to read existing verification.')

    if (existing?.status === 'approved' || existing?.status === 'under_review') {
      return jsonResponse({ status: existing.status })
    }

    let inquiryId = existing && existing.status !== 'declined'
      ? existing.persona_inquiry_id
      : null

    if (!inquiryId) {
      const createResponse = await fetch('https://api.withpersona.com/api/v1/inquiries', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personaApiKey}`,
          'Content-Type': 'application/json',
          'Persona-Version': '2026-09-29',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              'inquiry-template-id': templateId,
              'reference-id': authData.user.id,
            },
          },
        }),
      })
      if (!createResponse.ok) {
        console.error(`Persona inquiry creation failed with HTTP ${createResponse.status}.`)
        throw new Error('Persona could not create an inquiry.')
      }
      const inquiry = await createResponse.json() as PersonaInquiryResponse
      inquiryId = inquiry.data?.id ?? null
      if (!inquiryId) throw new Error('Persona returned no inquiry ID.')

      const { error: saveError } = await admin.from('identity_verifications').upsert({
        user_id: authData.user.id,
        persona_inquiry_id: inquiryId,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        last_event_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (saveError) throw new Error('Unable to save the verification request.')
    }

    let linkResponse = await fetch(
      `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(inquiryId)}/generate-one-time-link`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personaApiKey}`,
          'Persona-Version': '2026-09-29',
        },
      },
    )

    if (!linkResponse.ok && existing?.persona_inquiry_id === inquiryId) {
      const resumeResponse = await fetch(
        `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(inquiryId)}/resume`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${personaApiKey}`,
            'Persona-Version': '2026-09-29',
          },
        },
      )
      if (resumeResponse.ok) {
        linkResponse = await fetch(
          `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(inquiryId)}/generate-one-time-link`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${personaApiKey}`,
              'Persona-Version': '2026-09-29',
            },
          },
        )
      }
    }

    if (!linkResponse.ok) {
      console.error(`Persona one-time link generation failed with HTTP ${linkResponse.status}.`)
      throw new Error('Persona could not create a secure verification link.')
    }
    const link = await linkResponse.json() as PersonaInquiryResponse
    const url = link.meta?.['one-time-link']
    if (!url || !url.startsWith('https://')) throw new Error('Persona returned an invalid verification link.')

    return jsonResponse({ url })
  } catch (error) {
    console.error('Persona inquiry request failed.', error)
    return jsonResponse({ error: 'Could not start identity verification. Please try again.' }, 502)
  }
})
