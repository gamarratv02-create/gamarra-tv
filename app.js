const placeholderImages = {
  general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
  police: "https://images.unsplash.com/photo-1453873531674-2151bcd01707?auto=format&fit=crop&w=900&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80",
  region: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
};

const news = [
  {id:1,category:"Gamarra",slug:"gamarra-noticia-destacada",title:"Gamarra TV: información y actualidad de nuestra comunidad",summary:"Este espacio está preparado para presentar las noticias más importantes de Gamarra y la región.",image:placeholderImages.city,date:"15 de septiembre de 2026",featured:true},
  {id:2,category:"Judicial",slug:"noticia-judicial-destacada",title:"Autoridades adelantan acciones para fortalecer la seguridad en la región",summary:"Información en desarrollo. Aquí podrás publicar el contenido completo desde el panel de administración.",image:placeholderImages.police,date:"15 de septiembre de 2026",featured:true},
  {id:3,category:"Deportes",slug:"noticia-deportiva-destacada",title:"Toda la actualidad deportiva en Gamarra TV",summary:"Resultados, partidos, transmisiones y protagonistas del deporte regional.",image:placeholderImages.sports,date:"15 de septiembre de 2026",featured:true},
  {id:4,category:"Región",slug:"actualidad-region",title:"Noticias de última hora del sur del Cesar y Magdalena Medio",summary:"Conoce las noticias que son noticia en nuestra región.",image:placeholderImages.region,date:"15 de septiembre de 2026"},
  {id:5,category:"Gamarra",slug:"informacion-gamarra",title:"Gamarra, protagonista de las noticias locales",summary:"La información de nuestros barrios, corregimientos y comunidades.",image:placeholderImages.city,date:"14 de septiembre de 2026"},
  {id:6,category:"Judicial",slug:"seguridad-region",title:"Información judicial: conozca los hechos de la región",summary:"Noticias judiciales con información clara y responsable.",image:placeholderImages.police,date:"14 de septiembre de 2026"},
  {id:7,category:"Deportes",slug:"deporte-regional",title:"El deporte regional tiene su espacio en Gamarra TV",summary:"Seguimos a nuestros equipos y deportistas.",image:placeholderImages.sports,date:"13 de septiembre de 2026"},
  {id:8,category:"Nacionales",slug:"noticia-nacional",title:"Las principales noticias nacionales",summary:"Información de Colombia y sus regiones.",image:placeholderImages.general,date:"13 de septiembre de 2026"}
];

const app = document.getElementById("app");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click",()=>mainNav.classList.toggle("open"));
mainNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>mainNav.classList.remove("open")));

