const KEY="droompot-v13";
const DEFAULT={
  childName:"Noï",birthDate:"2024-09-26",theme:"green",photo:"noi.jpg",activeGoal:0,
  wishes:[
    {id:1,title:"LEGO Creator set",price:39.99,link:"https://www.lego.com",note:"Robin vindt voertuigen heel leuk",emoji:"🧱",claimed:false},
    {id:2,title:"Voetbal",price:24.95,link:"",note:"Maat 5",emoji:"⚽",claimed:false},
    {id:3,title:"Kinderboek over ruimte",price:17.50,link:"",note:"Een mooi boek om samen te lezen",emoji:"🚀",claimed:true},
    {id:4,title:"Dagje dierentuin",price:0,link:"",note:"Een ervaring is ook een cadeau",emoji:"🦁",claimed:false}
  ],
  goals:[
    {id:"bike",title:"Nieuwe fiets",icon:"🚲",type:"Spaardoel",description:"Voor lekker fietsen naar school en op avontuur.",current:80,goal:200},
    {id:"license",title:"Rijbewijs",icon:"🚗",type:"Voor later",description:"Een mooie start richting zelfstandigheid.",current:125,goal:2500},
    {id:"study",title:"Studeren",icon:"🎓",type:"Voor later",description:"Een extra potje voor leren en ontwikkelen.",current:450,goal:5000},
    {id:"account",title:"Algemene spaarrekening",icon:"💰",type:"Spaarrekening",description:"Vrij sparen voor later.",current:340,goal:1000}
  ],
  transactions:[
    {name:"Oma Els",amount:10,message:"Voor een mooie droom ❤️",goal:"Nieuwe fiets",cash:false},
    {name:"Opa Jan",amount:25,message:"Veel plezier ermee!",goal:"Nieuwe fiets",cash:false},
    {name:"Papa & mama",amount:20,message:"In de spaarpot gedaan",goal:"Nieuwe fiets",cash:true}
  ]
};
let state=load(),selectedAmount=20,mode="digital",pending={},settingsSnapshot=null,settingsDraft=null,lastDonationAnimation=null,adminCredentials=null,centralStorageAvailable=false,donationPhotoData="";

function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||clone(DEFAULT)}catch(e){return clone(DEFAULT)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
const ADMIN_SESSION_KEY="droompot-admin-session";
function isAdminLoggedIn(){
  return localStorage.getItem(ADMIN_SESSION_KEY)==="true";
}
function persistAdminLogin(){
  localStorage.setItem(ADMIN_SESSION_KEY,"true");
}

async function loadCentralState(){
  try{
    const response=await fetch("/.netlify/functions/dream-data",{cache:"no-store"});
    if(!response.ok)throw new Error("Central storage unavailable");
    const payload=await response.json();
    if(payload && payload.data){
      state={...clone(DEFAULT),...payload.data};
      normalizeGoalOrder();
      localStorage.setItem(KEY,JSON.stringify(state));
      centralStorageAvailable=true;
      updateSyncStatus();
      render();
      return true;
    }
  }catch(err){
    centralStorageAvailable=false;
    updateSyncStatus();
  }
  return false;
}

async function saveCentralState(){
  save();
  if(!adminCredentials)return false;
  try{
    const response=await fetch("/.netlify/functions/dream-data",{
      method:"PUT",
      headers:{
        "Content-Type":"application/json",
        "X-Dream-User":adminCredentials.username,
        "X-Dream-Password":adminCredentials.password
      },
      body:JSON.stringify(state)
    });
    if(!response.ok)throw new Error("Central save failed");
    centralStorageAvailable=true;
    updateSyncStatus();
    return true;
  }catch(err){
    centralStorageAvailable=false;
    updateSyncStatus();
    return false;
  }
}

function updateSyncStatus(){
  const el=document.getElementById("sync-status");
  const text=document.getElementById("sync-status-text");
  if(!el||!text)return;
  el.classList.toggle("online",centralStorageAvailable);
  el.classList.toggle("offline",!centralStorageAvailable);
  text.textContent=centralStorageAvailable
    ?"Centraal opgeslagen · iedereen ziet dezelfde versie"
    :"Lokale demo-opslag · Netlify backend nog niet actief";
}

function normalizeGoalOrder(){
  if(!Array.isArray(state.goals))return;
  const activeId=activeGoal()?.id;
  const normal=state.goals.filter(g=>g.id!=="account");
  const account=state.goals.find(g=>g.id==="account");
  state.goals=account?[...normal,account]:normal;

  if(activeId){
    const idx=state.goals.findIndex(g=>g.id===activeId);
    if(idx>=0)state.activeGoal=idx;
  }
}

function euro(n){return new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:2}).format(n)}
function initials(s){return (s||"?").trim().charAt(0).toUpperCase()}
function activeGoal(){return state.goals[state.activeGoal]||state.goals[0]}
function birthdayInfo(dateString){
  if(!dateString)return "";
  const birth=new Date(dateString+"T12:00:00");
  if(Number.isNaN(birth.getTime()))return "";
  const now=new Date();
  let age=now.getFullYear()-birth.getFullYear();
  const birthdayThisYear=new Date(now.getFullYear(),birth.getMonth(),birth.getDate(),12);
  if(now < birthdayThisYear) age--;

  let nextBirthday=new Date(now.getFullYear(),birth.getMonth(),birth.getDate(),12);
  if(nextBirthday < now)nextBirthday=new Date(now.getFullYear()+1,birth.getMonth(),birth.getDate(),12);
  const days=Math.ceil((nextBirthday-now)/(1000*60*60*24));
  if(days===0)return `${age} jaar · vandaag jarig 🎉`;
  if(days===1)return `${age} jaar · morgen jarig 🎈`;
  return `${age} jaar · over ${days} dagen jarig 🎈`;
}
function updateGiveTarget(){
  const g=activeGoal();
  const name=document.getElementById("give-goal-name");
  if(!name)return;
  document.getElementById("give-goal-icon").textContent=g.icon;
  name.textContent=g.title;
  document.getElementById("give-eyebrow").textContent=g.id==="account"?`Voeg iets toe aan ${state.childName}\'s spaarrekening`:`Geef iets voor ${g.title.toLowerCase()}`;
}
function renderGoalSelector(){
  const select=document.getElementById("goal-selector");
  if(!select)return;
  select.innerHTML="";
  state.goals.forEach((g,i)=>{
    const completed=g.id!=="account" && g.current>=g.goal;
    if(completed)return;
    const option=document.createElement("option");
    option.value=String(i);
    option.textContent=g.title;
    select.appendChild(option);
  });

  const activeCompleted=activeGoal().id!=="account" && activeGoal().current>=activeGoal().goal;
  if(activeCompleted){
    const firstAvailable=state.goals.findIndex(g=>g.id==="account" || g.current<g.goal);
    if(firstAvailable>=0)state.activeGoal=firstAvailable;
  }
  select.value=String(state.activeGoal);
}
function syncGoalSelection(index,scroll=true){
  state.activeGoal=Math.max(0,Math.min(state.goals.length-1,Number(index)||0));
  save();
  updateGiveTarget();
  renderGoalSelector();
  document.querySelectorAll(".goal-dot").forEach((d,i)=>d.classList.toggle("active",i===state.activeGoal));
  if(scroll){
    const carousel=document.getElementById("goals-carousel");
    const card=carousel?.children[state.activeGoal];
    if(card)carousel.scrollTo({left:card.offsetLeft-2,behavior:"smooth"});
  }
}

