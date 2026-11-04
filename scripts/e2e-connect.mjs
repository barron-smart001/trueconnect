// End-to-end check that two members can find each other, match, and talk.
//
//   SUPABASE_SERVICE_ROLE_KEY=<service role key> node --env-file=.env.local scripts/e2e-connect.mjs
//
// Run it against a dev/staging project only. It creates two throwaway confirmed users, exercises the real database
// functions and Realtime exactly as the app does, then deletes both users (cascades remove everything they created).
// The service role key is used only to create/delete the users and mark them verified; never commit it.

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anonKey || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (via --env-file=.env.local) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const admin = createClient(url, serviceKey, opts)
const run = Math.random().toString(36).slice(2, 8)
const password = `Tc-${run}-Passw0rd!`
const results = []
const created = []

async function step(name, fn) {
  try {
    await fn()
    results.push([true, name])
    console.log(`  PASS  ${name}`)
  } catch (error) {
    results.push([false, name])
    console.log(`  FAIL  ${name}\n        ${error?.message ?? error}`)
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

function must({ data, error }, label) {
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function makeMember(label, gender) {
  const email = `tc-e2e-${run}-${label}@example.com`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: label } })
  if (error) throw new Error(`create ${label}: ${error.message}`)
  created.push(data.user.id)
  const client = createClient(url, anonKey, opts)
  must(await client.auth.signInWithPassword({ email, password }), `sign in ${label}`)

  const city = must(await client.from('supported_cities').select('id, display_name').eq('display_name', 'Lagos, Nigeria').single(), 'city')
  must(await client.from('member_profiles').upsert({
    user_id: data.user.id,
    city_id: city.id,
    full_name: `${label} Tester`,
    date_of_birth: '15/06/95',
    gender,
    phone: '+2348012345678',
    location: city.display_name,
    intent: 'Marriage-minded',
    bio: 'Automated test member.',
    prompt: 'Family means…',
    prompt_answer: 'Sunday lunch together.',
    photo_paths: [`${data.user.id}/a.jpg`, `${data.user.id}/b.jpg`, `${data.user.id}/c.jpg`],
  }, { onConflict: 'user_id' }), `profile ${label}`)
  must(await admin.from('identity_verifications').upsert(
    { user_id: data.user.id, persona_inquiry_id: `e2e-${run}-${label}`, status: 'approved' },
    { onConflict: 'user_id' },
  ), `verify ${label}`)
  return { id: data.user.id, client, label }
}

const discover = (member, show) => member.client.rpc('get_discover_profiles', {
  p_show_me: show,
  p_looking_for: 'Marriage Minded',
  p_min_age: 25,
  p_max_age: 40,
  p_max_distance_km: 50,
  p_minimum_trust_score: 71,
  p_verified_only: true,
  p_active_this_week: false,
  p_limit: 50,
})

const timeZone = 'Africa/Lagos'
let amara, tunde, matchId

console.log(`\nTrueConnect end-to-end check (run ${run})\n`)

