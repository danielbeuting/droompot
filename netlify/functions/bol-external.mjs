function clean(s=""){return String(s||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();}
function shortTitle(s=""){return clean(s).split(/\s+/).filter(Boolean).slice(0,8).join(" ");}
function titleFromUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||"";return shortTitle(decodeURIComponent(slug).replace(/[-_]+/g,' '));}catch{return "";}}
function codeFromUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||"";const nums=[...slug.matchAll(/(?:^|[-_])(\d{4,6})(?=$|[-_])/g)].map(m=>m[1]);return nums.at(-1)||"";}catch{return "";}}
function decodeEscapedUrl(s=""){return clean(s).replace(/\\u003d/gi,'=').replace(/\\u0026/gi,'&').replace(/\\u002f/gi,'/').replace(/\\\//g,'/');}
function validImageUrl(u=""){return /^https?:\/\//i.test(u)&&!/(googleusercontent\.com\/images\/branding|gstatic\.com|google\.com\/images|bing\.com\/th\?|favicon|logo|sprite|icon|placeholder)/i.test(u)&&/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(u);}
async function fetchText(url,timeout=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{redirect:"follow",signal:c.signal,headers:{"User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1","Accept-Language":"nl-NL,nl;q=0.9,en;q=0.8"}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {text:await r.text(),url:r.url};}finally{clearTimeout(t);}}
function imageFromGoogleHtml(html=""){
  const candidates=[];
  for(const rx of [
    /["']ou["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/gi,
    /["'](https?:\\?\/\\?\/[^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi
  ]){
    for(const m of html.matchAll(rx)){
      const u=decodeEscapedUrl(m[1]);
      if(validImageUrl(u))candidates.push(u);
    }
  }
  return [...new Set(candidates)][0]||"";
}
function imageFromBingHtml(html=""){
  const candidates=[];
  for(const m of html.matchAll(/murl(?:&quot;|\")\s*:\s*(?:&quot;|\")([^"<]+?)(?:&quot;|\")/gi)){
    const u=decodeEscapedUrl(m[1].replace(/&amp;/g,'&'));
    if(validImageUrl(u))candidates.push(u);
  }
  return [...new Set(candidates)][0]||"";
}
async function searchImage(title,code){
  const query=clean(`${title} ${code}`);
  try{
    const google=`https://www.google.com/search?tbm=isch&hl=nl&q=${encodeURIComponent(query)}`;
    const {text}=await fetchText(google,7000);
    const found=imageFromGoogleHtml(text);
    if(found)return found;
  }catch{}
  try{
    const bing=`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`;
    const {text}=await fetchText(bing,7000);
    const found=imageFromBingHtml(text);
    if(found)return found;
  }catch{}
  return "";
}

export default async(req)=>{
  const raw=new URL(req.url).searchParams.get('url');
  if(!raw)return Response.json({error:'URL ontbreekt'},{status:400});
  let u;try{u=new URL(raw);}catch{return Response.json({error:'Ongeldige URL'},{status:400});}
  if(!u.hostname.toLowerCase().includes('bol.com'))return Response.json({error:'Alleen voor Bol-links'},{status:400});

  const title=titleFromUrl(raw);
  const code=codeFromUrl(raw);
  const image=await searchImage(title,code);

  return Response.json({title,price:"",image,manualPrice:true,productCode:code,imageSource:image?'search':'none'});
};

export const config={path:'/api/bol-external'};
