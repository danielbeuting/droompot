(async()=>{
  const STATE_KEY='droompot-v13';
  const ADMIN_KEY='droompot-admin-session';
  const slug=location.pathname.match(/^\/p\/([^/?#]+)/)?.[1]||'';

  function supabaseToken(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(k.startsWith('sb-')&&k.endsWith('-auth-token')){
          const raw=JSON.parse(localStorage.getItem(k)||'{}');
          return raw?.access_token||raw?.currentSession?.access_token||'';
        }
      }
    }catch{}
    return '';
  }

  const token=supabaseToken();
  if(token)localStorage.setItem(ADMIN_KEY,'true');

  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init={})=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/.netlify/functions/dream-data')){
      const u=new URL(url,location.origin);
      if(slug&&!u.searchParams.has('slug'))u.searchParams.set('slug',slug);
      const headers=new Headers(init.headers||{});
      if(token&&!headers.has('Authorization'))headers.set('Authorization',`Bearer ${token}`);
      return nativeFetch(u.pathname+u.search,{...init,headers});
    }
    return nativeFetch(input,init);
  };

  if(slug){
    try{
      const r=await nativeFetch(`/.netlify/functions/dream-data?slug=${encodeURIComponent(slug)}`,{cache:'no-store'});
      if(r.ok){
        const payload=await r.json();
        if(payload?.data)localStorage.setItem(STATE_KEY,JSON.stringify(payload.data));
      }
    }catch{}
  }

  const s=document.createElement('script');
  s.src='app.js';
  s.defer=false;
  s.onload=()=>{
    const enhancement=document.createElement('script');
    enhancement.src='v151-feedback.js';
    document.body.appendChild(enhancement);
  };
  document.body.appendChild(s);
})();
