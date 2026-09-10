import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})
const privateIp=ip=>/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)||ip==='::1'||ip.startsWith('fc')||ip.startsWith('fd')||ip.startsWith('fe80:')
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim()
const meta=(html,key)=>{
  const patterns=[
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]+content=["']([^"']+)["'][^>]*>`,'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*>`,'i')
  ]
  for(const p of patterns){const m=html.match(p);if(m)return decode(m[1])}
  return ''
}

export default async req=>{
  try{
    const raw=new URL(req.url).searchParams.get('url')||''
    let target
    try{target=new URL(raw)}catch{return json({error:'Ongeldige productlink'},400)}
    if(!['https:','http:'].includes(target.protocol)||target.username||target.password)return json({error:'Ongeldige productlink'},400)
    if(target.hostname==='localhost'||target.hostname.endsWith('.local'))return json({error:'Deze link kan niet worden opgehaald'},400)
    if(isIP(target.hostname)){if(privateIp(target.hostname))return json({error:'Deze link kan niet worden opgehaald'},400)}else{
      const addresses=await lookup(target.hostname,{all:true}); if(!addresses.length||addresses.some(a=>privateIp(a.address)))return json({error:'Deze link kan niet worden opgehaald'},400)
    }
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000)
    const response=await fetch(target,{signal:controller.signal,redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; Droompot/2.0; +https://droompot.nl)','accept':'text/html,application/xhtml+xml'}});clearTimeout(timer)
    if(!response.ok)return json({error:'Productpagina kon niet worden geopend'},422)
    const type=response.headers.get('content-type')||'';if(!type.includes('text/html'))return json({error:'Geen productpagina gevonden'},422)
    const html=(await response.text()).slice(0,1200000)
    let title=meta(html,'og:title')||meta(html,'twitter:title')||decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]||'')
    let image=meta(html,'og:image')||meta(html,'twitter:image')||meta(html,'image')
    let price=meta(html,'product:price:amount')||meta(html,'og:price:amount')||meta(html,'price')
    for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
      try{const parsed=JSON.parse(m[1]);const all=Array.isArray(parsed)?parsed:[parsed];const walk=x=>{if(!x||typeof x!=='object')return null;if(String(x['@type']||'').toLowerCase()==='product')return x;for(const v of Object.values(x)){if(typeof v==='object'){const r=Array.isArray(v)?v.map(walk).find(Boolean):walk(v);if(r)return r}}return null};const p=all.map(walk).find(Boolean);if(p){title=title||p.name||'';image=image||(Array.isArray(p.image)?p.image[0]:p.image)||'';const offer=Array.isArray(p.offers)?p.offers[0]:p.offers;price=price||offer?.price||offer?.lowPrice||'';if(title&&image&&price)break}}catch{}
    }
    const numeric=String(price||'').replace(/[^0-9,.-]/g,'').replace(',','.');const parsedPrice=Number(numeric)
    if(image){try{image=new URL(image,response.url).href}catch{image=''}}
    if(!title&&!image&&!Number.isFinite(parsedPrice))return json({error:'Geen productgegevens gevonden. Je kunt de velden handmatig invullen.'},422)
    return json({title:title.slice(0,180),image,price:Number.isFinite(parsedPrice)?parsedPrice:null,source:response.url})
  }catch(error){return json({error:error?.name==='AbortError'?'Productpagina reageerde te langzaam':'Productgegevens konden niet worden opgehaald'},422)}
}