async function fileToCompressedDataURL(file,maxSize=320,quality=.78){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let w=img.width,h=img.height;
        const scale=Math.min(1,maxSize/Math.max(w,h));
        w=Math.round(w*scale);h=Math.round(h*scale);
        const canvas=document.createElement("canvas");
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };
      img.onerror=reject;
      img.src=reader.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function applyPhoto(el){
  const useDraft=el && el.id==="settings-avatar" && settingsDraft;
  const photo=useDraft?settingsDraft.photo:state.photo;
  const name=useDraft?settingsDraft.childName:state.childName;
  if(photo){el.style.backgroundImage=`url("${photo}")`;el.textContent=""}
  else{el.style.backgroundImage="none";el.textContent=initials(name)}
}
function render(){
  document.documentElement.dataset.theme=settingsDraft?settingsDraft.theme:state.theme;
  document.getElementById("child-name-label").textContent=state.childName;
  const profileCopy=document.getElementById("profile-copy");
  if(profileCopy)profileCopy.textContent=`Hier vind je spaardoelen, de spaarrekening en alles waar ${state.childName} voor droomt en spaart.`;
  const birthdayLine=document.getElementById("birthday-line");
  if(birthdayLine)birthdayLine.textContent=birthdayInfo(state.birthDate);
  document.querySelector(".goals-title-row .eyebrow").textContent=`Waar droomt ${state.childName} van?`;

  const settingsTitle=document.getElementById("settings-profile-title");
  if(settingsTitle)settingsTitle.textContent=`${state.childName}'s Droompot`;

  const wishLabel=document.getElementById("wishlist-owner-label");
  if(wishLabel)wishLabel.textContent=`${state.childName}'s wensen`;

  const wishCopy=document.getElementById("wishlist-owner-copy");
  if(wishCopy)wishCopy.textContent=`Hier verzamelt ${state.childName} cadeautjes en ideeën waar die blij van wordt.`;

  const wishTitleLabel=document.getElementById("wish-title-label");
  if(wishTitleLabel)wishTitleLabel.textContent=`Wat wil ${state.childName} graag?`;

  const startTitle=document.getElementById("start-title");
  if(startTitle)startTitle.textContent=`Wat wil je bekijken?`;
  const startCopy=document.querySelector(".start-copy");
  if(startCopy)startCopy.textContent=`Kies of je naar ${state.childName}'s Droompot of naar het verlanglijstje wilt.`;

  const goalsPageTitle=document.getElementById("goals-page-title");
  if(goalsPageTitle)goalsPageTitle.textContent=`Spaardoelen van ${state.childName}`;

  applyPhoto(document.getElementById("child-avatar"));
  applyPhoto(document.getElementById("settings-avatar"));

  renderGoals();
  renderTransactions();
  renderSettingsGoals();
  renderGoalsPage();
  if(document.getElementById("screen-settings")?.classList.contains("active"))renderSettingsContributions();

  document.getElementById("setting-child").value=settingsDraft?settingsDraft.childName:state.childName;
  const birthInput=document.getElementById("setting-birthdate");
  if(birthInput)birthInput.value=settingsDraft?settingsDraft.birthDate||"":state.birthDate||"";
  document.querySelectorAll(".theme-card").forEach(b=>b.classList.toggle("selected",b.dataset.themeChoice===(settingsDraft?settingsDraft.theme:state.theme)));

  updateGiveTarget();
  renderGoalSelector();
  const wa=document.getElementById("wishlist-avatar");
  if(wa)applyPhoto(wa);
  updateSyncStatus();
}
function renderGoals(){
  const c=document.getElementById("goals-carousel"),dots=document.getElementById("goal-dots");
  c.innerHTML="";dots.innerHTML="";
  state.goals.forEach((g,i)=>{
    const p=Math.min(100,Math.round(g.current/g.goal*100));
    const card=document.createElement("article");
    card.className="goal-card"+(g.id==="account"?" general-account":"")+(g.id!=="account" && g.current>=g.goal?" completed":"");
    card.dataset.index=i;
    if(g.id==="account"){
      card.innerHTML=`<div><div class="goal-icon">${g.icon}</div><div class="goal-type">${esc(g.type)}</div><h3>${esc(g.title)}</h3>
        <p class="general-copy">Vrij sparen voor later, zonder vast doelbedrag of zichtbare tussenstand.</p></div>
        <div class="general-badge">✨ Bijdragen aan Robin's toekomst</div>`;
    }else{
      card.innerHTML=`<div class="goal-icon">${g.icon}</div><div class="goal-type">${esc(g.type)}</div><h3>${esc(g.title)}</h3>
        ${g.description?`<p class="goal-description">${esc(g.description)}</p>`:""}
        <div class="goal-money"><strong>${euro(g.current)}</strong><span>van ${euro(g.goal)} · ${p}%</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${p}%"></div></div>
        <div class="goal-remaining">${g.current>=g.goal?'<strong>Doel behaald ✓</strong>':`Nog <strong>${euro(g.goal-g.current)}</strong> nodig`}</div>`;
    }
    c.appendChild(card);
    const d=document.createElement("button");
    d.type="button";
    d.className="goal-dot"+(i===state.activeGoal?" active":"");
    d.dataset.goalDot=String(i);
    d.setAttribute("aria-label",`Ga naar spaardoel ${i+1}`);
    dots.appendChild(d);
  });
  updateGiveTarget();

  dots.querySelectorAll("[data-goal-dot]").forEach(dot=>{
    dot.addEventListener("click",()=>{
      syncGoalSelection(Number(dot.dataset.goalDot),true);
    });
  });

  requestAnimationFrame(()=>{
    const target=c.children[state.activeGoal];
    if(target)c.scrollLeft=target.offsetLeft-2;
  });
}
let scrollTimer;
let dotSyncRAF=null;
document.getElementById("goals-carousel").addEventListener("scroll",e=>{
  const c=e.currentTarget;
  if(dotSyncRAF)cancelAnimationFrame(dotSyncRAF);
  dotSyncRAF=requestAnimationFrame(()=>{
    const viewportCenter=c.scrollLeft+(c.clientWidth/2);
    let best=0,dist=Infinity;
    [...c.children].forEach((el,i)=>{
      const cardCenter=el.offsetLeft+(el.offsetWidth/2);
      const d=Math.abs(cardCenter-viewportCenter);
      if(d<dist){dist=d;best=i}
    });
    document.querySelectorAll(".goal-dot").forEach((dot,i)=>{
      dot.classList.toggle("active",i===best);
    });
    const select=document.getElementById("goal-selector");
    if(select && [...select.options].some(o=>Number(o.value)===best))select.value=String(best);
    const g=state.goals[best];
    if(g){
      document.getElementById("give-goal-icon").textContent=g.icon;
      document.getElementById("give-goal-name").textContent=g.title;
      document.getElementById("give-eyebrow").textContent=g.id==="account"
        ?`Voeg iets toe aan ${state.childName}'s spaarrekening`
        :`Geef iets voor ${g.title.toLowerCase()}`;
    }
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      state.activeGoal=best;
      save();
    },120);
  });
});
document.getElementById("goal-selector").addEventListener("change",e=>{
  syncGoalSelection(Number(e.target.value),true);
});
function renderTransactions(){
  const list=document.getElementById("transactions-list");list.innerHTML="";
  state.transactions.slice(0,8).forEach(t=>{
    const x=document.createElement("div");x.className="transaction";
    const avatar=t.photo
      ? `<div class="transaction-avatar has-photo" style="background-image:url('${t.photo}')"></div>`
      : `<div class="transaction-avatar">${initials(t.name)}</div>`;
    const typeTag=t.cash
      ? `<span class="payment-type-tag cash">CONTANT</span>`
      : `<span class="payment-type-tag digital">DIGITAAL</span>`;
    x.innerHTML=`${avatar}<div><div class="transaction-name">${esc(t.name)}${typeTag}</div><div class="transaction-message">${esc(t.message||"Heeft bijgedragen")}</div><div class="transaction-goal">${esc(t.goal||"Droompot")}</div></div><div class="transaction-amount">+ ${euro(t.amount)}</div>`;
    list.appendChild(x);
  })
}
function renderSettingsGoals(){
  const wrap=document.getElementById("settings-goals");
  wrap.innerHTML="";
  const source=settingsDraft?settingsDraft.goals:state.goals;

  source.forEach((g,i)=>{
    const card=document.createElement("div");
    card.className="settings-goal-card";
    card.innerHTML=`
      <div class="settings-goal-top">
        <div class="settings-goal-field">
          <label>Emoji</label>
          <input class="emoji-input" type="text" maxlength="4" data-goal-emoji="${i}" value="${esc(g.icon)}">
        </div>
        <div class="settings-goal-field">
          <label>Naam spaardoel</label>
          <input type="text" maxlength="60" data-goal-title="${i}" value="${esc(g.title)}">
        </div>
      </div>
      <div class="settings-goal-field settings-goal-description">
        <label>Korte beschrijving <span class="optional">(optioneel)</span></label>
        <input type="text" maxlength="90" data-goal-description="${i}" value="${esc(g.description||"")}">
      </div>
      <div class="settings-goal-bottom">
        <div class="settings-goal-field">
          <label>Huidige stand</label>
          <input type="number" min="0" step="1" data-goal-current="${i}" value="${g.current}">
        </div>
        <div class="settings-goal-field">
          <label>${g.id==="account"?"Intern doel":"Doelbedrag"}</label>
          <input type="number" min="1" step="1" data-goal-target="${i}" value="${g.goal}">
        </div>
      </div>
      ${g.id==="account"
        ? '<div class="fixed-goal-badge">Vaste spaarrekening · kan niet worden verwijderd</div>'
        : `<button class="remove-goal-btn" data-remove-goal="${i}">Spaardoel verwijderen</button>`}
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll("[data-remove-goal]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      syncSettingsFormToDraft();
      const index=Number(btn.dataset.removeGoal);
      if(settingsDraft.goals[index]?.id==="account")return;
      settingsDraft.goals.splice(index,1);
      if(settingsDraft.activeGoal>=settingsDraft.goals.length)settingsDraft.activeGoal=0;
      renderSettingsGoals();
    });
  });
}
function renderGoalsPage(){
  const wrap=document.getElementById("goals-page-list");
  if(!wrap)return;
  wrap.innerHTML="";
  state.goals.forEach((g,i)=>{
    const p=g.goal>0?Math.min(100,Math.round((g.current/g.goal)*100)):0;
    const detail=g.id==="account"?"Algemene spaarrekening · saldo verborgen":`${euro(g.current)} van ${euro(g.goal)} · ${p}%`;
    const card=document.createElement("article");
    card.className="goals-page-card"+(i===state.activeGoal?" active":"")+(g.id!=="account" && g.current>=g.goal?" completed":"");
    card.innerHTML=`
      <div class="goals-page-card-icon">${esc(g.icon)}</div>
      <div><h3>${esc(g.title)}</h3><p>${detail}</p></div>
      <button class="goals-page-select" data-select-goal="${i}">${i===state.activeGoal?"Actief":"Kies"}</button>
    `;
    wrap.appendChild(card);
  });
  wrap.querySelectorAll("[data-select-goal]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      syncGoalSelection(Number(btn.dataset.selectGoal),false);
      render();
      show("home");
      setTimeout(()=>toast("Spaardoel geselecteerd!",true),120);
    });
  });
}

function show(name){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("screen-"+name).classList.add("active");window.scrollTo(0,0)}
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.back)));

function setAmount(n){
  selectedAmount=Number(n)||0;
  document.querySelectorAll(".amount-chip").forEach(b=>b.classList.toggle("selected",Number(b.dataset.amount)===selectedAmount));
  document.getElementById("continue-btn").textContent=`Ik geef ${euro(selectedAmount)}`;
}
document.querySelectorAll(".amount-chip").forEach(b=>b.addEventListener("click",()=>{document.getElementById("custom-amount").value="";setAmount(b.dataset.amount)}));
document.getElementById("custom-amount").addEventListener("input",e=>{document.querySelectorAll(".amount-chip").forEach(b=>b.classList.remove("selected"));if(Number(e.target.value)>0){selectedAmount=Number(e.target.value);document.getElementById("continue-btn").textContent=`Ik geef ${euro(selectedAmount)}`}else setAmount(20)});
document.querySelectorAll(".mode-card").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;document.querySelectorAll(".mode-card").forEach(x=>x.classList.toggle("selected",x===b))}));


document.getElementById("donation-photo-upload").addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  const preview=document.getElementById("donation-photo-preview");
  if(!file){
    donationPhotoData="";
    preview.innerHTML="<span>+</span>";
    return;
  }
  try{
    donationPhotoData=await fileToCompressedDataURL(file,320,.78);
    preview.innerHTML=`<img src="${donationPhotoData}" alt="">`;
  }catch{
    donationPhotoData="";
    preview.innerHTML="<span>+</span>";
    toast("Foto kon niet worden geladen");
  }
});

document.getElementById("continue-btn").addEventListener("click",()=>{
  if(selectedAmount<=0)return;
  pending={amount:selectedAmount,mode,goalIndex:state.activeGoal};
  const g=activeGoal();
  document.getElementById("details-amount").textContent=euro(selectedAmount);
  document.getElementById("details-goal").textContent=g.title;
  const row=document.getElementById("details-goal-row");
  if(row)row.style.display=g.id==="account"?"none":"block";
  show("details")
});
document.getElementById("to-payment-btn").addEventListener("click",()=>{
  pending.name=document.getElementById("giver-name").value.trim()||"Anoniem";
  pending.message=document.getElementById("giver-message").value.trim();
  pending.photo=donationPhotoData||"";
  const g=state.goals[pending.goalIndex];
  const cashGoalRow=document.getElementById("cash-goal-row");
  const checkoutGoalRow=document.getElementById("checkout-goal-row");
  if(cashGoalRow)cashGoalRow.style.display=g.id==="account"?"none":"flex";
  if(checkoutGoalRow)checkoutGoalRow.style.display=g.id==="account"?"none":"flex";
  if(pending.mode==="cash"){
    document.getElementById("cash-goal").textContent=g.title;
    document.getElementById("cash-total").textContent=euro(pending.amount);
    show("cash")
  }else{
    document.getElementById("checkout-goal").textContent=g.title;
    document.getElementById("checkout-total").textContent=euro(pending.amount);
    document.getElementById("fake-pay-btn").textContent=`Betaal ${euro(pending.amount)}`;
    show("payment")
  }
});
function complete(cash){
  const g=state.goals[pending.goalIndex];
  const beforeCurrent=Number(g.current);
  g.current+=Number(pending.amount);
  lastDonationAnimation={
    goalIndex:pending.goalIndex,
    amount:Number(pending.amount),
    before:beforeCurrent,
    after:Number(g.current),
    goal:Number(g.goal),
    goalId:g.id,
    title:g.title
  };
  state.transactions.unshift({name:pending.name,amount:Number(pending.amount),message:pending.message,goal:g.title,cash,photo:pending.photo||""});
  save();render();
  document.getElementById("success-title").textContent=`${euro(pending.amount)} toegevoegd 🎉`;
  document.getElementById("success-copy").textContent=cash?`De contante bijdrage staat nu ook digitaal bij ${g.title}.`:`De Droompot van ${state.childName} is weer een stukje dichter bij ${g.title}.`;
  document.getElementById("success-balance").textContent=`${euro(g.current)} van ${euro(g.goal)}`;
  show("success");startConfetti()
}
document.getElementById("fake-pay-btn").addEventListener("click",e=>{const b=e.currentTarget;b.disabled=true;b.textContent="Betaling verwerken…";setTimeout(()=>{b.disabled=false;complete(false)},550)});
document.getElementById("confirm-cash-btn").addEventListener("click",()=>complete(true));
document.getElementById("back-home-btn").addEventListener("click",()=>{
  stopConfetti();
  document.getElementById("giver-name").value="";
  document.getElementById("giver-message").value="";
  document.getElementById("custom-amount").value="";
  donationPhotoData="";
  const donationPreview=document.getElementById("donation-photo-preview");if(donationPreview)donationPreview.innerHTML="<span>+</span>";
  const donationInput=document.getElementById("donation-photo-upload");if(donationInput)donationInput.value="";
  setAmount(20);

  const anim=lastDonationAnimation;
  if(anim){
    state.activeGoal=anim.goalIndex;
    save();
    render();
    show("home");
    setTimeout(()=>runDonationHomeAnimation(anim),180);
    lastDonationAnimation=null;
  }else{
    show("home");
  }
});


document.getElementById("start-dream-btn").addEventListener("click",()=>show("home"));
document.getElementById("start-wishlist-btn").addEventListener("click",()=>{renderWishlist();show("wishlist")});
document.getElementById("home-wishlist-btn").addEventListener("click",()=>{renderWishlist();show("wishlist")});
document.getElementById("wishlist-dreampot-btn").addEventListener("click",()=>show("home"));

document.getElementById("open-settings").addEventListener("click",()=>{
  if(isAdminLoggedIn()){
    adminCredentials={username:"Annejet",password:"yuki"};
    settingsSnapshot=clone(state);
    settingsDraft=clone(state);
    render();
    renderSettingsWishList();
    renderSettingsContributions();
    show("settings");
  }else{
    document.getElementById("settings-username").value="";
    document.getElementById("settings-password").value="";
    document.getElementById("settings-login-error").classList.remove("show");
    show("settings-login");
  }
});


document.querySelectorAll("[data-settings-tab]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll("[data-settings-tab]").forEach(x=>x.classList.toggle("active",x===btn));
    document.querySelectorAll("[data-settings-panel]").forEach(panel=>{
      panel.classList.toggle("active",panel.dataset.settingsPanel===btn.dataset.settingsTab);
    });
    if(btn.dataset.settingsTab==="contributions")renderSettingsContributions();
    if(btn.dataset.settingsTab==="wishlist")renderSettingsWishList();
  });
});

document.getElementById("settings-login-btn").addEventListener("click",async()=>{
  const username=document.getElementById("settings-username").value.trim();
  const password=document.getElementById("settings-password").value;

  // Demo fallback remains usable locally; on Netlify the server checks these credentials on writes.
  if(username==="Annejet" && password==="yuki"){
    adminCredentials={username,password};
    persistAdminLogin();
    settingsSnapshot=clone(state);
    settingsDraft=clone(state);
    render();
    renderSettingsWishList();
    updateSyncStatus();
    show("settings");
    document.getElementById("settings-login-error").classList.remove("show");
  }else{
    document.getElementById("settings-login-error").classList.add("show");
  }
});
document.getElementById("settings-password").addEventListener("keydown",e=>{
  if(e.key==="Enter")document.getElementById("settings-login-btn").click();
});

document.querySelectorAll("[data-theme-choice]").forEach(b=>b.addEventListener("click",()=>{
  syncSettingsFormToDraft();
  if(!settingsDraft)settingsDraft=clone(state);
  settingsDraft.theme=b.dataset.themeChoice;
  document.documentElement.dataset.theme=settingsDraft.theme;
  document.querySelectorAll(".theme-card").forEach(x=>x.classList.toggle("selected",x===b));
}));
document.getElementById("setting-birthdate").addEventListener("change",e=>{
  if(!settingsDraft)settingsDraft=clone(state);
  settingsDraft.birthDate=e.target.value;
});
document.getElementById("setting-child").addEventListener("input",e=>{
  if(!settingsDraft)settingsDraft=clone(state);
  settingsDraft.childName=e.target.value;
  const preview=e.target.value.trim()||"Noï";
  const title=document.getElementById("settings-profile-title");
  if(title)title.textContent=`${preview}'s Droompot`;
});
document.getElementById("photo-upload").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    if(!settingsDraft)settingsDraft=clone(state);
    settingsDraft.photo=r.result;
    applyPhoto(document.getElementById("settings-avatar"));
    const el=document.getElementById("settings-avatar");
    el.style.backgroundImage=`url("${settingsDraft.photo}")`;
    el.textContent="";
  };
  r.readAsDataURL(f);
});

