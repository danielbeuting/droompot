(()=>{
  const qs=new URLSearchParams(location.search)
  if(qs.get('view')==='dream') setTimeout(()=>{try{show('home')}catch{}},0)

  try{
    const originalComplete=complete
    complete=function(cash){
      const payload={
        name:pending?.name||'Anoniem', amount:Number(pending?.amount||0), message:pending?.message||'', cash:Boolean(cash),
        photo:pending?.photo||'', goal:state?.goals?.[pending?.goalIndex]?.title||''
      }
      originalComplete(cash)
      fetch('/.netlify/functions/dream-data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{})
    }
  }catch{}

  try{
    const originalStart=startConfetti
    startConfetti=function(){
      const canvas=document.getElementById('confetti-canvas')
      if(canvas){canvas.classList.remove('v151-confetti-fade');canvas.style.opacity='1'}
      originalStart()
      setTimeout(()=>{if(canvas)canvas.classList.add('v151-confetti-fade')},3200)
      setTimeout(()=>{if(canvas){canvas.classList.remove('v151-confetti-fade');canvas.style.opacity='1'}},4400)
    }
  }catch{}

  const style=document.createElement('style')
  style.textContent='#confetti-canvas{transition:opacity .9s ease}.v151-confetti-fade{opacity:0!important}.transaction-avatar.has-photo{background-size:cover!important;background-position:center!important}'
  document.head.appendChild(style)
})()
