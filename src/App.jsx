import React, { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { mediaUrl, supabase } from './lib/supabase.js'
import pig from '../droompot-pig.png'

const THEMES = ['green', 'blue', 'pink', 'yellow', 'purple', 'beige']
const THEME_LABEL = { green: 'Groen', blue: 'Blauw', pink: 'Roze', yellow: 'Geel', purple: 'Paars', beige: 'Beige' }
const euro = (value) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
const money = (value) => euro(value).replace(',00', '')

function birthday(date) {
  if (!date) return ''
  const b = new Date(`${date}T12:00:00`)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age -= 1
  let next = new Date(now.getFullYear(), b.getMonth(), b.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (next < today) next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate())
  const days = Math.ceil((next - today) / 86400000)
  return `${Math.max(age, 0)} jaar · ${days === 0 ? 'vandaag jarig 🎈' : `over ${days} dagen jarig 🎈`}`
}

function useTheme(theme = 'green') {
  useEffect(() => {
    document.documentElement.dataset.theme = theme || 'green'
    return () => { document.documentElement.dataset.theme = 'green' }
  }, [theme])
}

function Brand() {
  return <div className="brand">
    <div className="brand-mark pig-brand-mark"><img src={pig} alt="Droompot" /></div>
    <div><div className="brand-name">Droompot</div><div className="brand-sub">kleine beetjes, grote dromen</div></div>
  </div>
}

function Topbar({ back, title, menu, settings }) {
  const nav = useNavigate()
  if (title) return <header className="topbar simple">
    <button className="icon-btn" onClick={() => back ? nav(back) : nav(-1)}>←</button>
    <div className="top-title">{title}</div><div className="spacer" />
  </header>
  return <header className="topbar"><Brand /><div className="header-actions">
    {settings && <button className="icon-btn" onClick={settings} aria-label="Instellingen">⚙</button>}
    {menu && <button className="icon-btn menu-btn" onClick={menu} aria-label="Menu">☰</button>}
  </div></header>
}

function Primary({ children, className = '', ...props }) {
  return <button className={`primary-btn ${className}`} {...props}>{children}</button>
}

export default function App() {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [])
  if (session === undefined) return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap"><img className="loading-pig" src={pig} alt="" /><h2>Droompot laden…</h2></div></section></main>
  return <Routes>
    <Route path="/" element={<Welcome session={session} />} />
    <Route path="/start" element={<Intro />} />
    <Route path="/signup" element={session ? <Navigate to="/app" /> : <Auth signup />} />
    <Route path="/login" element={session ? <Navigate to="/app" /> : <Auth />} />
    <Route path="/check-email" element={<CheckEmail />} />
    <Route path="/app" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
    <Route path="/app/:id" element={session ? <Manage session={session} /> : <Navigate to="/login" />} />
    <Route path="/p/:slug" element={<PublicPot />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
}

function Welcome({ session }) {
  useTheme('green')
  const nav = useNavigate()
  return <main className="app-shell"><section className="screen start-screen active"><div className="start-wrap v2-start">
    <div className="start-brand-pig"><img src={pig} alt="Droompot" /></div>
    <p className="eyebrow">Welkom bij Droompot</p>
    <h1>{session ? 'Wat wil je doen?' : 'Kleine beetjes, grote dromen'}</h1>
    <p className="start-copy">{session ? 'Ga naar jouw ouderomgeving of bekijk wat Droompot mogelijk maakt.' : 'De persoonlijke plek voor sparen, geldcadeaus en wensen rond jouw kind.'}</p>
    <div className="start-choice-grid">
      <button className="start-choice dream" onClick={() => nav(session ? '/app' : '/start')}>
        <span className="start-choice-icon pig-choice-icon"><img src={pig} alt="" /></span><span><strong>{session ? 'Mijn Droompotten' : 'Maak een Droompot'}</strong><small>{session ? 'Beheer je kinderen en hun dromen' : 'Maak gratis je ouderaccount'}</small></span><b>›</b>
      </button>
      <button className="start-choice wishlist" onClick={() => nav('/login')}><span className="start-choice-icon gift-choice-icon">🔒</span><span><strong>{session ? 'Account' : 'Ik heb al een account'}</strong><small>{session ? 'Je bent al ingelogd' : 'Log in bij de ouderomgeving'}</small></span><b>›</b></button>
    </div>
  </div></section></main>
}

function Intro() {
  useTheme('green')
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const slides = [
    ['✨', 'Alles op één plek', 'Spaardoelen, een spaarrekening en het verlanglijstje komen samen in één persoonlijke Droompot.'],
    ['🎯', 'Maak sparen zichtbaar', 'Familie en vrienden zien waar je kind voor droomt en kunnen gericht bijdragen.'],
    ['🎁', 'Geven wordt persoonlijker', 'Geld geven of een cadeau kiezen wordt overzichtelijk én leuk om te doen.'],
    ['👨‍👩‍👧‍👦', 'Eén account, meerdere Droompotten', 'Beheer straks alle kinderen vanuit dezelfde ouderomgeving.'],
  ]
  const s = slides[step]
  return <main className="app-shell"><section className="screen active"><Topbar back="/" title="Welkom" /><div className="onboarding-card">
    <div className="onboarding-art"><span>{s[0]}</span><img src={pig} alt="" /></div><p className="eyebrow">Stap {step + 1} van {slides.length}</p><h2>{s[1]}</h2><p>{s[2]}</p>
    <div className="goal-dots">{slides.map((_, i) => <i key={i} className={`goal-dot ${i === step ? 'active' : ''}`} />)}</div>
    <Primary onClick={() => step === slides.length - 1 ? nav('/signup') : setStep(step + 1)}>{step === slides.length - 1 ? 'Account aanmaken' : 'Verder'}</Primary>
    {step > 0 && <button className="secondary-btn" onClick={() => setStep(step - 1)}>Terug</button>}
  </div></section></main>
}

function Auth({ signup = false }) {
  useTheme('green')
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const result = signup
      ? await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { display_name: form.name.trim() }, emailRedirectTo: `${window.location.origin}/login` } })
      : await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
    setBusy(false)
    if (result.error) return setError(result.error.message)
    if (signup && !result.data.session) nav('/check-email')
  }
  return <main className="app-shell"><section className="screen active"><Topbar back="/" title={signup ? 'Account aanmaken' : 'Inloggen'} /><section className="settings-login-wrap v2-auth">
    <div className="settings-lock-icon">{signup ? '✨' : '🔒'}</div><p className="eyebrow">Ouderomgeving</p><h2>{signup ? 'Jouw Droompot-account' : 'Welkom terug'}</h2><p>{signup ? 'Maak een account om één of meerdere Droompotten te beheren.' : 'Log in om jouw Droompotten te beheren.'}</p>
    <form onSubmit={submit}>{signup && <><label className="field-label">Jouw naam</label><input className="text-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></>}
      <label className="field-label">E-mailadres</label><input className="text-input" required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <label className="field-label">Wachtwoord</label><input className="text-input" required minLength="8" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      {error && <div className="login-error show">{error}</div>}<Primary disabled={busy}>{busy ? 'Even geduld…' : signup ? 'Account aanmaken' : 'Inloggen'}</Primary>
    </form><p className="login-demo-note">{signup ? <>Heb je al een account? <Link to="/login">Log hier in</Link>.</> : <>Nog geen Droompot-account? <Link to="/start">Maak er één</Link>.</>}</p>
  </section></section></main>
}