function syncSettingsFormToDraft(){
  if(!settingsDraft)settingsDraft=clone(state);
  const childInput=document.getElementById("setting-child");
  if(childInput)settingsDraft.childName=childInput.value;
  const birthInput=document.getElementById("setting-birthdate");
  if(birthInput)settingsDraft.birthDate=birthInput.value;

  settingsDraft.goals.forEach((g,i)=>{
    const title=document.querySelector(`[data-goal-title="${i}"]`);
    const emoji=document.querySelector(`[data-goal-emoji="${i}"]`);
    const description=document.querySelector(`[data-goal-description="${i}"]`);
    const current=document.querySelector(`[data-goal-current="${i}"]`);
    const target=document.querySelector(`[data-goal-target="${i}"]`);

    if(title)g.title=title.value.trim()||g.title;
    if(emoji)g.icon=emoji.value.trim()||g.icon;
    if(description)g.description=description.value.trim();
    if(current)g.current=Math.max(0,Number(current.value)||0);
    if(target)g.goal=Math.max(1,Number(target.value)||1);
  });
}


document.getElementById("cancel-settings-btn").addEventListener("click",()=>{
  if(settingsSnapshot)state=clone(settingsSnapshot);
  settingsSnapshot=null;
  settingsDraft=null;
  save();
  render();
  show("home");
});
document.getElementById("save-settings-btn").addEventListener("click",async()=>{
  syncSettingsFormToDraft();

  if(settingsDraft){
    settingsDraft.childName=(settingsDraft.childName||"").trim()||"Noï";
    state=clone(settingsDraft);
  }

  save();
  const synced=await saveCentralState();
  settingsSnapshot=null;
  settingsDraft=null;
  render();
  settingsSnapshot=clone(state);
  settingsDraft=clone(state);
  render();
  renderSettingsWishList();
  renderSettingsContributions();
  show("settings");
  setTimeout(()=>toast("Wijzigingen opgeslagen!",true),120);
});
const confirmOverlay=document.getElementById("confirm-overlay");
const confirmModal=document.getElementById("confirm-modal");