try {
  await step('Create and verify two members', async () => {
    amara = await makeMember('Amara', 'Female')
    tunde = await makeMember('Tunde', 'Male')
  })
  if (!amara || !tunde) throw new Error('Members could not be created; stopping.')

  await step('Each member discovers the other', async () => {
    const forAmara = must(await discover(amara, 'Men'), 'discover Amara')
    const forTunde = must(await discover(tunde, 'Women'), 'discover Tunde')
    expect(forAmara.some((p) => p.id === tunde.id), 'Amara does not see Tunde')
    expect(forTunde.some((p) => p.id === amara.id), 'Tunde does not see Amara')
  })

  await step('First like does not create a match', async () => {
    must(await amara.client.rpc('record_discover_action', { p_profile_id: tunde.id, p_action: 'like', p_time_zone: timeZone }), 'Amara likes Tunde')
    const rows = must(await admin.from('matches').select('id').eq('user_a', [amara.id, tunde.id].sort()[0]), 'matches')
    expect(rows.length === 0, 'A match exists after only one like')
  })

  await step('Mutual like creates a match and notifies both', async () => {
    must(await tunde.client.rpc('record_discover_action', { p_profile_id: amara.id, p_action: 'like', p_time_zone: timeZone }), 'Tunde likes Amara')
    const [a, b] = [amara.id, tunde.id].sort()
    const rows = must(await admin.from('matches').select('id, status').eq('user_a', a).eq('user_b', b), 'matches')
    expect(rows.length === 1 && rows[0].status === 'active', 'No active match after mutual like')
    matchId = rows[0].id
    for (const member of [amara, tunde]) {
      const notes = must(await member.client.from('notifications').select('type, payload').eq('type', 'match'), 'notifications')
      expect(notes.length === 1 && notes[0].payload.match_id === matchId, `${member.label} did not get the match notification`)
    }
  })

  await step('Match appears in both conversation lists', async () => {
    for (const [member, other] of [[amara, tunde], [tunde, amara]]) {
      const list = must(await member.client.rpc('list_conversations'), 'list_conversations')
      expect(list.length === 1 && list[0].profile_id === other.id, `${member.label}'s list is wrong`)
    }
  })

  await step('Matched like can no longer be undone', async () => {
    const undone = must(await tunde.client.rpc('undo_last_discover_action', { p_time_zone: timeZone }), 'undo')
    expect(undone === false, 'A like that produced a match was undone')
  })

  await step('Message arrives live over Realtime', async () => {
    const received = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No Realtime event within 8 seconds. Is the table in the supabase_realtime publication?')), 8000)
      tunde.client
        .channel(`e2e-${run}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, (payload) => {
          clearTimeout(timer)
          resolve(payload.new)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            amara.client.rpc('send_message', { p_match_id: matchId, p_body: 'Hello Tunde, nice to meet you.' }).then(({ error }) => {
              if (error) reject(new Error(`send_message: ${error.message}`))
            })
          }
        })
    })
    const message = await received
    expect(message.body === 'Hello Tunde, nice to meet you.' && message.sender_id === amara.id, 'Wrong message delivered')
  })

  await step('Unread counts and read receipts work', async () => {
    let list = must(await tunde.client.rpc('list_conversations'), 'list')
    expect(list[0].unread_count === 1, `Tunde should have 1 unread, has ${list[0].unread_count}`)
    expect(list[0].last_message === 'Hello Tunde, nice to meet you.', 'Last message is wrong')
    must(await tunde.client.rpc('mark_conversation_read', { p_match_id: matchId }), 'mark read')
    list = must(await tunde.client.rpc('list_conversations'), 'list')
    expect(list[0].unread_count === 0, 'Unread count did not clear')
  })

  await step('Reply arrives and history is readable', async () => {
    must(await tunde.client.rpc('send_message', { p_match_id: matchId, p_body: 'Hi Amara!' }), 'reply')
    const rows = must(await amara.client.from('messages').select('body, sender_id').eq('match_id', matchId).order('id'), 'history')
    expect(rows.length === 2 && rows[1].body === 'Hi Amara!', 'History is wrong')
  })

  await step('Outsiders cannot read or write the conversation', async () => {
    const stranger = createClient(url, anonKey, opts)
    const rows = must(await stranger.from('messages').select('id').eq('match_id', matchId), 'anon read')
    expect(rows.length === 0, 'An anonymous client can read messages')
    const { error } = await stranger.rpc('send_message', { p_match_id: matchId, p_body: 'intrude' })
    expect(error, 'An anonymous client can send messages')
  })

  await step('Block closes the conversation for both', async () => {
    must(await amara.client.rpc('block_member', { p_member_id: tunde.id }), 'block')
    const { error } = await tunde.client.rpc('send_message', { p_match_id: matchId, p_body: 'still there?' })
    expect(error, 'Blocked member can still send messages')
    for (const member of [amara, tunde]) {
      const list = must(await member.client.rpc('list_conversations'), 'list')
      expect(list.length === 0, `${member.label} still sees the conversation`)
    }
    const forTunde = must(await discover(tunde, 'Women'), 'discover')
    expect(!forTunde.some((p) => p.id === amara.id), 'Blocked member still appears in discovery')
  })
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id)
  console.log(`\nCleaned up ${created.length} test users.`)
}

const failed = results.filter(([ok]) => !ok).length
console.log(failed ? `\n${failed} of ${results.length} checks FAILED.\n` : `\nAll ${results.length} checks passed. Members can find each other, match, and talk.\n`)
process.exit(failed ? 1 : 0)