function CheckEmail() {
  useTheme('green')
  return <main className="app-shell"><section className="screen active"><Topbar back="/login" title="Bevestig je e-mail" /><div className="placeholder-wrap"><div className="placeholder-icon">✉️</div><p className="eyebrow">Bijna klaar</p><h2>Check je mailbox</h2><p>Klik op de bevestigingslink in de e-mail van Droompot. Daarna kun je inloggen en je eerste Droompot maken.</p><Link className="primary-btn link-button" to="/login">Naar inloggen</Link></div></section></main>
}

function Dashboard({ session }) {
  useTheme('green')
  const [pots, setPots] = useState([])
  const [households, setHouseholds] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    const { data: memberships } = await supabase.from('household_members').select('household_id, households(id,name)').eq('user_id', session.user.id)
    const hs = (memberships || []).map(x => Array.isArray(x.households) ? x.households[0] : x.households).filter(Boolean)
    setHouseholds(hs)
    if (hs.length) {
      const { data } = await supabase.from('dreampots').select('*').in('household_id', hs.map(x => x.id)).order('created_at')
      setPots(data || [])
    } else setPots([])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  return <main className="app-shell"><section className="screen active"><Topbar menu={() => supabase.auth.signOut()} /><section className="dashboard-intro"><p className="eyebrow">Ouderomgeving</p><h1>Mijn Droompotten</h1><p>Beheer hier alle Droompotten van jouw gezin.</p></section>
    {loading ? <div className="placeholder-wrap compact-placeholder">Laden…</div> : pots.length ? <div className="dashboard-pots">{pots.map(p => <article className="dashboard-pot" key={p.id}><div className="dashboard-pot-avatar">{p.photo_path ? <img src={mediaUrl(p.photo_path)} alt="" /> : <img src={pig} alt="" />}</div><div><small>{birthday(p.birth_date) || 'Droompot'}</small><h2>{p.child_name}</h2><p>{p.intro_text || `Alles waar ${p.child_name} voor droomt en spaart.`}</p></div><div className="dashboard-pot-actions"><Link to={`/app/${p.id}`} className="primary-btn link-button">Beheren</Link><Link to={`/p/${p.slug}`} className="secondary-btn link-button">Bekijk Droompot</Link></div></article>)}</div> : <div className="settings-block empty-dashboard"><img src={pig} alt="" /><h2>Maak je eerste Droompot</h2><p>Daarna kun je spaardoelen en cadeaus toevoegen en hem delen met familie.</p></div>}
    <Primary onClick={() => setOpen(true)}>+ Nieuwe Droompot</Primary><button className="secondary-btn" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
    {open && <CreatePot session={session} households={households} close={() => setOpen(false)} done={() => { setOpen(false); load() }} />}
  </section></main>
}

