import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { mediaUrl, supabase } from './lib/supabase.js'
import pig from '../droompot-pig.png'

const THEMES = [
  ['green','Groen','#72c99b','#eaf8f0'],['blue','Blauw','#6aa9ff','#edf4ff'],['pink','Roze','#f39ac2','#fff0f6'],
  ['yellow','Geel','#f1c64a','#fff8da'],['purple','Paars','#9c78f0','#f3eeff'],['beige','Beige','#bda688','#f6f0e8']
]
const EMOJIS = ['🎯','🚲','🚗','🎓','⚽','🧸','🎮','🎵','✈️','🏕️','🐴','🐶','📚','💻','🎨','🎁','⭐','💛','🏠','🌈']
const money = value => new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(Number(value||0)).replace(',00','')

function Topbar({back='/app'}){
  const nav=useNavigate()
  return <header className="topbar simple"><button className="icon-btn" onClick={()=>nav(back)}>←</button><div className="top-title">Instellingen</div><div className="spacer"/></header>
}
function Primary({children,...props}){return <button className="primary-btn" {...props}>{children}</button>}

export default function ManageV2(){
  const { id }=useParams(); const nav=useNavigate()
  const [session,setSession]=useState(undefined); const [pot,setPot]=useState(undefined); const [goals,setGoals]=useState([]); const [wishes,setWishes]=useState([]); const [contributions,setContributions]=useState([]); const [tab,setTab]=useState('profile'); const [toast,setToast]=useState('')
  useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session))},[])
  async function load(){
    const [{data:p},{data:g},{data:w},{data:c}]=await Promise.all([
      supabase.from('dreampots').select('*').eq('id',id).single(),
      supabase.from('savings_goals').select('*').eq('dreampot_id',id).order('sort_order'),
      supabase.from('wishlist_items').select('*').eq('dreampot_id',id).order('sort_order'),
      supabase.from('contributions').select('*').eq('dreampot_id',id).order('created_at',{ascending:false})
    ])
    setPot(p||null); setGoals((g||[]).sort((a,b)=>Number(a.is_general)-Number(b.is_general)||a.sort_order-b.sort_order)); setWishes(w||[]); setContributions(c||[])
  }
  useEffect(()=>{if(session)load()},[session,id])
  useEffect(()=>{if(pot?.theme)document.documentElement.dataset.theme=pot.theme},[pot?.theme])
  const saved=(msg='Opgeslagen ✓')=>{setToast(msg);load();setTimeout(()=>setToast(''),1800)}
  if(session===undefined||pot===undefined)return <main className="app-shell"><section className="screen active"><div className="placeholder-wrap">Beheer laden…</div></section></main>
  if(!session)return <Navigate to="/login"/>
  if(!pot)return <Navigate to="/app"/>
  return <main className="app-shell"><section className="screen active"><Topbar/>
    <div className="settings-profile-mini"><div className="avatar" style={pot.photo_path?{backgroundImage:`url(${mediaUrl(pot.photo_path)})`}:undefined}>{pot.photo_path?'':pot.child_name?.[0]}</div><div><p className="mini-label">Droompot van</p><h2>{pot.child_name}</h2></div><button className="icon-btn" onClick={()=>window.location.assign(`/p/${pot.slug}?view=dream`)}>↗</button></div>
    <div className="settings-nav v2-settings-nav">{[['profile','Profiel'],['style','Stijl'],['goals','Spaardoelen'],['wishlist','Verlanglijstje'],['contributions','Bijdragen']].map(([k,l])=><button key={k} className={`settings-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>)}</div>
    {tab==='profile'&&<Profile pot={pot} session={session} saved={saved}/>} {tab==='style'&&<Style pot={pot} saved={saved}/>} {tab==='goals'&&<Goals pot={pot} goals={goals} saved={saved}/>} {tab==='wishlist'&&<Wishlist pot={pot} wishes={wishes} saved={saved}/>} {tab==='contributions'&&<Contributions items={contributions} saved={saved}/>} 
    <button className="secondary-btn" onClick={()=>window.location.assign(`/p/${pot.slug}?view=dream`)}>Bekijk publieke Droompot</button>
    {toast&&<div className="toast show">{toast}</div>}
  </section></main>
}

function Profile({pot,session,saved}){
  const [form,setForm]=useState({child_name:pot.child_name,birth_date:pot.birth_date||'',bank_details:pot.bank_details||''}); const [file,setFile]=useState(null); const [preview,setPreview]=useState(pot.photo_path?mediaUrl(pot.photo_path):''); const input=useRef()
  useEffect(()=>()=>{if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview])
  async function save(e){e.preventDefault();let photo=pot.photo_path
    if(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase(); const path=`${session.user.id}/${pot.id}/profile-${Date.now()}.${ext}`; const up=await supabase.storage.from('dreampot-media').upload(path,file,{contentType:file.type}); if(!up.error)photo=path}
    const {error}=await supabase.from('dreampots').update({child_name:form.child_name.trim(),birth_date:form.birth_date||null,bank_details:form.bank_details.trim()||null,photo_path:photo}).eq('id',pot.id); if(!error)saved()
  }
  function choose(e){const f=e.target.files?.[0]||null;setFile(f);if(f)setPreview(URL.createObjectURL(f))}
  return <form onSubmit={save}><div className="settings-block"><p className="eyebrow dark">Profiel</p><h2>{pot.child_name}'s Droompot</h2>
    <div className="profile-photo-edit"><div className="profile-photo-circle">{preview?<img src={preview} alt="Profielfoto"/>:<span>{pot.child_name?.[0]||'?'}</span>}</div><div><button type="button" className="secondary-btn compact-upload" onClick={()=>input.current?.click()}>Foto uploaden</button><small>JPG, PNG of WebP</small></div><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}/></div>
    <label className="field-label">Naam kind</label><input className="text-input" value={form.child_name} onChange={e=>setForm({...form,child_name:e.target.value})}/><label className="field-label">Geboortedatum</label><input className="text-input" type="date" value={form.birth_date} onChange={e=>setForm({...form,birth_date:e.target.value})}/><label className="field-label">Bankgegevens</label><textarea className="text-input textarea" placeholder="Bijv. NL00 BANK 0123 4567 89 t.n.v. ..." value={form.bank_details} onChange={e=>setForm({...form,bank_details:e.target.value})}/><p className="field-help">Deze gegevens zijn alleen zichtbaar in de ouderomgeving en worden niet op de publieke Droompot getoond.</p></div><Primary>Opslaan</Primary></form>
}

function Style({pot,saved}){
  const [theme,setTheme]=useState(pot.theme||'green')
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme])
  async function save(){const {error}=await supabase.from('dreampots').update({theme}).eq('id',pot.id);if(!error)saved()}
  return <><div className="settings-block"><p className="eyebrow dark">Stijl</p><h2>Kies de sfeer</h2><p className="field-help top-help">Tik op een stijl om hem direct te bekijken.</p><div className="theme-grid polished-theme-grid">{THEMES.map(([k,label,a,b])=><button type="button" key={k} className={`theme-card polished-theme ${theme===k?'selected':''}`} onClick={()=>setTheme(k)}><span className="theme-preview" style={{background:`linear-gradient(135deg,${a},${b})`}}><i style={{background:a}}/><b style={{background:b}}/></span><strong>{label}</strong>{theme===k&&<em>Geselecteerd ✓</em>}</button>)}</div></div><Primary onClick={save}>Stijl opslaan</Primary></>
}

function EmojiPicker({value,onChange}){const [open,setOpen]=useState(false);return <div className="emoji-picker"><button type="button" className="emoji-trigger" onClick={()=>setOpen(!open)}>{value||'🎯'}</button>{open&&<div className="emoji-popover">{EMOJIS.map(e=><button type="button" key={e} onClick={()=>{onChange(e);setOpen(false)}}>{e}</button>)}</div>}</div>}

function Goals({pot,goals,saved}){
  const ordered=useMemo(()=>[...goals].sort((a,b)=>Number(a.is_general)-Number(b.is_general)||a.sort_order-b.sort_order),[goals]); const [form,setForm]=useState({title:'',icon:'🎯',description:'',current:'0',target:'100'})
  async function add(e){e.preventDefault();const normal=ordered.filter(g=>!g.is_general);const general=ordered.find(g=>g.is_general);const {error}=await supabase.from('savings_goals').insert({dreampot_id:pot.id,title:form.title.trim(),icon:form.icon||'🎯',description:form.description.trim()||null,current_amount:Math.max(0,Number(form.current||0)),target_amount:Math.max(1,Number(form.target||1)),is_general:false,sort_order:normal.length});if(!error&&general)await supabase.from('savings_goals').update({sort_order:normal.length+1}).eq('id',general.id);if(!error){setForm({title:'',icon:'🎯',description:'',current:'0',target:'100'});saved('Spaardoel toegevoegd ✓')}}
  async function remove(id){if(!confirm('Spaardoel verwijderen?'))return;const {error}=await supabase.from('savings_goals').delete().eq('id',id);if(!error)saved('Spaardoel verwijderd ✓')}
  return <><div className="settings-block"><p className="eyebrow dark">Spaardoelen</p><h2>Beheer de dromen</h2>{ordered.map(g=><div className={`settings-goal-card ${g.is_general?'general-last':''}`} key={g.id}><div className="settings-goal-head"><span>{g.icon||'🎯'}</span><div><strong>{g.title}</strong><small>{g.is_general?'Vaste spaarrekening · altijd als laatste':`${money(g.current_amount)} van ${money(g.target_amount)}`}</small></div>{!g.is_general&&<button className="delete-mini" onClick={()=>remove(g.id)}>×</button>}</div>{g.description&&<p>{g.description}</p>}</div>)}</div>
    <form className="settings-block" onSubmit={add}><p className="eyebrow dark">Nieuw spaardoel</p><h2>Voeg een droom toe</h2><div className="goal-name-row"><EmojiPicker value={form.icon} onChange={icon=>setForm({...form,icon})}/><input className="text-input goal-title-input" required placeholder="Naam spaardoel" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div><label className="field-label">Korte beschrijving <span className="optional">(optioneel)</span></label><input className="text-input" maxLength="90" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><div className="two-money-fields"><div><label className="field-label">Huidige stand</label><input className="text-input" type="number" min="0" step="0.01" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></div><div><label className="field-label">Spaardoel</label><input className="text-input" required type="number" min="1" step="0.01" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></div></div><Primary>Toevoegen</Primary></form></>
}

function Wishlist({pot,wishes,saved}){
  const [form,setForm]=useState({url:'',title:'',price:'',image:''});const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  async function fetchProduct(){if(!form.url)return;setBusy(true);setError('');try{const r=await fetch(`/.netlify/functions/product-meta?url=${encodeURIComponent(form.url)}`);const d=await r.json();if(!r.ok)throw new Error(d.error||'Productgegevens niet gevonden');setForm(f=>({...f,title:d.title||f.title,price:d.price??f.price,image:d.image||f.image}))}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function add(e){e.preventDefault();const {error}=await supabase.from('wishlist_items').insert({dreampot_id:pot.id,title:form.title.trim(),product_url:form.url||null,price:form.price?Number(form.price):null,image_url:form.image||null,sort_order:wishes.length});if(!error){setForm({url:'',title:'',price:'',image:''});saved('Cadeau toegevoegd ✓')}}
  async function remove(id){if(!confirm('Cadeau verwijderen?'))return;const {error}=await supabase.from('wishlist_items').delete().eq('id',id);if(!error)saved('Cadeau verwijderd ✓')}
  return <><div className="settings-block"><p className="eyebrow dark">Verlanglijstje</p><h2>Cadeaus</h2>{wishes.map(w=><div className="wishlist-admin-item" key={w.id}>{w.image_url?<img src={w.image_url} alt=""/>:<img src={pig} alt=""/>}<div><strong>{w.title}</strong><small>{w.price?money(w.price):'Geen prijs'}{w.claimed?' · afgevinkt':''}</small></div><button className="delete-mini" onClick={()=>remove(w.id)}>×</button></div>)}</div>
    <form className="settings-block" onSubmit={add}><p className="eyebrow dark">Nieuw cadeau</p><h2>Product toevoegen</h2><label className="field-label">Productlink</label><input className="text-input" required type="url" placeholder="https://..." value={form.url} onChange={e=>setForm({...form,url:e.target.value})}/><button type="button" className="secondary-btn product-fetch-btn" disabled={busy||!form.url} onClick={fetchProduct}>{busy?'Product ophalen…':'Productgegevens ophalen'}</button>{error&&<p className="product-error">{error}</p>}{form.image&&<div className="product-preview"><img src={form.image} alt="Product"/></div>}<label className="field-label">Naam product</label><input className="text-input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><label className="field-label">Prijs</label><input className="text-input" type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/><label className="field-label">Afbeeldingslink</label><input className="text-input" type="url" value={form.image} onChange={e=>setForm({...form,image:e.target.value})}/><Primary>Toevoegen</Primary></form></>
}

function Contributions({items,saved}){async function remove(id){if(!confirm('Bijdrage verwijderen?'))return;const {error}=await supabase.from('contributions').delete().eq('id',id);if(!error)saved('Bijdrage verwijderd ✓')}
  return <div className="settings-block"><p className="eyebrow dark">Bijdragen</p><h2>Recente bijdragen</h2>{items.length?items.map(c=><div className="contribution-admin rich-contribution" key={c.id}>{c.photo_path?<div className="transaction-avatar has-photo" style={{backgroundImage:`url(${mediaUrl(c.photo_path)})`}}/>:<div className="transaction-avatar">{c.giver_name?.[0]?.toUpperCase()||'?'}</div>}<div><strong>{c.giver_name||'Anoniem'}</strong><small>{money(c.amount)} · {c.method==='cash'?'contant':'digitaal'}</small><p>{c.message||'Geen bericht toegevoegd.'}</p></div><button className="delete-mini" onClick={()=>remove(c.id)}>×</button></div>):<p className="tiny-left">Nog geen bijdragen.</p>}</div>}
