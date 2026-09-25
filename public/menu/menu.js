const MENU=window.MENU||[];
const IS_RESORT=location.hostname.indexOf("resort.")===0;

const siteName=document.getElementById("siteName");
if(siteName) siteName.innerHTML=IS_RESORT?"Chamtaburu<br>Eco Resort":"Chamtaburu<br>Eco Village";
const siteTag=document.getElementById("siteTag");
if(siteTag) siteTag.textContent=IS_RESORT
  ? "Home-style food, cooked fresh in our resort kitchen for every order."
  : "Home-style food, cooked fresh in our village kitchen for every order.";
const siteLink=document.getElementById("siteLink");
if(siteLink){
  const host=IS_RESORT?"resort.chamtaburu.in":"chamtaburu.in";
  siteLink.href="https://"+host;
  siteLink.textContent=host;
}

const nav=document.getElementById("nav"), main=document.getElementById("menu");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
MENU.forEach(s=>{
  const a=document.createElement("a");a.className="chip";a.href="#"+s.id;a.textContent=s.t;nav.appendChild(a);
  const sec=document.createElement("section");sec.id=s.id;
  if(s.feature) sec.className="feature";
  let html=`<h2>${esc(s.t)}</h2>`+(s.note?`<p class="note">${esc(s.note)}</p>`:"")+"<ul>";
  s.items.forEach(it=>{
    const type=it[it.length-1], price=it[it.length-2], qty=it.length===4?it[1]:"";
    const label={veg:"Veg",egg:"Contains egg",nonveg:"Non-veg"}[type];
    html+=`<li class="${type}"><span class="dot" role="img" aria-label="${label}"></span><span class="name">${esc(it[0])}</span>${qty?`<span class="qty">${esc(qty)}</span>`:""}<span class="lead"></span><span class="price">${price}</span></li>`;
  });
  html+="</ul>"+(s.foot?`<p class="note">${esc(s.foot)}</p>`:"");
  sec.innerHTML=html;
  sec.dataset.hasveg=s.items.some(i=>i[i.length-1]==="veg")?"1":"0";
  main.appendChild(sec);
});
const tog=document.getElementById("vegToggle");
tog.addEventListener("change",()=>{
  document.body.classList.toggle("vegonly",tog.checked);
  document.querySelectorAll("main section").forEach(s=>s.classList.toggle("empty",s.dataset.hasveg==="0"));
  nav.querySelectorAll(".chip").forEach(c=>{
    const s=document.querySelector(c.getAttribute("href"));
    c.hidden=tog.checked&&s.dataset.hasveg==="0";
  });
});