function ThemePicker({ value, onChange }) {
  return <div className="settings-block"><p className="eyebrow dark">Kleurthema</p><h2>Kies je stijl</h2><div className="theme-grid v2-theme-grid">{THEMES.map(t => <button type="button" key={t} className={`theme-card ${value === t ? 'selected' : ''}`} onClick={() => onChange(t)}><span className={`theme-swatch ${t}`} />{THEME_LABEL[t]}</button>)}</div></div>
}

function CreatePot({ session, households, close, done }) {
  const [form, setForm] = useState({ name: '', birth: '', theme: 'green', household: 'Mijn gezin' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    const result = households.length
      ? await supabase.rpc('create_dreampot', { target_household: households[0].id, child_name: form.name.trim(), child_birth_date: form.birth || null, child_theme: form.theme })
      : await supabase.rpc('create_first_dreampot', { household_name: form.household.trim() || 'Mijn gezin', child_name: form.name.trim(), child_birth_date: form.birth || null, child_theme: form.theme })
    if (result.error) { setBusy(false); return setError(result.error.message) }
    const pot = Array.isArray(result.data) ? result.data[0] : result.data
    if (file && pot?.id) {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${session.user.id}/${pot.id}/profile-${Date.now()}.${ext}`
      const upload = await supabase.storage.from('dreampot-media').upload(path, file, { contentType: file.type })
      if (!upload.error) await supabase.from('dreampots').update({ photo_path: path }).eq('id', pot.id)
    }
    setBusy(false); done()
  }
  return <div className="v151-modal"><div className="v151-modal-card"><button className="icon-btn v151-close" onClick={close}>×</button><p className="eyebrow">Nieuwe Droompot</p><h2>Voor wie gaan we dromen?</h2><form onSubmit={submit}>{!households.length && <><label className="field-label">Naam gezin</label><input className="text-input" value={form.household} onChange={e => setForm({ ...form, household: e.target.value })} /></>}
    <label className="field-label">Naam kind</label><input className="text-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
    <label className="field-label">Geboortedatum</label><input className="text-input" type="date" value={form.birth} onChange={e => setForm({ ...form, birth: e.target.value })} />
    <label className="field-label">Profielfoto</label><input className="text-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] || null)} />
    <ThemePicker value={form.theme} onChange={theme => setForm({ ...form, theme })} />{error && <div className="login-error show">{error}</div>}<Primary disabled={busy}>{busy ? 'Droompot maken…' : 'Droompot aanmaken'}</Primary>
  </form></div></div>
}

function Manage({ session }) {
  const { id } = useParams(); const nav = useNavigate()
  const [pot, setPot] = useState(undefined); const [goals, setGoals] = useState([]); const [wishes, setWishes] = useState([]); const [contributions, setContributions] = useState([]); const [tab, setTab] = useState('profile'); const [toast, setToast] = useState('')
  async function load() {
    const [{ data: p }, { data: g }, { data: w }, { data: c }] = await Promise.all([
      supabase.from('dreampots').select('*').eq('id', id).single(),
      supabase.from('savings_goals').select('*').eq('dreampot_id', id).order('sort_order'),
      supabase.from('wishlist_items').select('*').eq('dreampot_id', id).order('sort_order'),
      supabase.from('contributions').select('*').eq('dreampot_id', id).order('created_at', { ascending: false }),
    ])
    setPot(p || null); setGoals(g || []); setWishes(w || []); setContributions(c || [])
  }
  useEffect(() => { load() }, [id]); useTheme(pot?.theme || 'green')
  function saved() { setToast('Opgeslagen ✓'); load(); setTimeout(() => setToast(''), 1800) }
  if (pot === undefined) return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap">Beheer laden…</div></section></main>
  if (!pot) return <Navigate to="/app" />
  return <main className="app-shell"><section className="screen active"><Topbar back="/app" title="Instellingen" />
    <div className="settings-profile-mini"><div className="avatar" style={pot.photo_path ? { backgroundImage: `url(${mediaUrl(pot.photo_path)})` } : undefined}>{pot.photo_path ? '' : pot.child_name?.[0]}</div><div><p className="mini-label">Droompot van</p><h2>{pot.child_name}</h2></div><button className="icon-btn" onClick={() => nav(`/p/${pot.slug}`)}>↗</button></div>
    <div className="settings-nav v2-settings-nav">{[['profile', 'Profiel'], ['style', 'Stijl'], ['goals', 'Spaardoelen'], ['wishlist', 'Verlanglijstje'], ['contributions', 'Bijdragen']].map(([key, label]) => <button key={key} className={`settings-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>)}</div>
    {tab === 'profile' && <ProfileEditor pot={pot} session={session} saved={saved} />}
    {tab === 'style' && <StyleEditor pot={pot} saved={saved} />}
    {tab === 'goals' && <GoalEditor pot={pot} goals={goals} saved={saved} />}
    {tab === 'wishlist' && <WishEditor pot={pot} wishes={wishes} saved={saved} />}
    {tab === 'contributions' && <ContributionEditor items={contributions} saved={saved} />}
    <button className="secondary-btn" onClick={() => nav(`/p/${pot.slug}`)}>Bekijk publieke Droompot</button>
    {toast && <div className="toast show">{toast}</div>}
  </section></main>
}

function ProfileEditor({ pot, session, saved }) {
  const [form, setForm] = useState({ child_name: pot.child_name, birth_date: pot.birth_date || '', intro_text: pot.intro_text || '', general_savings_description: pot.general_savings_description || '' })
  const [file, setFile] = useState(null)
  async function save(event) {
    event.preventDefault(); let photoPath = pot.photo_path
    if (file) { const ext = file.name.split('.').pop() || 'jpg'; const path = `${session.user.id}/${pot.id}/profile-${Date.now()}.${ext}`; const up = await supabase.storage.from('dreampot-media').upload(path, file, { contentType: file.type }); if (!up.error) photoPath = path }
    await supabase.from('dreampots').update({ child_name: form.child_name.trim(), birth_date: form.birth_date || null, intro_text: form.intro_text || null, general_savings_description: form.general_savings_description || 'Een potje voor later, zonder vast doel. Elke bijdrage groeit mee met de toekomst.', photo_path: photoPath }).eq('id', pot.id)
    const { data: general } = await supabase.from('savings_goals').select('id').eq('dreampot_id', pot.id).eq('is_general', true).maybeSingle()
    if (general) await supabase.from('savings_goals').update({ description: form.general_savings_description }).eq('id', general.id)
    saved()
  }
  return <form onSubmit={save}><div className="settings-block"><p className="eyebrow dark">Profiel</p><h2>{pot.child_name}'s Droompot</h2><label className="field-label">Naam kind</label><input className="text-input" value={form.child_name} onChange={e => setForm({ ...form, child_name: e.target.value })} /><label className="field-label">Geboortedatum</label><input className="text-input" type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /><label className="field-label">Profielfoto</label><input className="text-input" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} /><label className="field-label">Introductietekst</label><textarea className="text-input textarea" value={form.intro_text} onChange={e => setForm({ ...form, intro_text: e.target.value })} /><label className="field-label">Tekst algemene spaarrekening</label><textarea className="text-input textarea" value={form.general_savings_description} onChange={e => setForm({ ...form, general_savings_description: e.target.value })} /></div><Primary>Opslaan</Primary></form>
}

function StyleEditor({ pot, saved }) {
  const [theme, setTheme] = useState(pot.theme || 'green')
  async function save() { await supabase.from('dreampots').update({ theme }).eq('id', pot.id); saved() }
  return <><ThemePicker value={theme} onChange={setTheme} /><Primary onClick={save}>Opslaan</Primary></>
}

function GoalEditor({ pot, goals, saved }) {
  const [newGoal, setNewGoal] = useState({ title: '', icon: '🎯', description: '', target: '100' })
  async function add(event) { event.preventDefault(); await supabase.from('savings_goals').insert({ dreampot_id: pot.id, title: newGoal.title.trim(), icon: newGoal.icon || '🎯', description: newGoal.description || null, target_amount: Number(newGoal.target || 0), current_amount: 0, is_general: false, sort_order: Math.max(0, ...goals.map(g => g.sort_order || 0)) + 1 }); setNewGoal({ title: '', icon: '🎯', description: '', target: '100' }); saved() }
  async function remove(id) { if (!window.confirm('Spaardoel verwijderen?')) return; await supabase.from('savings_goals').delete().eq('id', id); saved() }
  return <><div className="settings-block"><p className="eyebrow dark">Spaardoelen</p><h2>Beheer de dromen</h2>{goals.map(g => <div className="settings-goal-card" key={g.id}><div className="settings-goal-head"><span>{g.icon || '🎯'}</span><div><strong>{g.title}</strong><small>{g.is_general ? 'Algemene spaarrekening' : `${money(g.current_amount)} van ${money(g.target_amount)}`}</small></div>{!g.is_general && <button className="delete-mini" onClick={() => remove(g.id)}>×</button>}</div>{g.description && <p>{g.description}</p>}</div>)}</div>
    <form className="settings-block" onSubmit={add}><p className="eyebrow dark">Nieuw spaardoel</p><h2>Voeg een droom toe</h2><div className="setting-goal-row"><input className="text-input" aria-label="Emoji" value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} /><input className="text-input" required placeholder="Bijv. Nieuwe fiets" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} /></div><label className="field-label">Beschrijving</label><textarea className="text-input" value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} /><label className="field-label">Doelbedrag</label><input className="text-input" type="number" min="1" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} /><Primary>Toevoegen</Primary></form></>
}

