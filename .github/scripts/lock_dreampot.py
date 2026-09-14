from pathlib import Path

# Add visible lock text to both Droompot entry buttons.
p = Path('index.html')
s = p.read_text()
s = s.replace('<strong>Ga naar Droompot</strong>\n              <small>Bekijk spaardoelen en draag bij</small>', '<strong>🔒 Ga naar Droompot</strong>\n              <small>Alleen toegankelijk met pincode</small>')
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
if marker not in s:
    raise SystemExit('show/back marker not found')
s = s.replace(marker, replacement, 1)
old = '''document.getElementById("start-dream-btn").addEventListener("click",()=>{show("home");setTimeout(showDemoNoticeOnce,120)});
document.getElementById("start-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("home-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("wishlist-dreampot-btn").addEventListener("click",()=>{show("home");setTimeout(showDemoNoticeOnce,120)});'''
new = '''document.getElementById("start-dream-btn").addEventListener("click",openLockedDream);
document.getElementById("start-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("home-wishlist-btn").addEventListener("click",async()=>{show("wishlist");await refreshWishlistFromCentral()});
document.getElementById("wishlist-dreampot-btn").addEventListener("click",openLockedDream);'''
if old not in s:
    raise SystemExit('dream navigation block not found')
s = s.replace(old, new, 1)
p.write_text(s)