function toggleResetConfirm(open){
  confirmOverlay.classList.toggle("open",open);
  confirmModal.classList.toggle("open",open);
}

document.getElementById("reset-demo-btn").addEventListener("click",()=>toggleResetConfirm(true));
document.getElementById("cancel-reset").addEventListener("click",()=>toggleResetConfirm(false));
confirmOverlay.addEventListener("click",()=>toggleResetConfirm(false));

document.getElementById("confirm-reset").addEventListener("click",()=>{
  state=clone(DEFAULT);
  normalizeGoalOrder();
  save();
  render();
  setAmount(20);
  toggleResetConfirm(false);
  show("home");
  setTimeout(()=>toast("Demo is gereset!",true),120);
});

const overlay=document.getElementById("menu-overlay"),menu=document.getElementById("side-menu");
function toggleMenu(open){overlay.classList.toggle("open",open);menu.classList.toggle("open",open)}
document.getElementById("open-menu").addEventListener("click",()=>toggleMenu(true));
document.getElementById("close-menu").addEventListener("click",()=>toggleMenu(false));overlay.addEventListener("click",()=>toggleMenu(false));
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>{
  toggleMenu(false);
  const p=b.dataset.page;

  if(p==="Verlanglijstje"){renderWishlist();show("wishlist");return;}
  if(p==="Spaardoelen"){show("goals");return;}

  const title=document.getElementById("placeholder-title");
  const heading=document.getElementById("placeholder-heading");
  const copy=document.getElementById("placeholder-copy");
  const icon=document.getElementById("placeholder-icon");
  const extra=document.getElementById("placeholder-extra");

  title.textContent=p;
  heading.textContent=p;
  extra.innerHTML="";

  if(p==="Spaarrekening"){
    icon.textContent="💰";
    copy.innerHTML=`
      <p><strong>Een cadeau kan meegroeien met een kind.</strong> Geld dat vandaag op de spaarrekening wordt gezet, kan door rente ieder jaar iets groter worden.</p>
      <p>Onderstaande rekentool laat simpel zien wat een geldcadeau waard kán zijn wanneer ${esc(state.childName)} 18 jaar wordt. We rekenen voor deze demo met <strong>1,6% rente per jaar</strong> en rente-op-rente.</p>`;
    extra.innerHTML=`
      <div class="savings-calculator">
        <h3>Wat wordt jouw cadeau waard?</h3>
        <p>Vul een bedrag in. We gebruiken ${esc(state.childName)}'s geboortedatum en rekenen door tot de 18e verjaardag.</p>
        <div class="calculator-input-row">
          <div class="money-input-wrap"><span>€</span><input id="savings-gift-input" type="number" min="1" step="1" value="20"></div>
          <button class="calculate-btn" id="calculate-savings-btn">Bereken</button>
        </div>
        <div class="savings-result" id="savings-result">
          <span>Geschatte waarde op 18 jaar</span>
          <strong id="savings-result-value">€0</strong>
          <p id="savings-result-copy"></p>
        </div>
      </div>`;
    setTimeout(()=>{
      const calc=()=>{
        const amount=Math.max(0,Number(document.getElementById("savings-gift-input").value)||0);
        if(amount<=0)return;
        const birth=new Date((state.birthDate||"2024-09-26")+"T12:00:00");
        const eighteenth=new Date(birth.getFullYear()+18,birth.getMonth(),birth.getDate(),12);
        const now=new Date();
        const years=Math.max(0,(eighteenth-now)/(365.2425*24*60*60*1000));
        const result=amount*Math.pow(1.016,years);
        document.getElementById("savings-result-value").textContent=euro(Math.round(result*100)/100);
        document.getElementById("savings-result-copy").textContent=
          `${euro(amount)} groeit bij 1,6% samengestelde rente in ongeveer ${years.toFixed(1).replace(".",",")} jaar naar dit bedrag. Rente kan in werkelijkheid veranderen.`;
        document.getElementById("savings-result").classList.add("show");
      };
      document.getElementById("calculate-savings-btn")?.addEventListener("click",calc);
      calc();
    },0);
  }else if(p==="Waar gaat het geld heen?"){
    icon.textContent="→";
    heading.textContent="Waar gaat het geld heen?";
    copy.innerHTML=`
      <p>Droompot is bedoeld als <strong>middel tussen gever en kind</strong>. Wij willen het geld niet vasthouden op een tussenrekening.</p>
      <p>In het uiteindelijke product wordt een bijdrage rechtstreeks gestort op de gekoppelde rekening van <strong>${esc(state.childName)}</strong>. Droompot verzorgt de ervaring eromheen: het spaardoel, het geven en de voortgang.</p>
      <p class="demo-disclaimer">Deze huidige versie is nog een demo en verwerkt geen echte betalingen.</p>`;
  }else if(p==="Over Droompot"){
    icon.textContent="✦";
    copy.innerHTML=`
      <p><strong>Droompot helpt kinderen sparen voor morgen én genieten van vandaag.</strong></p>
      <p>Wij geloven in doelgericht sparen, maar óók in mooie cadeaus die echt gebruikt en onthouden worden. Liever één goed cadeau of samen bijdragen aan een droom dan een stapel spullen die snel wordt vergeten.</p>
      <p>Daarom combineren we spaardoelen, een spaarrekening en een verlanglijstje op één plek. We willen ouders en gevers helpen bewuster te kiezen, met aandacht voor kwaliteit en veiligheid in plaats van onnodige goedkope wegwerpproducten.</p>`;
  }else if(p==="Contact"){
    icon.textContent="✉";
    copy.innerHTML=`
      <p>Wij zijn <strong>Annejet & Daniël</strong>. Een ondernemend gezin dat Droompot bouwt vanuit een behoefte die we thuis zelf herkenden.</p>`;
    extra.innerHTML=`
      <div class="contact-card">
        <div class="contact-row"><span>E-mail</span><strong>daniel@beut.nl</strong></div>
        <div class="contact-row"><span>Telefoon</span><strong>06-36481306</strong></div>
        <div class="contact-row"><span>Van</span><strong>Annejet & Daniël</strong></div>
      </div>`;
  }else if(p==="Referral"){
    icon.textContent="↗";
    heading.textContent="Deel Droompot";
    copy.innerHTML=`
      <p>Enthousiast over Droompot? Deel jouw persoonlijke link. Als iemand via jouw code een Droompot aanschaft, komt er in deze demo <strong>€5 op ${esc(state.childName)}'s spaarrekening</strong>.</p>
      <p>Dit referral-programma is nog een prototype, maar laat zien hoe we gezinnen straks kunnen belonen voor het delen van Droompot.</p>`;
    const fakeLink=`https://droompot.nl/r/${state.childName.toLowerCase().replace(/[^a-z0-9]/g,"") || "robin"}5`;
    extra.innerHTML=`
      <div class="referral-card">
        <strong>Jouw persoonlijke link</strong>
        <div class="referral-link-row">
          <div class="referral-link" id="referral-link">${fakeLink}</div>
          <button class="copy-referral-btn" id="copy-referral-btn">Kopieer</button>
        </div>
      </div>`;
    setTimeout(()=>{
      const btn=document.getElementById("copy-referral-btn");
      if(btn)btn.addEventListener("click",async()=>{
        try{
          await navigator.clipboard.writeText(fakeLink);
          toast("Link gekopieerd!",true);
        }catch(e){
          const temp=document.createElement("textarea");
          temp.value=fakeLink;document.body.appendChild(temp);temp.select();document.execCommand("copy");temp.remove();
          toast("Link gekopieerd!",true);
        }
      });
    },0);
  }else{
    icon.textContent="✦";
    copy.innerHTML=`<p>Deze pagina werken we later verder uit.</p>`;
  }

  show("placeholder");
}));