function WishEditor({ pot, wishes, saved }) {
  const [form, setForm] = useState({ title: '', url: '', price: '', image: '' })
  async function add(event) { event.preventDefault(); await supabase.from('wishlist_items').insert({ dreampot_id: pot.id, title: form.title.trim(), product_url: form.url || null, price: form.price ? Number(form.price) : null, image_url: form.image || null, sort_order: wishes.length }); setForm({ title: '', url: '', price: '', image: '' }); saved() }
  async function remove(id) { if (!window.confirm('Cadeau verwijderen?')) return; await supabase.from('wishlist_items').delete().eq('id', id); saved() }
  return <><div className="settings-block"><p className="eyebrow dark">Verlanglijstje</p><h2>Cadeaus</h2>{wishes.map(w => <div className="wishlist-admin-item" key={w.id}>{w.image_url ? <img src={w.image_url} alt="" /> : <img src={pig} alt="" />}<div><strong>{w.title}</strong><small>{w.price ? money(w.price) : 'Geen prijs'}{w.claimed ? ' · afgevinkt' : ''}</small></div><button className="delete-mini" onClick={() => remove(w.id)}>×</button></div>)}</div>
    <form className="settings-block" onSubmit={add}><p className="eyebrow dark">Nieuw cadeau</p><h2>Voeg iets toe</h2><label className="field-label">Naam</label><input className="text-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><label className="field-label">Productlink</label><input className="text-input" type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /><label className="field-label">Prijs</label><input className="text-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /><label className="field-label">Afbeeldingslink</label><input className="text-input" type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} /><Primary>Toevoegen</Primary></form></>
}

