function decodeHtml(v=""){return String(v??"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function clean(v=""){return decodeHtml(v).replace(/\s+/g," ").trim();}
function safeTitle(v=""){const words=clean(v).replace(/\s*\|\s*[^|]+$/,'').split(/\s+/).filter(Boolean);return words.slice(0,8).join(' ');}
function meta(html,key){for(const rx of [new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]+content=["']([^"']+)["']`,`i`),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${key}["']`,`i`)]){const m=html.match(rx);if(m?.[1])return clean(m[1]);}return "";}
function numberPrice(v){const m=clean(v).match(/([0-9]{1,7}(?:[.,][0-9]{1,2})?)/);if(!m)return "";const n=Number(m[1].replace(',','.'));return Number.isFinite(n)?n.toFixed(2):"";}
function walk(x,out=[]){if(Array.isArray(x))x.forEach(v=>walk(v,out));else if(x&&typeof x==='object'){out.push(x);Object.values(x).forEach(v=>walk(v,out));}return out;}
function ldProduct(html){for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const parsed=JSON.parse(m[1]);for(const o of walk(parsed)){const types=Array.isArray(o?.['@type'])?o['@type']:[o?.['@type']];if(types.some(t=>String(t).toLowerCase()==='product')){let image=o.image;if(Array.isArray(image))image=image[0];if(image&&typeof image==='object')image=image.url||image.contentUrl||'';const offers=Array.isArray(o.offers)?o.offers[0]:o.offers;return {title:safeTitle(o.name||''),image:clean(image||''),price:numberPrice(offers?.price||offers?.lowPrice||'')};}}}catch{}}return {};}
async function fetchText(url,timeout=9000){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'User-Agent':'Mozilla/5.0','Accept-Language':'nl-NL,nl;q=0.9,en;q=0.8'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {text:await r.text(),url:r.url};}finally{clearTimeout(t);}}
function titleFromBolUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||'';return safeTitle(decodeURIComponent(slug).replace(/[-_]+/g,' '));}catch{return ''}}
function productCodeFromBolUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||'';const nums=[...slug.matchAll(/(?:^|[-_])(\d{4,6})(?=$|[-_])/g)].map(m=>m[1]);return nums.at(-1)||'';}catch{return ''}}
function legoProductLink(html,code){const rx=new RegExp(`https?:\\/\\/www\\.lego\\.com\\/nl-nl\\/product\\/[^"'<> ]*${code}[^"'<> ]*`,'i');return clean(html.match(rx)?.[0]||'');}
async function bolFallback(url){const title=titleFromBolUrl(url);const code=productCodeFromBolUrl(url);let image='';
  if(/lego/i.test(title)&&code){try{const search=`https://www.lego.com/nl-nl/search?q=${encodeURIComponent(code)}`;const {text}=await fetchText(search);const productUrl=legoProductLink(text,code);if(productUrl){const {text:html}=await fetchText(productUrl);image=meta(html,'og:image')||meta(html,'twitter:image')||ldProduct(html).image||'';}}catch{}}
  return {title,price:'',image,manualPrice:true,productCode:code,source:image?'external-product-page':'url-only'};
}

export default async(req)=>{
  const raw=new URL(req.url).searchParams.get('url');
  if(!raw||!/^https?:\/\//i.test(raw))return Response.json({error:'Invalid URL'},{status:400});
  let u;try{u=new URL(raw);}catch{return Response.json({error:'Invalid URL'},{status:400});}
  if(u.hostname.toLowerCase().includes('bol.com'))return Response.json(await bolFallback(raw));

  try{
    const {text:html}=await fetchText(raw);
    const ld=ldProduct(html);
    const title=ld.title||safeTitle(meta(html,'og:title')||meta(html,'twitter:title')||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
    const image=ld.image||meta(html,'og:image')||meta(html,'twitter:image')||'';
    const price=ld.price||numberPrice(meta(html,'product:price:amount')||meta(html,'price')||'');
    if(!title&&!image&&!price)return Response.json({error:'Geen productgegevens gevonden'},{status:502});
    return Response.json({title,price,image,source:'direct'});
  }catch(e){return Response.json({error:e?.message||'Ophalen mislukt'},{status:502});}
};

export const config={path:'/api/product-metadata'};