let wishFilter="all";
function renderWishlist(){
  applyPhoto(document.getElementById("wishlist-avatar"));
  const list=document.getElementById("wishlist-list");if(!list)return;
  list.innerHTML="";
  const wishes=(state.wishes||[]).filter(w=>wishFilter==="all"||(wishFilter==="claimed"?w.claimed:!w.claimed));
  if(!wishes.length){
    list.innerHTML=`<div class="settings-block" style="text-align:center"><div style="font-size:34px">♡</div><h2 style="margin-top:7px">Niets hier</h2><p style="color:var(--muted);font-size:12px">Er staan geen wensen in deze selectie.</p></div>`;
    return;
  }
  wishes.forEach(w=>{
    const card=document.createElement("article");card.className="wish-card"+(w.claimed?" claimed":"");
    const price=w.price>0?euro(w.price):"Geen vaste prijs";
    const visual=w.image
      ? `<div class="wish-visual"><img src="${esc(w.image)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>`
      : `<div class="wish-visual fallback-pig"><img src="droompot-pig.png" alt="Droompot"></div>`;
    card.innerHTML=`${visual}
      <div><div class="wish-title">${esc(w.title)}</div><div class="wish-meta">${price}${w.link?" · link naar winkel":""}</div>
      ${w.note?`<div class="wish-note">${esc(w.note)}</div>`:""}</div>
      <div class="wish-actions">
        ${w.link?`<button class="wish-btn" data-open-wish="${w.id}">Bekijk winkel</button>`:""}
        <button class="wish-btn ${w.claimed?"undo":"primary"}" data-claim-wish="${w.id}">${w.claimed?"Maak weer vrij":"Streep af"}</button>
      </div>`;
    list.appendChild(card)
  });
  list.querySelectorAll("[data-claim-wish]").forEach(b=>b.addEventListener("click",()=>{
    const w=state.wishes.find(x=>x.id===Number(b.dataset.claimWish));if(w){w.claimed=!w.claimed;
      if(w.claimed)celebrateClaimedWish(w.title);save();renderWishlist();toast(w.claimed?"Wens afgestreept":"Wens weer vrij")}
  }));
  list.querySelectorAll("[data-open-wish]").forEach(b=>b.addEventListener("click",()=>{
    const w=state.wishes.find(x=>x.id===Number(b.dataset.openWish));if(w&&w.link)window.open(w.link,"_blank")
  }));
}
document.querySelectorAll("[data-wish-filter]").forEach(b=>b.addEventListener("click",()=>{
  wishFilter=b.dataset.wishFilter;document.querySelectorAll("[data-wish-filter]").forEach(x=>x.classList.toggle("active",x===b));renderWishlist()
}));
const wishOverlay=document.getElementById("wish-modal-overlay"),wishModal=document.getElementById("wish-modal");
function toggleWishModal(open){wishOverlay.classList.toggle("open",open);wishModal.classList.toggle("open",open)}
document.getElementById("open-add-wish")?.addEventListener("click",()=>toggleWishModal(true));
document.getElementById("close-add-wish")?.addEventListener("click",()=>toggleWishModal(false));
wishOverlay?.addEventListener("click",()=>toggleWishModal(false));
document.getElementById("save-wish")?.addEventListener("click",()=>{
  const title=document.getElementById("wish-title").value.trim();if(!title){toast("Vul eerst een wens in");return}
  state.wishes=state.wishes||[];
  state.wishes.unshift({id:Date.now(),title,price:Number(document.getElementById("wish-price").value)||0,link:document.getElementById("wish-link").value.trim(),note:document.getElementById("wish-note").value.trim(),emoji:"🎁",claimed:false});
  save();["wish-title","wish-price","wish-link","wish-note"].forEach(id=>document.getElementById(id).value="");toggleWishModal(false);renderWishlist();toast("Wens toegevoegd")
});
document.getElementById("share-wishlist").addEventListener("click",async()=>{
  const data={title:"Noï's verlanglijstje",text:"Bekijk Noï's verlanglijstje in Droompot"};
  try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText("Noï's verlanglijstje – Droompot demo");toast("Deellink gekopieerd")}}catch(e){}
});