function ContributionEditor({ items, saved }) {
  async function remove(id) { if (!window.confirm('Bijdrage verwijderen?')) return; await supabase.from('contributions').delete().eq('id', id); saved() }
  return <div className="settings-block"><p className="eyebrow dark">Bijdragen</p><h2>Recente bijdragen</h2>{items.length ? items.map(c => <div className="contribution-admin" key={c.id}><div className="transaction-avatar">{c.giver_name?.[0]?.toUpperCase() || '?'}</div><div><strong>{c.giver_name}</strong><small>{money(c.amount)} · {c.method === 'cash' ? 'contant' : 'digitaal'}</small></div><button className="delete-mini" onClick={() => remove(c.id)}>×</button></div>) : <p className="tiny-left">Nog geen bijdragen.</p>}</div>
}

function PublicPot() {
  const { slug } = useParams(); const nav = useNavigate()
  const [pot, setPot] = useState(undefined); const [goals, setGoals] = useState([]); const [wishes, setWishes] = useState([]); const [contributions, setContributions] = useState([]); const [screen, setScreen] = useState('start'); const [menu, setMenu] = useState(false); const [selectedGoal, setSelectedGoal] = useState(null); const [amount, setAmount] = useState(20); const [mode, setMode] = useState('digital'); const [giver, setGiver] = useState({ name: '', message: '' }); const [info, setInfo] = useState(null)
  async function load() {
    const { data: p } = await supabase.from('dreampots').select('*').eq('slug', slug).eq('is_public', true).single()
    if (!p) { setPot(null); return }
    const [{ data: g }, { data: w }, { data: c }] = await Promise.all([
      supabase.from('savings_goals').select('*').eq('dreampot_id', p.id).order('sort_order'),
      supabase.from('wishlist_items').select('*').eq('dreampot_id', p.id).order('sort_order'),
      supabase.from('contributions').select('*').eq('dreampot_id', p.id).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(30),
    ])
    setPot(p); setGoals(g || []); setWishes(w || []); setContributions(c || []); setSelectedGoal((g || []).find(x => !x.is_general) || (g || [])[0] || null)
  }
  useEffect(() => { load() }, [slug]); useTheme(pot?.theme || 'green')
  if (pot === undefined) return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap">Droompot laden…</div></section></main>
  if (!pot) return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap"><div className="placeholder-icon">🐷</div><h2>Droompot niet gevonden</h2><button className="primary-btn" onClick={() => nav('/')}>Naar Droompot</button></div></section></main>
  const selected = selectedGoal || goals[0]
  async function submitContribution() {
    if (!giver.name.trim() || !amount || amount <= 0) return
    const { error } = await supabase.rpc('add_public_contribution', { target_dreampot: pot.id, target_goal: selected?.id || null, p_giver_name: giver.name.trim(), p_amount: Number(amount), p_message: giver.message.trim() || null, p_method: mode })
    if (!error) { await load(); setScreen('success') }
  }
  if (screen === 'start') return <PublicStart pot={pot} onDream={() => setScreen('home')} onWishlist={() => setScreen('wishlist')} />
  if (screen === 'wishlist') return <Wishlist pot={pot} wishes={wishes} back={() => setScreen('home')} reload={load} />
  if (screen === 'details') return <DonationDetails pot={pot} selected={selected} amount={amount} mode={mode} giver={giver} setGiver={setGiver} back={() => setScreen('home')} submit={submitContribution} />
  if (screen === 'success') return <Success pot={pot} selected={selected} amount={amount} back={() => { setScreen('home'); setGiver({ name: '', message: '' }) }} />
  if (info) return <InfoScreen title={info.title} icon={info.icon} back={() => setInfo(null)}>{info.body}</InfoScreen>
  return <main className="app-shell"><section className="screen active"><Topbar settings={() => nav('/login')} menu={() => setMenu(true)} />
    <section className="profile-strip"><div className="avatar-wrap"><div className="avatar" style={pot.photo_path ? { backgroundImage: `url(${mediaUrl(pot.photo_path)})` } : undefined}>{pot.photo_path ? '' : pot.child_name?.[0]}</div></div><div className="profile-main"><p className="mini-label">Droompot van</p><h1>{pot.child_name}</h1><p className="profile-copy">{pot.intro_text || `Hier vind je spaardoelen, de spaarrekening en alles waar ${pot.child_name} voor droomt en spaart.`}</p><div className="birthday-line">{birthday(pot.birth_date)}</div></div><div className="pop-star">✦</div></section>
    <button className="wishlist-cta" onClick={() => setScreen('wishlist')}><span>🎁</span><span><strong>Bekijk het verlanglijstje</strong><small>Of liever een cadeautje geven?</small></span><b>›</b></button>
    <section className="goals-area"><div className="goals-title-row"><div><p className="eyebrow">Waar droomt {pot.child_name} van?</p><h2>Swipe door de spaardoelen</h2></div><div className="swipe-hint">← swipe →</div></div><div className="goals-carousel">{goals.map(g => <GoalCard key={g.id} goal={g} onClick={() => setSelectedGoal(g)} selected={selected?.id === g.id} />)}</div><div className="goal-dots">{goals.map(g => <button key={g.id} className={`goal-dot ${selected?.id === g.id ? 'active' : ''}`} onClick={() => setSelectedGoal(g)} />)}</div></section>
    {selected && <section className="section give-section"><div className="selected-goal-callout selected-goal-dropdown"><div className="selected-goal-icon">{selected.icon || '🎯'}</div><div className="selected-goal-copy"><p>Je draagt nu bij aan</p><strong>{selected.title}</strong></div><span className="selected-goal-arrow">⌄</span><select className="selected-goal-select" value={selected.id} onChange={e => setSelectedGoal(goals.find(g => g.id === e.target.value))}>{goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></div>
      <div className="section-head give-heading"><div><p className="eyebrow dark">Geef iets voor {selected.title.toLowerCase()}</p><h2>Kies een bedrag</h2></div></div><div className="amount-grid">{[5, 10, 20, 25, 50].map(v => <button key={v} className={`amount-chip ${Number(amount) === v ? 'selected' : ''}`} onClick={() => setAmount(v)}>€ {v}</button>)}</div><label className="field-label">Of kies een eigen bedrag</label><div className="money-input-wrap"><span>€</span><input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} /></div><div className="donation-mode"><button className={`mode-card ${mode === 'digital' ? 'selected' : ''}`} onClick={() => setMode('digital')}><span className="mode-icon">↗</span><span><strong>Digitaal geven</strong><small>Pilotregistratie; echte betaling volgt later</small></span></button><button className={`mode-card ${mode === 'cash' ? 'selected' : ''}`} onClick={() => setMode('cash')}><span className="mode-icon">€</span><span><strong>Contant in de pot</strong><small>Registreer een contante bijdrage</small></span></button></div><Primary onClick={() => setScreen('details')}>Ik geef {money(amount)}</Primary></section>}
    <section className="section transaction-section"><div className="section-head"><div><p className="eyebrow dark">Samen sparen</p><h2>Recente bijdragen</h2></div></div><div className="transactions-list">{contributions.length ? contributions.slice(0, 8).map(c => <div className="transaction" key={c.id}><div className="transaction-avatar">{c.giver_name?.[0]?.toUpperCase() || '?'}</div><div><div className="transaction-name">{c.giver_name}{c.method === 'cash' && <span className="cash-tag">CONTANT</span>}</div><div className="transaction-message">{c.message || 'Droeg bij aan de Droompot ✨'}</div></div><div className="transaction-amount">{money(c.amount)}</div></div>) : <div className="empty-public">Nog geen bijdragen. Wie trapt af? ✨</div>}</div></section>
    <button className="share-strip" onClick={() => navigator.share ? navigator.share({ title: `${pot.child_name}'s Droompot`, url: window.location.href }) : navigator.clipboard?.writeText(window.location.href)}>↗ Deel {pot.child_name}'s Droompot</button>
    <SideMenu open={menu} close={() => setMenu(false)} showInfo={(x) => { setMenu(false); setInfo(x) }} pot={pot} wishlist={() => { setMenu(false); setScreen('wishlist') }} />
  </section></main>
}

