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
      setTimeout(()=>{if(canvas){canvas.classList.remove('v151-confetti-fade');canvas.style.opacity='1'}},4300)
    }
  }catch{}

  const style=document.createElement('style')
  style.textContent=`
    #confetti-canvas{transition:opacity .9s ease}.v151-confetti-fade{opacity:0!important}
    .transaction-avatar.has-photo{background-size:cover!important;background-position:center!important;color:transparent!important}
    .dp-anim{position:fixed;inset:0;z-index:999;background:rgba(18,17,24,.88);display:none;align-items:center;justify-content:center;padding:22px;color:#fff}
    .dp-anim.show{display:flex}.dp-anim-card{width:min(100%,390px);text-align:center;position:relative}
    .dp-anim-label{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.72;margin-bottom:12px}
    .dp-goal{background:#fff;color:#22212b;border-radius:24px;padding:18px;text-align:left;box-shadow:0 24px 70px rgba(0,0,0,.3);transition:.3s transform,.3s box-shadow}
    .dp-goal.highlight{transform:scale(1.025);box-shadow:0 0 0 3px rgba(255,255,255,.45),0 24px 70px rgba(0,0,0,.34)}
    .dp-goal-head{display:flex;align-items:center;gap:12px}.dp-goal-icon{width:48px;height:48px;border-radius:15px;background:var(--pop);display:grid;place-items:center;font-size:25px}
    .dp-goal h3{font-family:'Fredoka';font-size:24px;margin:0}.dp-goal small{color:#746f7e}.dp-progress{height:12px;background:#ece8ef;border-radius:99px;margin-top:16px;overflow:hidden}.dp-progress>i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--primary),var(--primary2));border-radius:99px}
    .dp-progress-meta{display:flex;justify-content:space-between;margin-top:7px;font-size:12px;font-weight:800}
    .dp-pig-wrap{height:190px;position:relative;margin-top:4px}.dp-pig{width:175px;position:absolute;left:50%;bottom:0;transform:translateX(-50%);filter:drop-shadow(0 16px 24px rgba(0,0,0,.24))}
    .dp-coin{position:absolute;left:50%;top:-10px;transform:translateX(-50%);width:62px;height:62px;border-radius:50%;background:#ffd052;color:#5f4a00;border:5px solid #e4b72c;display:grid;place-items:center;font-weight:900;opacity:0;z-index:3}
    .dp-coin.drop{opacity:1;animation:dpCoinDrop 1.25s cubic-bezier(.2,.75,.25,1) forwards}@keyframes dpCoinDrop{0%{top:-5px;transform:translateX(-50%) rotate(0) scale(.9)}70%{top:78px;transform:translateX(-50%) rotate(310deg) scale(1)}100%{top:112px;transform:translateX(-50%) rotate(430deg) scale(.18);opacity:0}}
    .dp-thanks{font-family:'Fredoka';font-size:22px;margin:14px 0 0;opacity:0;transform:translateY(8px);transition:.35s}.dp-thanks.show{opacity:1;transform:none}
    .dp-reached{display:none;background:#fff4c3;color:#4f3d00;border-radius:18px;padding:13px;margin:14px 0 0;font-weight:900}.dp-reached.show{display:block;animation:dpPop .35s ease}@keyframes dpPop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
    .dp-next{margin-top:18px;width:100%;border:0;border-radius:18px;padding:15px;font-weight:900;background:#fff;color:#22212b;opacity:0;pointer-events:none;transition:.3s}.dp-next.show{opacity:1;pointer-events:auto}
  `
  document.head.appendChild(style)

  function animateNumber(el,from,to,duration){
    const start=performance.now()
    const tick=now=>{const t=Math.min(1,(now-start)/duration);const e=1-Math.pow(1-t,3);const v=from+(to-from)*e;el.textContent=euro(Math.round(v*100)/100);if(t<1)requestAnimationFrame(tick)}
    requestAnimationFrame(tick)
  }

  function runGuaranteedAnimation(anim){
    const existing=document.getElementById('dp-guaranteed-animation');if(existing)existing.remove()
    const reached=anim.goalId!=='account'&&anim.before<anim.goal&&anim.after>=anim.goal
    const beforePct=anim.goalId==='account'?0:Math.min(100,(anim.before/anim.goal)*100)
    const afterPct=anim.goalId==='account'?0:Math.min(100,(anim.after/anim.goal)*100)
    const goal=state?.goals?.[anim.goalIndex]||{}
    const overlay=document.createElement('div');overlay.id='dp-guaranteed-animation';overlay.className='dp-anim'
    overlay.innerHTML=`<div class="dp-anim-card"><div class="dp-anim-label">Je bijdrage gaat naar</div><div class="dp-goal"><div class="dp-goal-head"><div class="dp-goal-icon">${goal.icon||'🎯'}</div><div><small>${anim.goalId==='account'?'Spaarrekening':'Spaardoel'}</small><h3>${goal.title||anim.title}</h3></div></div>${anim.goalId==='account'?'':`<div class="dp-progress"><i style="width:${beforePct}%"></i></div><div class="dp-progress-meta"><strong class="dp-current">${euro(anim.before)}</strong><span>${Math.round(beforePct)}%</span></div>`}</div><div class="dp-pig-wrap"><div class="dp-coin"><span>${euro(anim.amount)}</span></div><img class="dp-pig" src="droompot-pig.png" alt="Droompot"></div><div class="dp-thanks">Dankjewel 💛</div><div class="dp-reached">🎉 Spaardoel bereikt: ${goal.title||anim.title}!</div><button class="dp-next">Verder</button></div>`
    document.body.appendChild(overlay);requestAnimationFrame(()=>overlay.classList.add('show'))
    const card=overlay.querySelector('.dp-goal'),coin=overlay.querySelector('.dp-coin'),fill=overlay.querySelector('.dp-progress i'),current=overlay.querySelector('.dp-current'),pct=overlay.querySelector('.dp-progress-meta span'),thanks=overlay.querySelector('.dp-thanks'),done=overlay.querySelector('.dp-reached'),next=overlay.querySelector('.dp-next')
    setTimeout(()=>card.classList.add('highlight'),250)
    setTimeout(()=>coin.classList.add('drop'),800)
    setTimeout(()=>{
      if(fill){fill.style.transition='width 2s cubic-bezier(.2,.8,.2,1)';fill.style.width=`${afterPct}%`}
      if(current)animateNumber(current,anim.before,anim.after,2000)
      if(pct){let p=beforePct;const step=()=>{p+=(afterPct-p)*.13;pct.textContent=`${Math.round(p)}%`;if(Math.abs(afterPct-p)>0.5)requestAnimationFrame(step);else pct.textContent=`${Math.round(afterPct)}%`};requestAnimationFrame(step)}
    },1900)
    setTimeout(()=>thanks.classList.add('show'),4100)
    if(reached)setTimeout(()=>done.classList.add('show'),4450)
    setTimeout(()=>next.classList.add('show'),reached?5000:4450)
    next.addEventListener('click',()=>overlay.remove())
  }

  const backHome=document.getElementById('back-home-btn')
  if(backHome){
    backHome.addEventListener('click',event=>{
      try{
        if(!lastDonationAnimation)return
        event.preventDefault();event.stopImmediatePropagation()
        if(typeof stopConfetti==='function')stopConfetti()
        const anim={...lastDonationAnimation};lastDonationAnimation=null
        state.activeGoal=anim.goalIndex;save();render();show('home')
        setTimeout(()=>runGuaranteedAnimation(anim),120)
      }catch{}
    },true)
  }
})()
