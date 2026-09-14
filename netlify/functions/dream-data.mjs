import { getStore } from "@netlify/blobs";

const STORE = "droompot-v17";
const DATA_KEY = "main";
const VISITOR_KEY = "visitors";

const INITIAL_DATA = {
  childName: "Noï", birthDate: "2024-09-26", theme: "green", photo: "", activeGoal: 0,
  wishes: [
    {id:1,title:"LEGO Creator set",price:39.99,link:"https://www.lego.com",note:"Noï vindt voertuigen heel leuk",emoji:"🧱",claimed:false},
    {id:2,title:"Voetbal",price:24.95,link:"",note:"Maat 5",emoji:"⚽",claimed:false},
    {id:3,title:"Kinderboek over ruimte",price:17.50,link:"",note:"Een mooi boek om samen te lezen",emoji:"🚀",claimed:true},
    {id:4,title:"Dagje dierentuin",price:0,link:"",note:"Een ervaring is ook een cadeau",emoji:"🦁",claimed:false}
  ],
  goals: [
    {id:"bike",title:"Nieuwe fiets",icon:"🚲",type:"Spaardoel",description:"Voor lekker fietsen naar school en op avontuur.",current:80,goal:200},
    {id:"license",title:"Rijbewijs",icon:"🚗",type:"Voor later",description:"Een mooie start richting zelfstandigheid.",current:125,goal:2500},
    {id:"study",title:"Studeren",icon:"🎓",type:"Voor later",description:"Een extra potje voor leren en ontwikkelen.",current:450,goal:5000},
    {id:"account",title:"Algemene spaarrekening",icon:"💰",type:"Spaarrekening",description:"Vrij sparen voor later.",current:340,goal:1000}
  ],
  transactions: [
    {name:"Oma Els",amount:10,message:"Voor een mooie droom ❤️",goal:"Nieuwe fiets",cash:false,demo:true},
    {name:"Opa Jan",amount:25,message:"Veel plezier ermee!",goal:"Nieuwe fiets",cash:false,demo:true},
    {name:"Papa & mama",amount:20,message:"In de spaarpot gedaan",goal:"Nieuwe fiets",cash:true,demo:true}
  ]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"},
  });
}

function adminOk(req) {
  const expectedUser = Netlify.env.get("ADMIN_USERNAME");
  const expectedPassword = Netlify.env.get("ADMIN_PASSWORD");
  return Boolean(expectedUser && expectedPassword &&
    req.headers.get("x-dream-user") === expectedUser &&
    req.headers.get("x-dream-password") === expectedPassword);
}

function safeText(value, max=500) {
  return String(value ?? "").trim().slice(0,max);
}

export default async (req) => {
  const store = getStore(STORE,{consistency:"strong"});

  if (req.method === "GET") {
    let [data, visitors] = await Promise.all([
      store.get(DATA_KEY,{type:"json"}),
      store.get(VISITOR_KEY,{type:"json"})
    ]);
    if (!data) {
      data = structuredClone(INITIAL_DATA);
      await store.setJSON(DATA_KEY,data);
    }
    return json({data, uniqueVisitors:Array.isArray(visitors?.ids)?visitors.ids.length:0});
  }

  if (req.method === "PUT") {
    if (!adminOk(req)) return json({error:"Unauthorized"},401);
    const body = await req.json();
    if (!body || typeof body !== "object") return json({error:"Invalid body"},400);
    await store.setJSON(DATA_KEY, body);
    return json({ok:true,data:body});
  }

  if (req.method === "POST") {
    const body = await req.json().catch(()=>({}));
    const action = body?.action;

    if (action === "login") {
      return adminOk(req) ? json({ok:true}) : json({error:"Unauthorized"},401);
    }

    if (action === "visit") {
      const visitorId=safeText(body.visitorId,120);
      if (!visitorId) return json({error:"Missing visitor id"},400);
      const visitors=(await store.get(VISITOR_KEY,{type:"json"})) || {ids:[]};
      const ids=Array.isArray(visitors.ids)?visitors.ids:[];
      if (!ids.includes(visitorId)) {
        ids.push(visitorId);
        if (ids.length>10000) ids.splice(0,ids.length-10000);
        await store.setJSON(VISITOR_KEY,{ids});
      }
      return json({ok:true,uniqueVisitors:ids.length});
    }

    if (action === "contribution") {
      const amount=Number(body.amount);
      if (!Number.isFinite(amount) || amount<=0 || amount>10000) return json({error:"Invalid amount"},400);
      const goalId=safeText(body.goalId,80);
      const current=await store.get(DATA_KEY,{type:"json"});
      if (!current || !Array.isArray(current.goals)) return json({error:"Droompot is nog niet geïnitialiseerd"},409);
      const goal=current.goals.find(g=>String(g.id)===goalId);
      if (!goal) return json({error:"Goal not found"},404);

      const photo=safeText(body.photo,260000);
      if (photo && !/^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(photo)) return json({error:"Invalid photo"},400);

      goal.current=Math.max(0,Number(goal.current)||0)+amount;
      if (!Array.isArray(current.transactions)) current.transactions=[];
      current.transactions.unshift({
        name:safeText(body.name,80)||"Anoniem",
        amount,
        message:safeText(body.message,280),
        goal:safeText(goal.title,120),
        cash:Boolean(body.cash),
        photo
      });
      current.transactions=current.transactions.slice(0,250);
      await store.setJSON(DATA_KEY,current);
      return json({ok:true,data:current});
    }

    return json({error:"Unknown action"},400);
  }

  return json({error:"Method not allowed"},405);
};
