function clean(s=""){return String(s||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();}
function shortTitle(s=""){return clean(s).split(/\s+/).filter(Boolean).slice(0,8).join(" ");}
function titleFromUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||"";return shortTitle(decodeURIComponent(slug).replace(/[-_]+/g,' '));}catch{return "";}}
function codeFromUrl(url){try{const parts=new URL(url).pathname.split('/').filter(Boolean);const i=parts.indexOf('p');const slug=(i>=0?parts[i+1]:parts.at(-2))||"";const nums=[...slug.matchAll(/(?:^|[-_])(\d{4,6})(?=$|[-_])/g)].map(m=>m[1]);return nums.at(-1)||"";}catch{return "";}}
function meta(html,key){for(const rx of [new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,`i`),new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,`i`)]){const m=html.match(rx);if(m?.[1])return clean(m[1]);}return "";}
async function fetchText(url,timeout=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{redirect:"follow",signal:c.signal,headers:{"User-Agent":"Mozilla/5.0","Accept-Language":"nl-NL,nl;q=0.9,en;q=0.8"}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {text:await r.text(),url:r.url};}finally{clearTimeout(t);}}
function productLinkFromSearch(html,code){const rx=new RegExp(`https?:\\/\\/www\\.lego\\.com\\/nl-nl\\/product\\/[^"'<> ]*${code}[^"'<> ]*`,'i');return clean(html.match(rx)?.[0]||"");}

export default async(req)=>{
  const raw=new URL(req.url).searchParams.get('url');
  if(!raw)return Response.json({error:'URL ontbreekt'},{status:400});
  let u;try{u=new URL(raw);}catch{return Response.json({error:'Ongeldige URL'},{status:400});}
  if(!u.hostname.toLowerCase().includes('bol.com'))return Response.json({error:'Alleen voor Bol-links'},{status:400});

  const title=titleFromUrl(raw);
  const code=codeFromUrl(raw);
  let image="";

  if(/lego/i.test(title)&&code){
    try{
      const searchUrl=`https://www.lego.com/nl-nl/search?q=${encodeURIComponent(code)}`;
      const {text}=await fetchText(searchUrl);
      const productUrl=productLinkFromSearch(text,code);
      if(productUrl){
        const {text:productHtml}=await fetchText(productUrl);
        image=meta(productHtml,'og:image')||meta(productHtml,'twitter:image');
      }
    }catch{}
  }

  return Response.json({title,price:"",image,manualPrice:true,productCode:code});
};

export const config={path:'/api/bol-external'};
