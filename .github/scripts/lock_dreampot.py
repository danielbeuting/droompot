from pathlib import Path

# Add visible lock text to both Droompot entry buttons.
p = Path('index.html')
s = p.read_text()
s = s.replace('<strong>Ga naar Droompot</strong>\n              <small>Bekijk spaardoelen en draag bij</small>', '<strong>🔒 Ga naar Droompot</strong>\n              <small>Alleen toegankelijk met pincode</small>')
s = s.replace('<strong>Ga naar Droompot</strong>\n          <small>Bekijk spaardoelen en draag bij</small>', '<strong>🔒 Ga naar Droompot</strong>\n          <small>Alleen toegankelijk met pincode</small>')
p.write_text(s)

# Gate all routes to screen-home with PIN 0112 for the browser session.
p = Path('app.js')
s = p.read_text()
marker = 'function show(name){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("screen-"+name).classList.add("active");window.scrollTo(0,0)}\ndocument.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.back)));'
replacement = '''function show(name){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById("screen-"+name).classList.add("active");window.scrollTo(0,0)}
const DREAM_ACCESS_KEY="droompot-v17-dream-access";
function hasDreamAccess(){return sessionStorage.getItem(DREAM_ACCESS_KEY)==="true";}
function requestDreamAccess(){
  if(hasDreamAccess())return true;
  const pin=window.prompt("🔒 Droompot is tijdelijk afgeschermd. Voer de pincode in:");
  if(pin===null)return false;
  if(pin.trim()==="0112"){
    sessionStorage.setItem(DREAM_ACCESS_KEY,"true");
    toast("Droompot ontgrendeld ✓",true);
    return true;
  }
  toast("Onjuiste pincode");
  return false;
}
function openLockedDream(){
  if(!requestDreamAccess())return;
  show("home");
  setTimeout(showDemoNoticeOnce,120);
}
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>{
  if(b.dataset.back==="home"&&!requestDreamAccess())return;
  show(b.dataset.back);
}));'''
if marker in s:
    s = s.replace(marker, replacement, 1)

old = '''document.getElementById("start-dream-btn").addEventListener("click",()=>{show("home");setTimeout(showDemoNoticeOnce,120)});
document.getElementById("start-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("home-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("wishlist-dreampot-btn").addEventListener("click",()=>{show("home");setTimeout(showDemoNoticeOnce,120)});'''
new = '''document.getElementById("start-dream-btn").addEventListener("click",openLockedDream);
document.getElementById("start-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("home-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("wishlist-dreampot-btn").addEventListener("click",openLockedDream);'''
if old in s:
    s = s.replace(old, new, 1)
p.write_text(s)

# Make the wishlist the clear primary action and Droompot look visually locked.
p = Path('style.css')
s = p.read_text()
marker = '/* v1.7 locked start hierarchy */'
if marker not in s:
    s += r'''

/* v1.7 locked start hierarchy */
#screen-start .start-wrap{
  min-height:100dvh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:38px 0 calc(26px + env(safe-area-inset-bottom));
}
#screen-start .start-choice-grid{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:14px;
}
#screen-start .start-choice.wishlist{
  order:1;
  width:100%;
  min-height:138px;
  padding:24px 22px !important;
  border-radius:28px !important;
  grid-template-columns:72px 1fr 26px !important;
  box-shadow:0 18px 42px rgba(205,145,25,.25) !important;
}
#screen-start .start-choice.wishlist .start-choice-icon{
  width:72px !important;
  height:72px !important;
  border-radius:22px !important;
  font-size:36px !important;
}
#screen-start .start-choice.wishlist strong{
  font-size:20px !important;
  line-height:1.15;
}
#screen-start .start-choice.wishlist small{
  display:block;
  margin-top:5px;
  font-size:12px !important;
}
#screen-start .start-choice.dream{
  order:2;
  position:relative;
  width:72%;
  min-height:64px !important;
  margin-top:34px;
  padding:10px 13px !important;
  border:1px solid #d7d7db !important;
  border-radius:18px !important;
  grid-template-columns:38px 1fr auto !important;
  background:#ececef !important;
  color:#8c8c93 !important;
  box-shadow:none !important;
  filter:grayscale(1);
  opacity:.82;
}
#screen-start .start-choice.dream:before{
  content:'Nog niet beschikbaar';
  position:absolute;
  left:50%;
  top:-22px;
  transform:translateX(-50%);
  color:#9a9aa0;
  font-size:9px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.08em;
  white-space:nowrap;
}
#screen-start .start-choice.dream .start-choice-icon{
  width:38px !important;
  height:38px !important;
  border-radius:12px !important;
  background:#dedee2 !important;
}
#screen-start .start-choice.dream .start-choice-icon img{
  width:34px !important;
  height:34px !important;
  opacity:.65;
}
#screen-start .start-choice.dream strong{
  font-size:12px !important;
  color:#77777e !important;
}
#screen-start .start-choice.dream small{
  font-size:9px !important;
  color:#9b9ba1 !important;
}
#screen-start .start-choice.dream b{
  color:#aaaab0 !important;
}
'''
p.write_text(s)
