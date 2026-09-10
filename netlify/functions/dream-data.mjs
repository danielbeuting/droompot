import { createClient } from '@supabase/supabase-js'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function client(req) {
  const url = Netlify.env.get('VITE_SUPABASE_URL')
  const key = Netlify.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (!url || !key) throw new Error('Supabase environment is not configured')
  const auth = req.headers.get('authorization')
  return createClient(url, key, { global: auth ? { headers: { Authorization: auth } } : {}, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

function publicMedia(supabase, path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path
  return supabase.storage.from('dreampot-media').getPublicUrl(path).data.publicUrl
}

async function readState(supabase, slug) {
  const { data: pot, error: potError } = await supabase.from('dreampots').select('id,child_name,birth_date,theme,photo_path,general_savings_description,is_public').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (potError) throw potError
  if (!pot) return null
  const [{ data: goals, error: goalError }, { data: wishes, error: wishError }, { data: contributions, error: contributionError }] = await Promise.all([
    supabase.from('savings_goals').select('id,title,description,icon,target_amount,current_amount,is_general,sort_order').eq('dreampot_id', pot.id).order('sort_order'),
    supabase.from('wishlist_items').select('id,title,description,price,product_url,image_url,claimed,sort_order').eq('dreampot_id', pot.id).order('sort_order'),
    supabase.from('contributions').select('id,giver_name,amount,message,method,photo_path,goal_id,created_at').eq('dreampot_id', pot.id).in('status', ['confirmed','completed']).order('created_at', { ascending: false }).limit(50),
  ])
  if (goalError) throw goalError
  if (wishError) throw wishError
  if (contributionError) throw contributionError
  const goalById = new Map((goals || []).map(g => [g.id, g.title]))
  return {
    childName: pot.child_name,
    birthDate: pot.birth_date || '',
    theme: pot.theme || 'green',
    photo: publicMedia(supabase, pot.photo_path),
    activeGoal: 0,
    goals: (goals || []).map(g => ({ id: g.id, title: g.title, icon: g.icon || (g.is_general ? '💰' : '🎯'), type: g.is_general ? 'Spaarrekening' : 'Spaardoel', description: g.description || (g.is_general ? pot.general_savings_description || 'Vrij sparen voor later.' : ''), current: Number(g.current_amount || 0), goal: Number(g.target_amount || 1) })),
    wishes: (wishes || []).map(w => ({ id: w.id, title: w.title, price: Number(w.price || 0), link: w.product_url || '', note: w.description || '', image: publicMedia(supabase, w.image_url), emoji: '🎁', claimed: Boolean(w.claimed) })),
    transactions: (contributions || []).map(c => ({ id: c.id, name: c.giver_name || 'Anoniem', amount: Number(c.amount || 0), message: c.message || '', goal: goalById.get(c.goal_id) || 'Droompot', cash: c.method === 'cash', photo: publicMedia(supabase, c.photo_path) })),
  }
}

async function ownedPot(supabase, slug) {
  const { data, error } = await supabase.from('dreampots').select('id').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

async function writeState(supabase, slug, state) {
  const pot = await ownedPot(supabase, slug)
  if (!pot) return { error: 'Unauthorized or Droompot not found', status: 403 }
  const photo = typeof state.photo === 'string' && state.photo.trim() ? state.photo.trim() : null
  const { error: potError } = await supabase.from('dreampots').update({ child_name: String(state.childName || '').trim() || 'Droompot', birth_date: state.birthDate || null, theme: state.theme || 'green', photo_path: photo }).eq('id', pot.id)
  if (potError) throw potError

  const incomingGoals = Array.isArray(state.goals) ? state.goals : []
  const { data: existingGoals, error: existingGoalError } = await supabase.from('savings_goals').select('id,is_general').eq('dreampot_id', pot.id)
  if (existingGoalError) throw existingGoalError
  const general = (existingGoals || []).find(g => g.is_general)
  const nonGeneralIds = (existingGoals || []).filter(g => !g.is_general).map(g => g.id)
  if (nonGeneralIds.length) { const { error } = await supabase.from('savings_goals').delete().in('id', nonGeneralIds); if (error) throw error }
  const generalInput = incomingGoals.find(g => g.type === 'Spaarrekening' || g.title === 'Algemene spaarrekening')
  if (general && generalInput) {
    const { error } = await supabase.from('savings_goals').update({ title: generalInput.title || 'Algemene spaarrekening', description: generalInput.description || 'Vrij sparen voor later.', icon: generalInput.icon || '💰', target_amount: Math.max(1, Number(generalInput.goal || 1)), current_amount: Math.max(0, Number(generalInput.current || 0)), sort_order: Math.max(0, incomingGoals.length - 1) }).eq('id', general.id)
    if (error) throw error
  }
  const normalGoals = incomingGoals.filter(g => g !== generalInput).map((g, i) => ({ dreampot_id: pot.id, title: String(g.title || 'Spaardoel'), description: g.description || null, icon: g.icon || '🎯', target_amount: Math.max(1, Number(g.goal || 1)), current_amount: Math.max(0, Number(g.current || 0)), is_general: false, sort_order: i }))
  if (normalGoals.length) { const { error } = await supabase.from('savings_goals').insert(normalGoals); if (error) throw error }

  const { error: deleteWishError } = await supabase.from('wishlist_items').delete().eq('dreampot_id', pot.id)
  if (deleteWishError) throw deleteWishError
  const wishes = (Array.isArray(state.wishes) ? state.wishes : []).map((w, i) => ({ dreampot_id: pot.id, title: String(w.title || 'Cadeau'), description: w.note || null, price: Math.max(0, Number(w.price || 0)), product_url: w.link || null, image_url: w.image || null, claimed: Boolean(w.claimed), claimed_at: w.claimed ? new Date().toISOString() : null, sort_order: i }))
  if (wishes.length) { const { error } = await supabase.from('wishlist_items').insert(wishes); if (error) throw error }

  const keep = new Set((state.transactions || []).map(t => t.id).filter(Boolean))
  const { data: existingContributions, error: cError } = await supabase.from('contributions').select('id').eq('dreampot_id', pot.id)
  if (cError) throw cError
  const remove = (existingContributions || []).map(c => c.id).filter(id => !keep.has(id))
  if (remove.length) { const { error } = await supabase.from('contributions').delete().in('id', remove); if (error) throw error }
  return { ok: true }
}

async function addContribution(supabase, slug, body) {
  const { data: pot, error: potError } = await supabase.from('dreampots').select('id,is_public').eq('slug', slug).eq('is_public', true).maybeSingle()
  if (potError) throw potError
  if (!pot) return { error: 'Droompot not found', status: 404 }
  const { data: goals, error: goalError } = await supabase.from('savings_goals').select('id,title').eq('dreampot_id', pot.id)
  if (goalError) throw goalError
  const goal = (goals || []).find(g => g.title === body.goal) || (goals || [])[0]
  if (!goal) return { error: 'Spaardoel not found', status: 400 }
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) return { error: 'Invalid amount', status: 400 }
  const photo = typeof body.photo === 'string' && body.photo.startsWith('data:image/') ? body.photo.slice(0, 250000) : null
  const { error } = await supabase.rpc('add_public_contribution', {
    target_dreampot: pot.id,
    target_goal: goal.id,
    p_giver_name: String(body.name || 'Anoniem').slice(0, 80),
    p_amount: amount,
    p_message: String(body.message || '').slice(0, 280),
    p_method: body.cash ? 'cash' : 'digital',
    p_photo_path: photo,
  })
  if (error) throw error
  return { ok: true }
}

export default async (req) => {
  try {
    const slug = new URL(req.url).searchParams.get('slug') || ''
    if (!slug) return json({ data: null })
    const supabase = client(req)
    if (req.method === 'GET') return json({ data: await readState(supabase, slug) })
    if (req.method === 'PUT') {
      if (!req.headers.get('authorization')) return json({ error: 'Login required' }, 401)
      const result = await writeState(supabase, slug, await req.json())
      return result.error ? json({ error: result.error }, result.status) : json(result)
    }
    if (req.method === 'POST') {
      const result = await addContribution(supabase, slug, await req.json())
      return result.error ? json({ error: result.error }, result.status) : json(result)
    }
    return json({ error: 'Method not allowed' }, 405)
  } catch (error) {
    console.error('dream-data error', error)
    return json({ error: error?.message || 'Unexpected error' }, 500)
  }
}