function card(n){
  return `<a class="news-card" href="#/noticia/${n.slug}">
    <div class="card-image" style="background-image:url('${n.image}')"></div>
    <div class="card-body">
      <span class="category-label">${n.category}</span>
      <h3>${n.title}</h3>
      <p>${n.summary}</p>
      <div class="date" style="margin-top:10px">${n.date}</div>
    </div>
  </a>`;
}
function mini(n){
  return `<a class="mini-item" href="#/noticia/${n.slug}">
    <div class="mini-thumb" style="background-image:url('${n.image}')"></div>
    <div><strong>${n.title}</strong><div class="date" style="margin-top:4px">${n.category} · ${n.date}</div></div>
  </a>`;
}
function live(){
  return `<section class="live-section container">
    <div class="live-box">
      <div class="live-title"><strong>🔴 ESTÁS VIENDO GAMARRA TV</strong><span class="live-badge">EN VIVO</span></div>
      <div class="video-placeholder">
        <div>
          <div class="play">▶</div>
          <p>Tu señal en vivo aparecerá aquí</p>
          <small>En este punto conectaremos el enlace M3U8/HLS de Gamarra TV.</small>
        </div>
      </div>
    </div>
  </section>`;
}
function home(){
  const featured = news.filter(n=>n.featured);
  const main = featured[0];
  const side = featured.slice(1,3);
  return `${live()}
  <section class="hero container">
    <div class="hero-grid">
      <a class="hero-main" href="#/noticia/${main.slug}">
        <div class="hero-image" style="background-image:url('${main.image}')"></div>
        <div class="hero-content"><span class="tag">${main.category}</span><h1>${main.title}</h1><p>${main.summary}</p></div>
      </a>
      <div class="hero-side">${side.map(n=>`<a class="story-card side-story" href="#/noticia/${n.slug}"><div class="story-image" style="background-image:url('${n.image}')"></div><div class="side-content"><span class="tag">${n.category}</span><h3>${n.title}</h3><div class="date">${n.date}</div></div></a>`).join("")}</div>
    </div>
  </section>
  <section class="section container">
    <div class="section-head"><h2>📰 Últimas noticias</h2><a href="#/categoria/noticias">Ver todas →</a></div>
    <div class="news-grid">${news.slice(0,6).map(card).join("")}</div>
  </section>
  ${categoryBlock("Gamarra","gamarra")}
  ${categoryBlock("Judicial","judicial")}
  ${categoryBlock("Deportes","deportes")}
  ${categoryBlock("Región","region")}`;
}
function categoryBlock(name,key){
  const list = news.filter(n=>n.category.toLowerCase()===key).slice(0,3);
  if(!list.length) return "";
  return `<section class="section container"><div class="section-head"><h2>${name}</h2><a href="#/categoria/${key}">Ver más →</a></div><div class="news-grid">${list.map(card).join("")}</div></section>`;
}
function categoryPage(cat){
  const list = news.filter(n=>n.category.toLowerCase()===cat.toLowerCase());
  const title = cat.charAt(0).toUpperCase()+cat.slice(1);
  return `<section class="container page-head"><h1>Noticias de ${title}</h1><p>Información y actualidad de ${title} en Gamarra TV.</p></section>
  <section class="section container"><div class="category-grid">${list.length?list.map(card).join(""):`<div class="empty">Todavía no hay noticias publicadas en esta categoría.</div>`}</div></section>`;
}
function articlePage(slug){
  const n = news.find(x=>x.slug===slug);
  if(!n) return `<section class="container page-head"><h1>Noticia no encontrada</h1><p>La noticia que buscas no está disponible.</p></section>`;
  return `<article class="article">
    <span class="tag">${n.category}</span>
    <h1>${n.title}</h1>
    <div class="article-meta">Publicado el ${n.date} · Gamarra TV</div>
    <img src="${n.image}" alt="${n.title}">
    <p class="lead">${n.summary}</p>
    <div class="article-content">
      <p>Esta es la página individual de la noticia. En la versión conectada a Supabase, aquí aparecerá automáticamente el contenido completo que publiques desde el panel de administración de Gamarra TV.</p>
      <p>El sistema permitirá agregar fotografías, videos de YouTube, etiquetas, fecha, autor y contenido completo. También podrás compartir cada noticia directamente en redes sociales.</p>
      <p><strong>Gamarra TV</strong> continuará informando sobre los hechos más importantes de nuestra comunidad y la región.</p>
    </div>
  </article>`;
}
function simplePage(title, text){
  return `<section class="container page-head"><h1>${title}</h1><p>${text}</p></section>
  <section class="container"><div class="admin-note">Esta sección ya está preparada en el sitio. En la siguiente etapa conectaremos el contenido real, la señal M3U8 y el panel de administración.</div></section>`;
}
function render(){
  const path = location.hash.replace(/^#\/?/,"").replace(/\/$/,"");
  let html;
  if(!path) html=home();
  else if(path==="en-vivo") html=live()+simplePage("Señal en vivo","Mira la señal de Gamarra TV.");
  else if(path.startsWith("noticia/")) html=articlePage(path.split("/")[1]);
  else if(path.startsWith("categoria/")) html=categoryPage(path.split("/")[1]);
  else if(path==="videos") html=simplePage("Videos","Videos y transmisiones de Gamarra TV.");
  else if(path==="programas") html=simplePage("Programas","Conoce nuestra programación.");
  else if(path==="contacto") html=simplePage("Contacto","Próximamente podrás agregar WhatsApp, correo y redes sociales.");
  else html=simplePage("Gamarra TV","Portal de noticias y televisión.");
  app.innerHTML=html;
  window.scrollTo({top:0,behavior:"smooth"});
}
window.addEventListener("hashchange",render);
render();
