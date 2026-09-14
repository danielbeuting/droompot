function decodeHtml(v=""){
  return String(v??"")
    .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&nbsp;/gi," ")
    .replace(/\\u002F/gi,"/").replace(/\\u0026/gi,"&").replace(/\\\//g,"/");
}
function clean(v=""){return decodeHtml(v).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
function absoluteUrl(value,base){
  const v=clean(value); if(!v)return "";
  try{return new URL(v,base).href}catch{return ""}
}
function parsePrice(value){
  const s=clean(value).replace(/\.(?=\d{3}(?:\D|$))/g,"");
  const m=s.match(/(?:€|EUR|\$|USD|£|GBP)?\s*([0-9]{1,7}(?:[.,][0-9]{1,2})?)/i);
  if(!m)return "";
  let x=m[1].replace(",","."); const n=Number(x);
  return Number.isFinite(n)&&n>0?n.toFixed(2):"";
}
function meta(html,key){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  for(const p of [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,"i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["']`,"i")
  ]){const m=html.match(p);if(m?.[1])return clean(m[1]);}
  return "";
}
function walk(x,out=[]){
  if(Array.isArray(x))x.forEach(v=>walk(v,out));
  else if(x&&typeof x==="object"){out.push(x);Object.values(x).forEach(v=>walk(v,out));}
  return out;
}
function extractOfferPrice(offers){
  const list=Array.isArray(offers)?offers:[offers];
  for(const o of list){
    if(!o)continue;
    for(const candidate of [o.price,o.lowPrice,o.highPrice,o?.priceSpecification?.price,o?.priceSpecification?.minPrice]){
      const p=parsePrice(candidate); if(p)return p;
    }
  }
  return "";
}
function ldProduct(html,base){
  for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)){
    let raw=m[1].trim().replace(/^<!--|-->$/g,"").replace(/;$/," ").trim();
    try{
      const parsed=JSON.parse(raw);
      for(const o of walk(parsed)){
        const types=(Array.isArray(o?.["@type"])?o["@type"]:[o?.["@type"]]).map(v=>String(v||"").toLowerCase());
        if(!types.includes("product"))continue;
        let image=o.image;
        if(Array.isArray(image))image=image[0];
        if(image&&typeof image==="object")image=image.url||image.contentUrl||image.thumbnailUrl||"";
        return {title:clean(o.name),image:absoluteUrl(image,base),price:extractOfferPrice(o.offers)};
      }
    }catch{}
  }
  return {};
}
function openGraph(html,base){
  const title=meta(html,"og:title")||meta(html,"twitter:title")||clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const image=absoluteUrl(meta(html,"og:image")||meta(html,"og:image:secure_url")||meta(html,"twitter:image"),base);
  const price=parsePrice(meta(html,"product:price:amount")||meta(html,"og:price:amount")||meta(html,"price")||meta(html,"product:price"));
  return {title,image,price};
}
function embedded(html,base){
  const titlePatterns=[/"productName"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i,/"displayName"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i,/"name"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i];
  const pricePatterns=[/"sellingPrice"\s*:\s*(?:"|)([0-9]+(?:[.,][0-9]{1,2})?)/i,/"salesPrice"\s*:\s*(?:"|)([0-9]+(?:[.,][0-9]{1,2})?)/i,/"price"\s*:\s*(?:"|)([0-9]+(?:[.,][0-9]{1,2})?)/i];
  const imagePatterns=[/"imageUrl"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+(?:\\.[^"\\]*)*)"/i,/"primaryImage"\s*:\s*"(https?:\\?\/\\?\/[^"\\]+(?:\\.[^"\\]*)*)"/i];
  let title="",price="",image="";
  for(const p of titlePatterns){const m=html.match(p);if(m){title=clean(m[1]);if(title.length>2)break;}}
  for(const p of pricePatterns){const m=html.match(p);if(m){price=parsePrice(m[1]);if(price)break;}}
  for(const p of imagePatterns){const m=html.match(p);if(m){image=absoluteUrl(decodeHtml(m[1]),base);if(image)break;}}
  return {title,price,image};
}
function visiblePrice(html){
  const text=clean(html.slice(0,1500000));
  for(const p of [/€\s*([0-9]{1,6}(?:[.,][0-9]{1,2})?)/i,/([0-9]{1,6}(?:[.,][0-9]{2}))\s*(?:€|EUR)/i]){
    const m=text.match(p);if(m){const n=parsePrice(m[1]);if(n)return n;}
  }
  return "";
}
function merge(...items){
  const out={title:"",price:"",image:""};
  for(const item of items){if(!item)continue;for(const k of Object.keys(out))if(!out[k]&&item[k])out[k]=item[k];}
  return out;
}
function safeTarget(raw){
  const u=new URL(raw);
  if(!/^https?:$/.test(u.protocol))throw new Error("Alleen http(s)-links zijn toegestaan");
  const h=u.hostname.toLowerCase();
  if(h==="localhost"||h.endsWith(".local")||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h))throw new Error("Deze link is niet toegestaan");
  return u.href;
}
async function fetchWithTimeout(url,headers={},ms=12000){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),ms);
  try{return await fetch(url,{redirect:"follow",signal:controller.signal,headers});}finally{clearTimeout(timer);}
}
async function directPage(url){
  const headers={
    "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language":"nl-NL,nl;q=0.9,en;q=0.7",
    "Cache-Control":"no-cache",
    "Pragma":"no-cache"
  };
  const r=await fetchWithTimeout(url,headers);
  if(!r.ok)throw new Error(`winkel gaf HTTP ${r.status}`);
  const type=r.headers.get("content-type")||"";
  if(!type.includes("text/html")&&!type.includes("application/xhtml"))throw new Error("link is geen productpagina");
  return {html:(await r.text()).slice(0,3000000),url:r.url};
}
async function readerFallback(url){
  const readerUrl=`https://r.jina.ai/${url}`;
  const r=await fetchWithTimeout(readerUrl,{"Accept":"text/plain","User-Agent":"Droompot/1.7"},15000);
  if(!r.ok)throw new Error(`reader HTTP ${r.status}`);
  const text=(await r.text()).slice(0,1500000);
  const title=clean(text.match(/^Title:\s*(.+)$/mi)?.[1]||text.match(/^#\s+(.+)$/m)?.[1]||"");
  const img=text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/i)?.[1]||"";
  let p="";
  for(const re of [/€\s*([0-9]{1,6}(?:[.,][0-9]{1,2})?)/i,/([0-9]{1,6}(?:[.,][0-9]{2}))\s*(?:€|EUR)/i]){const m=text.match(re);if(m){p=parsePrice(m[1]);if(p)break;}}
  return {title,price:p,image:img};
}
async function microlinkFallback(url){
  const endpoint=`https://api.microlink.io/?url=${encodeURIComponent(url)}`;
  const r=await fetchWithTimeout(endpoint,{"Accept":"application/json","User-Agent":"Droompot/1.7"},12000);
  if(!r.ok)throw new Error(`metadata HTTP ${r.status}`);
  const j=await r.json();const d=j?.data||{};
  return {title:clean(d.title||""),image:clean(d.image?.url||d.logo?.url||""),price:parsePrice(d.price||"")};
}
export default async(req)=>{
  if(req.method!=="GET")return Response.json({error:"Method not allowed"},{status:405});
  const raw=new URL(req.url).searchParams.get("url");
  if(!raw)return Response.json({error:"Plak eerst een productlink."},{status:400});
  let target;
  try{target=safeTarget(raw)}catch(e){return Response.json({error:e.message||"Ongeldige productlink."},{status:400});}
  let data={title:"",price:"",image:""},domain="",source="direct",errors=[];
  try{
    const page=await directPage(target);domain=new URL(page.url).hostname.toLowerCase();
    data=merge(ldProduct(page.html,page.url),openGraph(page.html,page.url),embedded(page.html,page.url),{price:visiblePrice(page.html)});
  }catch(e){errors.push(e?.message||String(e));}
  if(!data.title||!data.image||!data.price){
    try{data=merge(data,await readerFallback(target));source=source==="direct"?"direct+reader":"reader";}catch(e){errors.push(e?.message||String(e));}
  }
  if(!data.title||!data.image){
    try{data=merge(data,await microlinkFallback(target));source+="+metadata";}catch(e){errors.push(e?.message||String(e));}
  }
  try{if(!domain)domain=new URL(target).hostname.toLowerCase();}catch{}
  if(!data.title&&!data.image&&!data.price)return Response.json({error:"Deze winkel blokkeert automatisch ophalen. Vul naam, prijs en foto handmatig in.",details:errors.slice(0,3)},{status:422});
  return Response.json({...data,source,domain,partial:!(data.title&&data.image&&data.price)});
};