function renderSettingsWishList(){
  const wrap=document.getElementById("settings-wish-list");
  if(!wrap)return;
  const wishes=settingsDraft?.wishes || state.wishes || [];
  wrap.innerHTML="";
  wishes.forEach(w=>{
    const item=document.createElement("div");
    item.className="settings-wish-item";
    const media=w.image?`<img src="${esc(w.image)}" alt="">`:`<img src="droompot-pig.png" alt="Droompot">`;
    item.innerHTML=`<div class="settings-wish-thumb">${media}</div>
      <div><strong>${esc(w.title)}</strong><small>${w.link?"Productlink gekoppeld":"Geen productlink"}</small></div>
      <button class="remove-wish-btn" data-remove-setting-wish="${w.id}">×</button>`;
    wrap.appendChild(item);
  });
  wrap.querySelectorAll("[data-remove-setting-wish]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      syncSettingsFormToDraft();
      settingsDraft.wishes=(settingsDraft.wishes||[]).filter(w=>String(w.id)!==String(btn.dataset.removeSettingWish));
      renderSettingsWishList();
    });
  });
}

async function fetchProductMetadata(){
  const url=document.getElementById("setting-wish-url").value.trim();
  const titleInput=document.getElementById("setting-wish-title");
  const priceInput=document.getElementById("setting-wish-price");
  const imageInput=document.getElementById("setting-wish-image");
  const media=document.getElementById("product-preview-media");
  const previewTitle=document.getElementById("product-preview-title");
  const status=document.getElementById("product-preview-status");

  if(!url){
    toast("Plak eerst een productlink");
    return;
  }

  status.textContent="Productpagina ophalen…";
  try{
    const response=await fetch(`/.netlify/functions/product-metadata?url=${encodeURIComponent(url)}`);
    if(!response.ok)throw new Error("metadata endpoint unavailable");
    const data=await response.json();

    if(data.title && !titleInput.value.trim())titleInput.value=data.title;

    if(data.price){
      const normalized=String(data.price).replace(",",".").replace(/[^0-9.]/g,"");
      const price=Number(normalized);
      if(Number.isFinite(price) && price>0)priceInput.value=price.toFixed(2);
    }

    const imageUrl=data.image||"";
    imageInput.value=imageUrl;

    previewTitle.textContent=titleInput.value.trim()||data.title||"Product";

    if(imageUrl){
      media.innerHTML=`<img src="${esc(imageUrl)}" alt="">`;
    }else{
      media.innerHTML=`<img src="droompot-pig.png" alt="Droompot">`;
    }

    if(data.price && imageUrl){
      status.textContent=`Afbeelding en prijs gevonden · ${euro(Number(String(data.price).replace(",","."))||0)}`;
    }else if(data.price){
      status.textContent=`Prijs gevonden · ${euro(Number(String(data.price).replace(",","."))||0)} · geen productfoto gevonden`;
    }else if(imageUrl){
      status.textContent="Afbeelding gevonden. Vul de prijs nog even zelf in.";
    }else{
      status.textContent="Geen afbeelding of prijs gevonden. Vul de prijs zelf in; het Droompot-varkentje wordt gebruikt.";
    }
  }catch(err){
    imageInput.value="";
    media.innerHTML=`<img src="droompot-pig.png" alt="Droompot">`;
    previewTitle.textContent=titleInput.value.trim()||"Product";
    status.textContent="Kon productgegevens niet ophalen. Vul naam en prijs zelf in.";
  }
}