function PublicStart({ pot, onDream, onWishlist }) {
  return <main className="app-shell"><section className="screen start-screen active"><div className="start-wrap"><div className="start-brand-pig"><img src={pig} alt="Droompot" /></div><p className="eyebrow">Welkom bij Droompot</p><h1>Wat wil je bekijken?</h1><p className="start-copy">Kies of je naar {pot.child_name}'s Droompot of naar het verlanglijstje wilt.</p><div className="start-choice-grid"><button className="start-choice dream" onClick={onDream}><span className="start-choice-icon pig-choice-icon"><img src={pig} alt="" /></span><span><strong>Ga naar Droompot</strong><small>Bekijk spaardoelen en draag bij</small></span><b>›</b></button><button className="start-choice wishlist" onClick={onWishlist}><span className="start-choice-icon gift-choice-icon">🎁</span><span><strong>Ga naar verlanglijstje</strong><small>Bekijk cadeaus en wensen</small></span><b>›</b></button></div></div></section></main>
}

function GoalCard({ goal, onClick, selected }) {
  const percentage = goal.target_amount ? Math.min(100, Math.round((Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100)) : 0
  if (goal.is_general) return <button className={`goal-card general-account ${selected ? 'selected-v2' : ''}`} onClick={onClick}><div><div className="goal-icon">{goal.icon || '💰'}</div><p className="goal-type">Spaarrekening</p><h3>{goal.title}</h3><p className="general-copy">{goal.description || 'Een potje voor later, zonder vast doel. Elke bijdrage groeit mee met de toekomst.'}</p></div><div className="general-badge">💛 Vrij sparen voor later</div></button>
  return <button className={`goal-card ${selected ? 'selected-v2' : ''}`} onClick={onClick}><div className="goal-icon">{goal.icon || '🎯'}</div><p className="goal-type">Spaardoel</p><h3>{goal.title}</h3>{goal.description && <p className="goal-description-v2">{goal.description}</p>}<div className="goal-money"><strong>{money(goal.current_amount)}</strong><span>van {money(goal.target_amount)}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div><div className="goal-remaining">Nog {money(Math.max(0, Number(goal.target_amount || 0) - Number(goal.current_amount || 0)))} te gaan</div></button>
}

function Wishlist({ pot, wishes, back, reload }) {
  async function toggle(item) { await supabase.rpc('set_wishlist_claimed', { target_item: item.id, new_claimed: !item.claimed }); reload() }
  return <main className="app-shell"><section className="screen active"><Topbar title="Verlanglijstje" /><div className="wishlist-hero"><div><p className="eyebrow">Verlanglijstje van</p><h2>{pot.child_name}</h2><p>Kies een cadeautje of ga terug naar de Droompot om bij te dragen aan een spaardoel.</p></div><span>🎁</span></div><button className="wishlist-back-dream" onClick={back}><img src={pig} alt="" /><span><strong>Ga naar Droompot</strong><small>Liever bijdragen aan een droom?</small></span><b>›</b></button><div className="wishlist-grid-v151">{wishes.length ? wishes.map(w => <article className={`wishlist-card-v151 ${w.claimed ? 'claimed' : ''}`} key={w.id}><div className="wishlist-image-v151">{w.image_url ? <img src={w.image_url} alt="" /> : <img className="pig-fallback" src={pig} alt="" />}</div><h3>{w.title}</h3>{w.price && <strong>{money(w.price)}</strong>}{w.product_url && <a href={w.product_url} target="_blank" rel="noreferrer" className="product-link-v151">Bekijk product ↗</a>}<button className={w.claimed ? 'secondary-btn' : 'primary-btn'} onClick={() => toggle(w)}>{w.claimed ? 'Toch weer vrijgeven' : 'Dit geef ik 🎁'}</button></article>) : <div className="settings-block"><p>Nog niets op het verlanglijstje.</p></div>}</div><button className="share-strip" onClick={() => navigator.share ? navigator.share({ title: `${pot.child_name}'s verlanglijstje`, url: window.location.href }) : navigator.clipboard?.writeText(window.location.href)}>↗ Deel verlanglijstje</button><button className="secondary-btn" onClick={back}>Terug naar Droompot</button></section></main>
}

function DonationDetails({ pot, selected, amount, mode, giver, setGiver, back, submit }) {
  return <main className="app-shell"><section className="screen active"><Topbar title="Jouw bijdrage" /><section className="section compact"><div className="payment-summary"><p>Je geeft</p><div className="payment-amount">{money(amount)}</div><p>{selected && <>voor <strong>{selected.title}</strong></>}</p></div><label className="field-label">Je naam</label><input className="text-input" placeholder="Bijv. Oma Els" value={giver.name} onChange={e => setGiver({ ...giver, name: e.target.value })} /><label className="field-label">Een berichtje <span className="optional">(optioneel)</span></label><textarea className="text-input textarea" placeholder="Veel plezier met je droom! ✨" value={giver.message} onChange={e => setGiver({ ...giver, message: e.target.value })} />{mode === 'digital' && <div className="demo-banner"><strong>PILOT</strong><span>Er wordt nu nog geen echte betaling uitgevoerd.</span></div>}<Primary disabled={!giver.name.trim()} onClick={submit}>{mode === 'cash' ? 'Contante bijdrage toevoegen' : `Bijdrage van ${money(amount)} toevoegen`}</Primary><button className="secondary-btn" onClick={back}>Terug</button><p className="tiny-note">In deze V2-pilot registreren we de bijdrage in de Droompot. De echte betaalprovider koppelen we later.</p></section></section></main>
}

function Success({ pot, selected, amount, back }) {
  return <main className="app-shell"><section className="screen active"><div className="success-wrap"><div className="success-icon">✓</div><p className="eyebrow">YES!</p><h2>{money(amount)} toegevoegd 🎉</h2><p>Je bijdrage staat nu in {pot.child_name}'s Droompot{selected ? ` bij “${selected.title}”` : ''}. Dankjewel!</p><div className="success-balance"><span>Samen bouwen aan dromen</span><strong>kleine beetjes, grote dromen ✨</strong></div><Primary onClick={back}>Bekijk de Droompot</Primary></div></section></main>
}

function InfoScreen({ title, icon, back, children }) {
  return <main className="app-shell"><section className="screen active"><header className="topbar simple"><button className="icon-btn" onClick={back}>←</button><div className="top-title">{title}</div><div className="spacer" /></header><div className="placeholder-wrap info-wrap"><div className="placeholder-icon">{icon}</div><h2>{title}</h2><div className="info-copy">{children}</div><button className="secondary-btn" onClick={back}>Terug</button></div></section></main>
}

function SideMenu({ open, close, showInfo, pot, wishlist }) {
  const infos = [
    { icon: '🎯', title: 'Spaardoelen', body: <><p>Een spaardoel maakt sparen zichtbaar en begrijpelijk. Geld opzij zetten en samen bouwen aan doelen waar je kind echt naar uitkijkt.</p></> },
    { icon: '💰', title: 'Spaarrekening', body: <><p>De algemene spaarrekening is bedoeld voor later, zonder vast doel. Zo kan familie ook bijdragen aan de toekomst van {pot.child_name}.</p></> },
    { icon: '🐷', title: 'Over Droompot', body: <><p>Droompot brengt sparen en geven samen rond een kind. Bewuster cadeaus geven, samen bouwen aan dromen en ouders één overzichtelijke plek geven.</p></> },
    { icon: '🔒', title: 'Waar gaat het geld heen?', body: <><p>Dit is momenteel een pilot. Bijdragen worden geregistreerd in de Droompot, maar er vindt nog geen echte financiële transactie plaats.</p></> },
  ]
  return <><div className={`menu-overlay ${open ? 'open' : ''}`} onClick={close} /><aside className={`side-menu ${open ? 'open' : ''}`}><div className="menu-head"><Brand /><button className="icon-btn" onClick={close}>×</button></div>{infos.slice(0, 2).map(i => <button className="nav-item" key={i.title} onClick={() => showInfo(i)}><span>{i.icon}</span>{i.title}<b>›</b></button>)}<button className="nav-item" onClick={wishlist}><span>🎁</span>Verlanglijstje<b>›</b></button><div className="nav-divider" />{infos.slice(2).map(i => <button className="nav-item" key={i.title} onClick={() => showInfo(i)}><span>{i.icon}</span>{i.title}<b>›</b></button>)}</aside></>
}
