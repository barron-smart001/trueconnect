import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PersonaEvent = {
  data?: {
    id?: string
    attributes?: {
      name?: string
      'created-at'?: string
      payload?: {
        data?: { id?: string; type?: string }
      }
    }
  }
}

const encoder = new TextEncoder()
const MAX_SIGNATURE_AGE_SECONDS = 5 * 60

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

async function verifySignature(rawBody: string, signatureHeader: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const nowSeconds = Math.floor(Date.now() / 1000)

  for (const signatureSet of signatureHeader.split(' ')) {
    const parts = Object.fromEntries(
      signatureSet.split(',').map((part) => {
        const separator = part.indexOf('=')
        return separator === -1 ? ['', ''] : [part.slice(0, separator), part.slice(separator + 1)]
      }),
    )
    const timestamp = parts.t
    const signature = parts.v1
    if (!timestamp || !signature || !/^\d+$/.test(timestamp)) continue
    if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SIGNATURE_AGE_SECONDS) continue

    const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`)))
    if (constantTimeEqual(signature.toLowerCase(), hex(digest))) return true
  }
  return false
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed.', { status: 405 })

  const webhookSecret = Deno.env.get('PERSONA_WEBHOOK_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error('Persona webhook is missing required server configuration.')
    return new Response('Webhook is not configured.', { status: 500 })
  }

  const signature = request.headers.get('Persona-Signature')
  if (!signature) return new Response('Missing signature.', { status: 401 })
  const rawBody = await request.text()
  if (!await verifySignature(rawBody, signature, webhookSecret)) {
    return new Response('Invalid signature.', { status: 401 })
  }

  let event: PersonaEvent
  try {
    event = JSON.parse(rawBody) as PersonaEvent
  } catch {
    return new Response('Invalid event payload.', { status: 400 })
  }

  const eventId = event.data?.id
  const eventName = event.data?.attributes?.name
  const inquiry = event.data?.attributes?.payload?.data
  const createdAt = event.data?.attributes?.['created-at']
  if (!eventId || !eventName || inquiry?.type !== 'inquiry' || !inquiry.id || !createdAt) {
    return new Response('Unsupported event payload.', { status: 400 })
  }

  const statusByEvent: Record<string, 'pending' | 'under_review' | 'approved' | 'declined'> = {
    'inquiry.completed': 'under_review',
    'inquiry.marked-for-review': 'under_review',
    'inquiry.approved': 'approved',
    'inquiry.declined': 'declined',
  }
  const status = statusByEvent[eventName]
  if (!status) return new Response(null, { status: 204 })

  const eventTime = new Date(createdAt)
  if (Number.isNaN(eventTime.getTime())) return new Response('Invalid event timestamp.', { status: 400 })

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: current, error: readError } = await admin
    .from('identity_verifications')
    .select('last_event_at')
    .eq('persona_inquiry_id', inquiry.id)
    .maybeSingle()
  if (readError) {
    console.error('Could not read identity verification status.', readError)
    return new Response('Could not process event.', { status: 500 })
  }
  if (!current) return new Response(null, { status: 204 })
  if (current.last_event_at && new Date(current.last_event_at).getTime() >= eventTime.getTime()) {
    return new Response(null, { status: 204 })
  }

  const { error: updateError } = await admin
    .from('identity_verifications')
    .update({
      status,
      last_event_at: eventTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('persona_inquiry_id', inquiry.id)
  if (updateError) {
    console.error('Could not update identity verification status.', updateError)
    return new Response('Could not process event.', { status: 500 })
  }

  return new Response(null, { status: 204 })
})