document.getElementById("add-goal-btn").addEventListener("click",()=>{
  syncSettingsFormToDraft();
  if(!settingsDraft)settingsDraft=clone(state);

  const title=document.getElementById("new-goal-title").value.trim();
  const icon=document.getElementById("new-goal-emoji").value.trim()||"✨";
  const description=document.getElementById("new-goal-description").value.trim();
  const current=Math.max(0,Number(document.getElementById("new-goal-current").value)||0);
  const goal=Math.max(1,Number(document.getElementById("new-goal-target").value)||1);

  if(!title){
    toast("Geef het spaardoel eerst een naam");
    return;
  }

  const accountIndex=settingsDraft.goals.findIndex(g=>g.id==="account");
  const item={
    id:`goal-${Date.now()}`,
    title,
    icon,
    type:"Spaardoel",
    description,
    current,
    goal
  };
  settingsDraft.goals.unshift(item);
  normalizeGoalOrder();

  document.getElementById("new-goal-title").value="";
  document.getElementById("new-goal-emoji").value="✨";
  document.getElementById("new-goal-description").value="";
  document.getElementById("new-goal-current").value="0";
  document.getElementById("new-goal-target").value="100";
  renderSettingsGoals();
  toast("Spaardoel toegevoegd!",true);
});

document.getElementById("fetch-product-btn").addEventListener("click",fetchProductMetadata);


document.getElementById("add-wish-settings-btn").addEventListener("click",()=>{
  syncSettingsFormToDraft();
  if(!settingsDraft)settingsDraft=clone(state);

  const url=document.getElementById("setting-wish-url").value.trim();
  const title=document.getElementById("setting-wish-title").value.trim();
  const price=Math.max(0,Number(document.getElementById("setting-wish-price").value)||0);
  const image=document.getElementById("setting-wish-image").value.trim();

  if(!title){
    toast("Vul eerst een productnaam in");
    return;
  }
  if(price<=0){
    toast("Vul eerst een prijs in");
    return;
  }

  settingsDraft.wishes=settingsDraft.wishes||[];
  settingsDraft.wishes.unshift({
    id:Date.now(),
    title,
    price,
    link:url,
    note:"",
    image,
    claimed:false
  });

  document.getElementById("setting-wish-url").value="";
  document.getElementById("setting-wish-title").value="";
  document.getElementById("setting-wish-price").value="";
  document.getElementById("setting-wish-image").value="";
  document.getElementById("product-preview-media").innerHTML=`<img src="droompot-pig.png" alt="Droompot">`;
  document.getElementById("product-preview-title").textContent="Nog geen product gekozen";
  document.getElementById("product-preview-status").textContent="Plak een productlink hierboven.";
  renderSettingsWishList();
  toast("Toegevoegd aan verlanglijstje!",true);
});


function renderSettingsContributions(){
  const wrap=document.getElementById("settings-contributions-list");
  if(!wrap)return;
  wrap.innerHTML="";
  const list=settingsDraft?.transactions || state.transactions || [];

  if(!list.length){
    wrap.innerHTML=`<div class="info-card"><strong>Nog geen bijdragen</strong><p>Er staan geen recente bijdragen om te beheren.</p></div>`;
    return;
  }

  list.forEach((t,i)=>{
    const item=document.createElement("div");
    item.className="settings-contribution-item";
    const photo=t.photo
      ? `<div class="settings-contribution-photo"><img src="${t.photo}" alt=""></div>`
      : `<div class="settings-contribution-photo">${initials(t.name)}</div>`;
    item.innerHTML=`${photo}
      <div><strong>${esc(t.name)} · ${euro(t.amount)}</strong><small>${esc(t.message||"Geen bericht")} · ${esc(t.goal||"Droompot")}</small></div>
      <button class="delete-contribution-btn" data-delete-contribution="${i}">×</button>`;
    wrap.appendChild(item);
  });

  wrap.querySelectorAll("[data-delete-contribution]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      if(!settingsDraft)settingsDraft=clone(state);
      settingsDraft.transactions.splice(Number(btn.dataset.deleteContribution),1);
      renderSettingsContributions();
      toast("Bijdrage verwijderd uit overzicht",true);
    });
  });
}

function toast(t,success=false){
  const e=document.getElementById("toast");
  e.textContent=t;
  e.classList.toggle("success",success);
  e.classList.add("show");
  setTimeout(()=>{
    e.classList.remove("show");
    e.classList.remove("success");
  },1800);
}


function runDonationHomeAnimation(anim){
  const overlay=document.getElementById("donation-animation");
  const coin=document.getElementById("coin-amount");
  const msg=document.getElementById("animation-message");
  const icon=document.getElementById("animation-goal-icon");
  const type=document.getElementById("animation-goal-type");
  const title=document.getElementById("animation-goal-title");
  const fill=document.getElementById("animation-progress-fill");
  const amountEl=document.getElementById("animation-progress-amount");
  const pctEl=document.getElementById("animation-progress-percent");
  const thanks=document.getElementById("animation-thanks");
  const thanksTitle=document.getElementById("animation-thanks-title");
  const continueBtn=document.getElementById("animation-continue-btn");
  const completeBanner=document.getElementById("goal-complete-banner");
  const completeTitle=document.getElementById("complete-title");

  const g=state.goals[anim.goalIndex];
  const reached=anim.goalId!=="account" && anim.before<anim.goal && anim.after>=anim.goal;

  coin.textContent=euro(anim.amount);
  msg.textContent=anim.goalId==="account"?`${euro(anim.amount)} wordt toegevoegd aan de spaarrekening`:`${euro(anim.amount)} gaat naar ${anim.title}`;
  icon.textContent=g.icon;
  type.textContent=g.type||"Spaardoel";
  title.textContent=g.title;
  thanksTitle.textContent=reached
    ? `Yes! ${state.childName}'s spaardoel “${g.title}” is behaald!`
    : (anim.goalId==="account"
        ? `Dankjewel! Je bijdrage staat op ${state.childName}'s spaarrekening.`
        : `Dankjewel! ${state.childName} is weer een stukje dichter bij ${g.title}.`);
  completeTitle.textContent=`${g.title} is behaald!`;

  const beforePct=anim.goalId==="account"?0:Math.min(100,(anim.before/anim.goal)*100);
  const afterPct=anim.goalId==="account"?0:Math.min(100,(anim.after/anim.goal)*100);

  fill.style.width=`${beforePct}%`;
  amountEl.textContent=anim.goalId==="account"?"Bijdrage ontvangen":euro(anim.before);
  pctEl.textContent=anim.goalId==="account"?"":`${Math.round(beforePct)}%`;

  thanks.classList.remove("show");
  continueBtn.classList.remove("show");
  completeBanner.classList.remove("show");
  overlay.classList.remove("drop","bump");
  overlay.classList.add("active");

  // Slow, deliberate sequence.
  setTimeout(()=>overlay.classList.add("drop"),900);
  setTimeout(()=>overlay.classList.add("bump"),2600);

  setTimeout(()=>{
    if(anim.goalId!=="account"){
      animateOverlayProgress(fill,amountEl,pctEl,anim.before,anim.after,anim.goal,2200);
    }
  },2850);

  setTimeout(()=>{
    thanks.classList.add("show");
  },5200);

  if(reached){
    setTimeout(()=>{
      completeBanner.classList.add("show");
      startGoalCelebration();
      startProfileCoinRain();

      // Gold achieved banner disappears automatically after 2.5 seconds.
      setTimeout(()=>{
        completeBanner.classList.remove("show");
      },2500);
    },5600);
  }

  setTimeout(()=>{
    continueBtn.classList.add("show");
  },reached?6500:5900);
}

function animateOverlayProgress(fill,amountEl,pctEl,from,to,goal,duration){
  const start=performance.now();
  const startPct=Math.min(100,(from/goal)*100);
  const endPct=Math.min(100,(to/goal)*100);

  function frame(now){
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    const value=from+(to-from)*eased;
    const pct=startPct+(endPct-startPct)*eased;

    amountEl.textContent=euro(Math.round(value*100)/100);
    pctEl.textContent=`${Math.round(pct)}%`;
    fill.style.width=`${pct}%`;

    if(t<1)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

document.getElementById("animation-continue-btn").addEventListener("click",()=>{
  const overlay=document.getElementById("donation-animation");
  overlay.classList.remove("drop","bump","active");
  document.getElementById("animation-thanks").classList.remove("show");
  document.getElementById("animation-continue-btn").classList.remove("show");
  document.getElementById("goal-complete-banner").classList.remove("show");
  stopGoalCelebration();
  stopProfileCoinRain();

  const current=activeGoal();
  if(current && current.id!=="account" && current.current>=current.goal){
    const next=state.goals.findIndex(g=>g.id==="account" || g.current<g.goal);
    if(next>=0)state.activeGoal=next;
    save();
  }
  render();
});

let goalCelebrationAnim=null;
function startGoalCelebration(){
  const canvas=document.getElementById("celebration-canvas");
  const ctx=canvas.getContext("2d");
  const dpr=devicePixelRatio||1;
  canvas.width=canvas.clientWidth*dpr;
  canvas.height=canvas.clientHeight*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const w=canvas.clientWidth,h=canvas.clientHeight;
  const colors=["#ffcf4d","#ff7f68","#6ab5ff","#78d79f","#ff91c3","#9b87ff"];
  const parts=Array.from({length:120},()=>({
    x:Math.random()*w,y:-20-Math.random()*h*.5,
    vx:(Math.random()-.5)*2.4,vy:2+Math.random()*3.5,
    r:3+Math.random()*4,a:Math.random()*6.28,
    c:colors[Math.floor(Math.random()*colors.length)]
  }));

  function draw(){
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.a+=.07;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
      ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);
      ctx.restore();
      if(p.y>h+20){p.y=-20;p.x=Math.random()*w}
    });
    goalCelebrationAnim=requestAnimationFrame(draw);
  }
  draw();
}
function stopGoalCelebration(){
  if(goalCelebrationAnim)cancelAnimationFrame(goalCelebrationAnim);
  goalCelebrationAnim=null;
  const canvas=document.getElementById("celebration-canvas");
  if(canvas){
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
}

let profileCoinTimer=null;
function startProfileCoinRain(){
  const wrap=document.getElementById("profile-coin-rain");
  stopProfileCoinRain();
  const photo=state.photo||"robin.jpg";

  let count=0;
  profileCoinTimer=setInterval(()=>{
    if(count++>26){clearInterval(profileCoinTimer);profileCoinTimer=null;return}
    const coin=document.createElement("div");
    coin.className="profile-coin";
    coin.style.left=`${4+Math.random()*88}%`;
    coin.style.animationDuration=`${3.8+Math.random()*2.5}s`;
    coin.style.animationDelay=`${Math.random()*.25}s`;
    coin.style.backgroundImage=`url("${photo}")`;
    wrap.appendChild(coin);
    setTimeout(()=>coin.remove(),7000);
  },120);
}
function stopProfileCoinRain(){
  if(profileCoinTimer)clearInterval(profileCoinTimer);
  profileCoinTimer=null;
  const wrap=document.getElementById("profile-coin-rain");
  if(wrap)wrap.innerHTML="";
}

let confettiAnim=null,particles=[];
function startConfetti(){
  const canvas=document.getElementById("confetti-canvas"),ctx=canvas.getContext("2d");
  canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=canvas.clientHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const colors=["#59c38b","#ffce4b","#ff795f","#63a9ff","#ff86b6","#8b79ff"];
  particles=Array.from({length:95},()=>({x:Math.random()*w,y:-20-Math.random()*h*.5,vx:(Math.random()-.5)*2.8,vy:2.2+Math.random()*4,r:3+Math.random()*5,a:Math.random()*6.28,c:colors[Math.floor(Math.random()*colors.length)]}));
  const draw=()=>{ctx.clearRect(0,0,w,h);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=.08;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();if(p.y>h+20){p.y=-20;p.x=Math.random()*w}});confettiAnim=requestAnimationFrame(draw)};draw();setTimeout(stopConfetti,4200)
}
function stopConfetti(){if(confettiAnim)cancelAnimationFrame(confettiAnim);confettiAnim=null}
normalizeGoalOrder();save();render();setAmount(20);loadCentralState();

// v1.4: child-specific Droompot share copy.
document.querySelectorAll(".share-btn").forEach(btn=>{
  btn.addEventListener("click",async e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const shareData={
      title:`Het verlanglijstje van ${state.childName}`,
      text:`🎁✨ Bekijk het verlanglijstje van ${state.childName} op Droompot! 🐷💛`,
      url:"https://www.droompot.nl"
    };
    try{
      if(navigator.share) await navigator.share(shareData);
      else{
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast("Link gekopieerd!",true);
      }
    }catch{}
  },true);
});

function celebrateClaimedWish(title){
  toast(`🎁 Wat leuk! ${title} is gekozen. Dankjewel! 💛`,true);
  if(typeof launchConfetti==="function")launchConfetti();
}
