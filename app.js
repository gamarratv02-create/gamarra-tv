(()=>{'use strict';
const C=window.__SUPABASE_CONFIG__||{};
const sb=window.supabase?.createClient(C.url,C.publishableKey);
const app=document.getElementById('app');
if(!sb){app.innerHTML='<div class="error-box"><h2>No se pudo inicializar Gamarra TV</h2><p>Revisa la configuración de Supabase.</p></div>';return}
const DAYS=[['lunes','LUN',1],['martes','MAR',2],['miercoles','MIÉ',3],['jueves','JUE',4],['viernes','VIE',5],['sabado','SÁB',6],['domingo','DOM',7]];
const CATS=['gamarra','seguridad','judicial','politica','educacion','salud','economia','deportes','region','nacionales','internacionales','entretenimiento'];
const S={session:null,news:[],programs:[],day:null};
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const slugify=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const date=v=>v?new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v)):'';
const shortDate=v=>v?new Intl.DateTimeFormat('es-CO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v)):'';
const time=v=>{if(!v)return'';const [h,m]=String(v).slice(0,5).split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'p.m.':'a.m.'}`};
const dayInfo=k=>DAYS.find(x=>x[0]===k)||DAYS[0];
const today=()=>{const jsDay=new Date().getDay();return [7,1,2,3,4,5,6][jsDay]};
const todayName=()=>DAYS.find(x=>x[2]===today())[0];
const mins=v=>{if(!v)return null;const [h,m]=String(v).slice(0,5).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
function notify(msg,type='success'){const e=document.createElement('div');e.className='alert '+(type==='error'?'alert-error':'alert-success');e.textContent=msg;e.style.cssText='position:fixed;right:16px;bottom:16px;z-index:3000;max-width:460px;box-shadow:0 10px 30px #0003';document.body.appendChild(e);setTimeout(()=>e.remove(),5000)}
function setMeta(n=null){const baseTitle='Gamarra TV | Noticias y Televisión';const title=n?.titulo?`${n.titulo} | Gamarra TV`:baseTitle;const desc=n?.resumen||'Noticias, televisión y actualidad del sur del Cesar y Magdalena Medio.';const image=n?.imagen_url||'https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png';const url=location.href;document.title=title;for(const [id,val] of [['metaDescription',desc],['ogTitle',title],['ogDescription',desc],['ogImage',image],['ogUrl',url],['twitterTitle',title],['twitterDescription',desc],['twitterImage',image]]){const e=document.getElementById(id);if(e)e.setAttribute('content',val)}}
async function session(){S.session=(await sb.auth.getSession()).data.session||null;const a=document.getElementById('authLink');if(a){a.textContent=S.session?'⚙️ Panel':'🔒 Iniciar sesión';a.href=S.session?'#/admin':'#/login'}}
async function loadNews(cat){let q=sb.from('noticias').select('id,titulo,resumen,contenido,imagen_url,categoria,publicada,created_at,slug').eq('publicada',true).order('created_at',{ascending:false}).limit(50);if(cat)q=q.eq('categoria',cat);let r=await q;if(r.error){const q2=sb.from('noticias').select('id,titulo,resumen,contenido,imagen_url,categoria,publicada,created_at').eq('publicada',true).order('created_at',{ascending:false}).limit(50);if(cat)q2=q2.eq('categoria',cat);r=await q2}if(r.error)throw r.error;S.news=r.data||[];return S.news}
async function loadPrograms(){const r=await sb.from('programacion').select('id,dia,dia_semana,hora_inicio,hora_fin,hora,programa,descripcion,imagen_url,activo,created_at').eq('activo',true).order('dia_semana',{ascending:true}).order('hora_inicio',{ascending:true});if(r.error)throw r.error;S.programs=r.data||[];return S.programs}
function newsHref(n){return '#/noticia/'+encodeURIComponent(n.slug||slugify(n.titulo)||n.id)}
function categoryLabel(c){return ({gamarra:'GAMARRA',seguridad:'SEGURIDAD',judicial:'JUDICIAL',politica:'POLÍTICA',educacion:'EDUCACIÓN',salud:'SALUD',economia:'ECONOMÍA',deportes:'DEPORTES',region:'REGIÓN',nacionales:'NACIONALES',internacionales:'INTERNACIONALES',entretenimiento:'ENTRETENIMIENTO'})[String(c||'').toLowerCase()]||String(c||'NOTICIAS').toUpperCase()}
function card(n){const image=n.imagen_url?`<img src="${esc(n.imagen_url)}" alt="${esc(n.titulo)}" loading="lazy">`:'<div class="image-fallback">GAMARRA TV</div>';const reading=Math.max(1,Math.ceil(String(n.contenido||n.resumen||'').length/900));return `<article class="news-card"><a href="${newsHref(n)}"><div class="news-image-wrap">${image}<span class="tag">${esc(categoryLabel(n.categoria))}</span></div><div class="news-body"><h3>${esc(n.titulo)}</h3><p>${esc(n.resumen||'Conozca los detalles de esta noticia en Gamarra TV.')}</p><div class="news-meta"><span>◷ ${esc(shortDate(n.created_at))}</span><span>◴ ${reading} min</span></div><div class="read"><span>LEER NOTICIA</span><span class="arrow">→</span></div></div></a></article>`}
function hero(){const [a,b,c]=S.news;if(!a)return'<div class="empty"><h2>No hay noticias publicadas</h2><p>Las nuevas noticias aparecerán aquí automáticamente.</p></div>';const feature=n=>n?`<a class="feature" href="${newsHref(n)}">${n.imagen_url?`<img src="${esc(n.imagen_url)}" alt="${esc(n.titulo)}">`:''}<div class="feature-content"><span class="tag">${esc(categoryLabel(n.categoria))}</span><h2>${esc(n.titulo)}</h2></div></a>`:'';return `<section class="hero"><div class="container hero-grid"><a class="hero-main" href="${newsHref(a)}">${a.imagen_url?`<img src="${esc(a.imagen_url)}" alt="${esc(a.titulo)}">`:''}<div class="hero-content"><span class="tag">${esc(categoryLabel(a.categoria))}</span><h1>${esc(a.titulo)}</h1><p>${esc(a.resumen||'Noticias y actualidad en Gamarra TV.')}</p><span class="hero-link">Leer noticia →</span></div></a><div class="features">${feature(b)}${feature(c)}</div></div></section>`}
function scheduleRows(day){const di=dayInfo(day);return S.programs.filter(p=>String(p.dia||'').toLowerCase()===day||Number(p.dia_semana)===di[2]).sort((a,b)=>String(a.hora_inicio||a.hora||'').localeCompare(String(b.hora_inicio||b.hora||'')))}
function getCurrent(rows,day){if(day!==todayName())return null;const now=new Date();const nowM=now.getHours()*60+now.getMinutes();for(const p of rows){const st=mins(p.hora_inicio||p.hora),en=mins(p.hora_fin);if(st===null)continue;if(en===null&&nowM>=st)return p;if(en!==null){if(en>=st&&nowM>=st&&nowM<en)return p;if(en<st&&(nowM>=st||nowM<en))return p}}return null}
function getNext(rows,current,day){if(!rows.length||day!==todayName())return null;const nowM=new Date().getHours()*60+new Date().getMinutes();const after=rows.filter(p=>{const st=mins(p.hora_inicio||p.hora);return st!==null&&st>nowM});return after[0]||null}
function live(){
 const d=S.day||todayName(),rows=scheduleRows(d),current=getCurrent(rows,d),next=getNext(rows,current,d);
 const fallback=C.logo||'https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png';
 const rowsHtml=rows.length?rows.map(p=>{
   const is=p.id===current?.id, logo=p.imagen_url||fallback;
   return `<div class="program ${is?'now':''}">
     <div class="program-logo-wrap"><img class="program-logo" src="${esc(logo)}" alt="Logo de ${esc(p.programa||'programa')}" onerror="this.onerror=null;this.src='${esc(fallback)}'"></div>
     <div class="program-info">${is?'<div class="now-badge">🔴 AHORA</div>':''}<span class="time">${esc(time(p.hora_inicio||p.hora))}${p.hora_fin?' — '+esc(time(p.hora_fin)):''}</span><strong>${esc(p.programa)}</strong>${p.descripcion?`<small>${esc(p.descripcion)}</small>`:''}</div>
   </div>`
 }).join(''):'<div class="empty">No hay programación publicada para este día.</div>';
 return `<section class="live-section"><div class="container"><div class="live-title"><div><span class="live-kicker">GTV MEDIOS</span><h2>Gamarra TV <b>EN VIVO</b></h2></div><span class="live-pill"><i></i> SEÑAL EN DIRECTO</span></div><div class="live-layout"><div class="player-column"><div class="player"><iframe src="${esc(C.liveUrl||'')}" title="Señal en vivo de Gamarra TV" allow="autoplay;fullscreen" allowfullscreen></iframe><div class="player-label"><i></i> GTV EN VIVO</div></div><div class="live-note">Señal abierta de Gamarra TV</div></div><aside class="schedule"><div class="schedule-head"><div><span>HOY EN GTV</span><h3>PROGRAMACIÓN</h3></div><span class="schedule-day">${esc(dayInfo(d)[1])}</span></div><div class="days">${DAYS.map(x=>`<button class="day ${d===x[0]?'active':''}" data-day="${x[0]}">${x[1]}</button>`).join('')}</div><div class="schedule-list">${rowsHtml}</div><div class="next-box">${next?`<span>PRÓXIMO</span><strong>${esc(next.programa)}</strong><small>${esc(time(next.hora_inicio||next.hora))}</small>`:`<span>PROGRAMACIÓN</span><strong>${current?'Al aire en este momento':'Fuera de programación'}</strong>`}</div></aside></div></div></section>`
}
function newsPage(initialCat=''){
 setMeta();
 const selected=String(initialCat||'').toLowerCase();
 app.innerHTML=`<section class="news-page"><div class="container">
   <div class="news-page-hero"><div><span class="kicker">GTV NOTICIAS</span><h1>Noticias</h1><p>Encuentra todas las noticias de Gamarra TV en un solo lugar.</p></div><div class="news-page-count" id="newsCount">${S.news.length} noticias</div></div>
   <div class="news-tools">
    <div class="news-search-box"><span>🔎</span><input id="newsSearch" type="search" placeholder="Buscar noticias, temas o palabras clave..." autocomplete="off"></div>
    <div class="news-filter"><label for="newsCategory">CATEGORÍA</label><select id="newsCategory"><option value="">Todas las categorías</option>${CATS.map(x=>`<option value="${x}" ${selected===x?'selected':''}>${esc(categoryLabel(x))}</option>`).join('')}</select></div>
   </div>
   <div class="news-category-chips" id="newsChips"><button class="news-chip active" data-cat="">Todas</button>${CATS.map(x=>`<button class="news-chip" data-cat="${x}">${esc(categoryLabel(x))}</button>`).join('')}</div>
   <div class="category-news-grid news-search-grid" id="newsResults"></div>
 </div></section>`;
 const input=document.getElementById('newsSearch'),select=document.getElementById('newsCategory'),results=document.getElementById('newsResults'),count=document.getElementById('newsCount');
 const chips=[...document.querySelectorAll('.news-chip')];
 let activeCat=selected;
 function paint(){
   const term=String(input.value||'').trim().toLowerCase();
   const filtered=S.news.filter(n=>{
     const cat=String(n.categoria||'').toLowerCase();
     if(activeCat&&cat!==activeCat)return false;
     if(!term)return true;
     return [n.titulo,n.resumen,n.contenido,n.categoria].some(v=>String(v||'').toLowerCase().includes(term));
   });
   results.innerHTML=filtered.length?filtered.map(card).join(''):`<div class="empty news-empty"><h2>No encontramos noticias</h2><p>Prueba con otra palabra o selecciona otra categoría.</p></div>`;
   count.textContent=`${filtered.length} ${filtered.length===1?'noticia':'noticias'}`;
   select.value=activeCat;
   chips.forEach(c=>c.classList.toggle('active',c.dataset.cat===activeCat));
 }
 input.oninput=paint;
 select.onchange=()=>{activeCat=select.value;paint()};
 chips.forEach(ch=>ch.onclick=()=>{activeCat=ch.dataset.cat;paint()});
 paint();
}
function homeSections(){return `<section class="section category-sections"><div class="container">${CATS.map(cat=>{const items=S.news.filter(n=>String(n.categoria||'').toLowerCase()===cat).slice(0,4);if(!items.length)return '';return `<div class="news-category-section"><div class="section-head compact"><div><span class="kicker">GTV NOTICIAS</span><h2>${esc(categoryLabel(cat))}</h2></div><a class="section-more" href="#/categoria/${cat}">Ver todas →</a></div><div class="section-news-grid">${items.map(card).join('')}</div></div>`}).join('')}</div></section>`}
function bindHome(){bindLive();const p=document.getElementById('prev'),n=document.getElementById('next'),c=document.getElementById('carousel');if(p)p.onclick=()=>c.scrollBy({left:-390,behavior:'smooth'});if(n)n.onclick=()=>c.scrollBy({left:390,behavior:'smooth'});const first=S.news[0];if(first)document.getElementById('breakingText').textContent=first.titulo}
function bindLive(){document.querySelectorAll('.day').forEach(b=>b.onclick=()=>{S.day=b.dataset.day;render()})}
async function findArticle(key){let r=await sb.from('noticias').select('id,titulo,resumen,contenido,imagen_url,categoria,publicada,created_at,slug').eq('publicada',true);if(r.error)throw r.error;const rows=r.data||[];return rows.find(n=>String(n.slug||'')===key)||rows.find(n=>String(n.id)===key)||rows.find(n=>slugify(n.titulo)===key)}
function shareArticle(n){const url=location.href;const text=`${n.titulo} — Gamarra TV`;const share=async()=>{try{if(navigator.share){await navigator.share({title:n.titulo,text:`${n.resumen||'Lee la noticia en Gamarra TV.'}\n\n${text}`,url});notify('Compartido correctamente')}else{await navigator.clipboard.writeText(url);notify('Enlace copiado para compartir')}}catch(e){if(e.name!=='AbortError')notify('No se pudo compartir','error')}};return `<div class="share-row"><button class="share-main" id="shareNews">↗ COMPARTIR NOTICIA</button><button class="share-copy" id="copyNews">🔗 Copiar enlace</button></div>`}
async function article(key){const n=await findArticle(key);if(!n){setMeta();app.innerHTML='<div class="error-box"><h2>Noticia no encontrada</h2><p>La noticia que buscas no está disponible.</p><a class="back-link" href="#/">← Volver al inicio</a></div>';return}setMeta(n);const paragraphs=String(n.contenido||'').split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');app.innerHTML=`<article class="article"><div class="article-inner"><a class="back-link" href="#/">← Volver a noticias</a><span class="tag">${esc(categoryLabel(n.categoria))}</span><h1>${esc(n.titulo)}</h1><div class="summary">${esc(n.resumen||'')}</div><div class="date">Publicado el ${esc(date(n.created_at))}</div>${n.imagen_url?`<img class="main-image" src="${esc(n.imagen_url)}" alt="${esc(n.titulo)}">`:''}<div class="article-tools">${shareArticle(n)}</div><div class="article-content">${paragraphs}</div><div class="article-bottom-share">${shareArticle(n)}</div></div></article>`;const share=async()=>{const url=location.href;try{if(navigator.share)await navigator.share({title:n.titulo,text:`${n.resumen||'Lee esta noticia en Gamarra TV.'}\n${url}`,url});else{await navigator.clipboard.writeText(url);notify('Enlace copiado para compartir')}}catch(e){if(e.name!=='AbortError')notify('No se pudo compartir','error')}};document.querySelectorAll('#shareNews').forEach(x=>x.onclick=share);document.querySelectorAll('#copyNews').forEach(x=>x.onclick=async()=>{try{await navigator.clipboard.writeText(location.href);notify('Enlace de la noticia copiado')}catch(e){notify('No se pudo copiar el enlace','error')}})}
function login(){setMeta();app.innerHTML=`<section class="login-page"><div class="container narrow"><div class="panel login-panel"><span class="kicker">GTV PANEL</span><h1>🔒 Iniciar sesión</h1><p>Accede para publicar noticias y administrar la programación de Gamarra TV.</p><form id="loginForm"><div class="field"><label>Correo</label><input type="email" name="email" autocomplete="email" required></div><div class="field"><label>Contraseña</label><input type="password" name="password" autocomplete="current-password" required></div><button class="btn btn-dark">Iniciar sesión</button></form><div id="loginMsg"></div></div></div></section>`;document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const r=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(r.error){document.getElementById('loginMsg').innerHTML=`<div class="alert alert-error">${esc(r.error.message)}</div>`;return}S.session=r.data.session;await session();location.hash='#/admin'}}
async function admin(){
 if(!S.session){location.hash='#/login';return}
 const [nr,pr]=await Promise.all([
  sb.from('noticias').select('*').order('created_at',{ascending:false}).limit(100),
  sb.from('programacion').select('*').order('dia_semana').order('hora_inicio')
 ]);
 if(nr.error) throw nr.error;
 if(pr.error) throw pr.error;
 const news=nr.data||[], programs=pr.data||[];
 app.innerHTML=`<section class="admin"><div class="container"><div class="panel">
 <div class="section-head"><div><span class="kicker">PANEL ADMINISTRATIVO</span><h2>Administrar Gamarra TV</h2><p class="section-subtitle">Publica, edita y elimina noticias y programas desde este mismo panel.</p></div><button id="logout" class="btn btn-dark">Cerrar sesión</button></div>
 <div id="adminMsg"></div>
 <div class="admin-section"><div class="admin-section-head"><div><span class="kicker">CONTENIDOS</span><h3>📰 Noticias</h3></div><button id="cancelNewsEdit" class="btn btn-light hidden">Cancelar edición</button></div>
 <form id="newsForm" class="form-grid"><input type="hidden" name="news_id" value=""><div class="field full"><label>Título</label><input name="titulo" required></div><div class="field"><label>Categoría</label><select name="categoria">${CATS.map(x=>`<option value="${x}">${categoryLabel(x)}</option>`).join('')}</select></div><div class="field"><label>Imagen URL</label><input name="imagen_url" type="url" placeholder="https://..."></div><div class="field full"><label>Resumen</label><textarea name="resumen" placeholder="Breve resumen para la portada y compartir."></textarea></div><div class="field full"><label>Contenido</label><textarea name="contenido" required placeholder="Escribe el cuerpo completo de la noticia."></textarea></div><div class="field full"><label>Slug</label><input name="slug" placeholder="Se genera automáticamente desde el título"></div><div><label><input type="checkbox" name="publicada" checked> Publicar inmediatamente</label></div><div class="field full"><button id="newsSubmit" class="btn btn-primary">📤 Publicar noticia</button></div></form>
 <div class="admin-list"><h4>Noticias publicadas y borradores</h4>${news.length?news.map(n=>`<div class="admin-item"><div class="admin-item-media">${n.imagen_url?`<img src="${esc(n.imagen_url)}" alt="">`:'<div class="admin-no-image">GTV</div>'}</div><div class="admin-item-info"><span class="tag admin-tag">${esc(categoryLabel(n.categoria))}</span><h4>${esc(n.titulo)}</h4><small>${esc(shortDate(n.created_at))} · ${n.publicada?'Publicada':'Borrador'}</small></div><div class="admin-actions"><button class="btn btn-edit edit-news" data-id="${esc(n.id)}">✏️ Editar</button><button class="btn btn-danger delete-news" data-id="${esc(n.id)}">🗑️ Eliminar</button></div></div>`).join(''):'<div class="empty-admin">No hay noticias registradas.</div>'}</div></div>
 <hr>
 <div class="admin-section"><div class="admin-section-head"><div><span class="kicker">TV</span><h3>📺 Programación</h3></div><button id="cancelProgEdit" class="btn btn-light hidden">Cancelar edición</button></div>
 <form id="progForm" class="form-grid"><input type="hidden" name="programacion_id" value=""><div class="field"><label>Día</label><select name="dia">${DAYS.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></div><div class="field"><label>Programa</label><input name="programa" required>
          <label>Logo / imagen del programa
            <input name="program_imagen_url" type="url" placeholder="https://...">
          </label></div><div class="field"><label>Hora inicio</label><input name="hora_inicio" type="time" required></div><div class="field"><label>Hora final</label><input name="hora_fin" type="time" required></div><div class="field full"><label>Descripción</label><input name="descripcion"></div><div><label><input type="checkbox" name="activo" checked> Activo</label></div><div class="field full"><button id="progSubmit" class="btn btn-primary">📺 Guardar programa</button></div></form>
 <div class="admin-list"><h4>Programas registrados</h4>${programs.length?programs.map(x=>`<div class="admin-item"><div class="admin-item-media">${x.imagen_url?`<img src="${esc(x.imagen_url)}" alt="" onerror="this.style.display='none'">`:'<div class="program-icon">📺</div>'}</div><div class="admin-item-info"><span class="admin-day">${esc(dayInfo(String(x.dia||'').toLowerCase())[1])}</span><h4>${esc(x.programa)}</h4><small>${esc(time(x.hora_inicio||x.hora))}${x.hora_fin?' — '+esc(time(x.hora_fin)) : ''} · ${x.activo?'Activo':'Inactivo'}</small></div><div class="admin-actions"><button class="btn btn-edit edit-program" data-id="${esc(x.id)}">✏️ Editar</button><button class="btn btn-danger delete-program" data-id="${esc(x.id)}">🗑️ Eliminar</button></div></div>`).join(''):'<div class="empty-admin">No hay programas registrados.</div>'}</div></div>
 <div class="admin-help"><b>URLs de noticias:</b> se generan automáticamente con el título, por ejemplo <code>#/noticia/joven-de-21-anos-fue-asesinado</code>.</div>
 </div></div></section>`;
 document.getElementById('logout').onclick=async()=>{await sb.auth.signOut();S.session=null;location.hash='#/'};
 document.getElementById('newsForm').onsubmit=saveNews;
 document.getElementById('progForm').onsubmit=saveProg;
 document.querySelectorAll('.edit-news').forEach(b=>b.onclick=()=>editNews(b.dataset.id,news));
 document.querySelectorAll('.delete-news').forEach(b=>b.onclick=()=>deleteNews(b.dataset.id));
 document.querySelectorAll('.edit-program').forEach(b=>b.onclick=()=>editProgram(b.dataset.id,programs));
 document.querySelectorAll('.delete-program').forEach(b=>b.onclick=()=>deleteProgram(b.dataset.id));
 document.getElementById('cancelNewsEdit').onclick=resetNewsForm;
 document.getElementById('cancelProgEdit').onclick=resetProgForm;
}
function resetNewsForm(){const f=document.getElementById('newsForm');if(!f)return;f.reset();f.elements.news_id.value='';f.elements.publicada.checked=true;document.getElementById('newsSubmit').textContent='📤 Publicar noticia';document.getElementById('cancelNewsEdit').classList.add('hidden')}
function resetProgForm(){const f=document.getElementById('progForm');if(!f)return;f.reset();f.elements.programacion_id.value='';f.elements.activo.checked=true;document.getElementById('progSubmit').textContent='📺 Guardar programa';document.getElementById('cancelProgEdit').classList.add('hidden')}
function editNews(id,news){const n=news.find(x=>String(x.id)===String(id));if(!n)return;const f=document.getElementById('newsForm');f.elements.news_id.value=n.id;f.elements.titulo.value=n.titulo||'';f.elements.categoria.value=n.categoria||'gamarra';f.elements.imagen_url.value=n.imagen_url||'';f.elements.resumen.value=n.resumen||'';f.elements.contenido.value=n.contenido||'';f.elements.slug.value=n.slug||slugify(n.titulo);f.elements.publicada.checked=!!n.publicada;document.getElementById('newsSubmit').textContent='💾 Guardar cambios';document.getElementById('cancelNewsEdit').classList.remove('hidden');f.scrollIntoView({behavior:'smooth',block:'center'})}
async function deleteNews(id){if(!S.session)return;if(!confirm('¿Seguro que deseas eliminar esta noticia? Esta acción no se puede deshacer.'))return;const r=await sb.from('noticias').delete().eq('id',id);if(r.error){notify(r.error.message,'error');return}notify('Noticia eliminada correctamente');await admin()}
function editProgram(id,programs){const x=programs.find(p=>String(p.id)===String(id));if(!x)return;const f=document.getElementById('progForm');f.elements.programacion_id.value=x.id;f.elements.dia.value=x.dia||DAYS.find(d=>d[2]===Number(x.dia_semana))?.[0]||'lunes';f.elements.programa.value=x.programa||'';const logoInput=f.elements.program_imagen_url;if(logoInput)logoInput.value=x.imagen_url||'';f.elements.hora_inicio.value=String(x.hora_inicio||x.hora||'').slice(0,5);f.elements.hora_fin.value=String(x.hora_fin||'').slice(0,5);f.elements.descripcion.value=x.descripcion||'';f.elements.activo.checked=x.activo!==false;document.getElementById('progSubmit').textContent='💾 Guardar cambios';document.getElementById('cancelProgEdit').classList.remove('hidden');f.scrollIntoView({behavior:'smooth',block:'center'})}
async function deleteProgram(id){if(!S.session)return;if(!confirm('¿Seguro que deseas eliminar este programa? Esta acción no se puede deshacer.'))return;const r=await sb.from('programacion').delete().eq('id',id);if(r.error){notify(r.error.message,'error');return}notify('Programa eliminado correctamente');await admin()}
async function saveNews(e){
 e.preventDefault();if(!S.session){notify('Debes iniciar sesión','error');return}
 const f=new FormData(e.currentTarget),id=String(f.get('news_id')||'').trim(),titulo=String(f.get('titulo')||'').trim(),contenido=String(f.get('contenido')||'').trim();
 if(!titulo||!contenido){notify('Título y contenido son obligatorios','error');return}
 let slug=slugify(f.get('slug')||titulo)||`noticia-${Date.now()}`;
 if(!id){const check=await sb.from('noticias').select('id').eq('slug',slug).limit(1);if(!check.error&&check.data?.length)slug=`${slug}-${Date.now().toString().slice(-6)}`}
 const data={titulo,slug,resumen:String(f.get('resumen')||'').trim()||null,contenido,imagen_url:String(f.get('imagen_url')||'').trim()||null,categoria:String(f.get('categoria')||'gamarra').toLowerCase(),publicada:f.get('publicada')==='on'};
 const r=id?await sb.from('noticias').update(data).eq('id',id):await sb.from('noticias').insert(data);
 if(r.error){console.error('Error al guardar noticia:',r.error);notify(`No se pudo guardar la noticia: ${r.error.message||'Error de Supabase'}`,'error');return}
 notify(id?'Noticia actualizada correctamente':'Noticia publicada correctamente');resetNewsForm();await admin()
}
async function saveProg(e){
 e.preventDefault();if(!S.session){notify('Debes iniciar sesión','error');return}
 const f=new FormData(e.currentTarget),id=String(f.get('programacion_id')||'').trim(),dia=String(f.get('dia')),di=dayInfo(dia),data={dia,dia_semana:di[2],hora_inicio:f.get('hora_inicio'),hora_fin:f.get('hora_fin'),hora:f.get('hora_inicio'),programa:String(f.get('programa')||'').trim(),descripcion:String(f.get('descripcion')||'').trim()||null,imagen_url:String(f.get('program_imagen_url')||'').trim()||null,activo:f.get('activo')==='on'};
 if(!data.programa||!data.hora_inicio||!data.hora_fin){notify('Día, programa y horarios son obligatorios','error');return}
 const r=id?await sb.from('programacion').update(data).eq('id',id):await sb.from('programacion').insert(data);
 if(r.error){notify(r.error.message,'error');return}
 notify(id?'Programa actualizado correctamente':'Programa guardado correctamente');resetProgForm();await admin()
}

function contact(){
 setMeta();
 app.innerHTML=`<section class="contact-page">
   <div class="container">
    <div class="contact-hero">
      <span class="contact-kicker">GAMARRA TV</span>
      <h1>Estamos para escucharte</h1>
      <p>¿Tienes una noticia, una denuncia, una propuesta comercial o quieres comunicarte con nuestro equipo? Estamos disponibles para recibir tus mensajes.</p>
    </div>
    <div class="contact-layout">
      <div class="contact-main">
        <span class="kicker">GAMARRA TV</span><h2>COMUNÍCATE CON NOSOTROS</h2>
        <p class="contact-intro">Gamarra TV es un medio de comunicación local comprometido con informar, conectar y dar voz a nuestra comunidad.</p>
        <div class="contact-cards">
          <a class="contact-card" href="https://wa.me/573027826222" target="_blank" rel="noopener"><div class="contact-icon whatsapp">💬</div><div><strong>WhatsApp</strong><span>302 782 0622</span></div></a>
          <a class="contact-card" href="tel:+573027826222"><div class="contact-icon phone">📞</div><div><strong>Teléfono</strong><span>302 782 0622</span></div></a>
          <a class="contact-card" href="mailto:gamarratv02@gmail.com"><div class="contact-icon mail">✉</div><div><strong>Correo electrónico</strong><span>gamarratv02@gmail.com</span></div></a>
          <div class="contact-card"><div class="contact-icon coverage">📍</div><div><strong>Cobertura</strong><span>Gamarra · Sur del Cesar · Magdalena Medio · Región</span></div></div>
        </div>
        <div class="contact-message"><span>GTV</span><strong>Tu canal, tu comunidad, nuestra voz.</strong><small>Gamarra TV · Noticias, televisión y actualidad</small></div>
      </div>
      <aside class="contact-side">
        <div class="side-title"><span class="kicker">CONTACTO</span><h3>GAMARRA TV</h3><p>Conéctate con nuestro equipo</p></div>
        <a href="https://wa.me/573027826222" target="_blank" rel="noopener" class="side-action"><b>💬</b><span><strong>WhatsApp</strong><small>Enviar mensaje</small></span><i>→</i></a>
        <a href="mailto:gamarratv02@gmail.com" class="side-action"><b>✉</b><span><strong>Correo</strong><small>gamarratv02@gmail.com</small></span><i>→</i></a>
        <a href="#/clima" class="side-action"><b>☀️</b><span><strong>El clima</strong><small>Consulta el tiempo en Gamarra</small></span><i>→</i></a>
      </aside>
    </div>
   </div>
 </section>`;
}

async function weatherPage(){
 setMeta();
 app.innerHTML=`<section class="weather-page"><div class="container">
   <div class="weather-hero"><span class="weather-kicker">☁ GAMARRA TV</span><h1>El clima</h1><p>Consulta las condiciones meteorológicas actuales y el pronóstico de los próximos días en cualquier lugar del mundo.</p></div>
   <form id="weatherSearch" class="weather-search"><label>BUSCAR UBICACIÓN</label><div class="weather-search-row"><input id="weatherPlace" placeholder="Ejemplo: Bogotá, Madrid, Miami..." autocomplete="off"><button>⌕ Buscar</button></div></form>
   <div id="weatherResult"><div class="weather-loading">Consultando el clima de Gamarra, Cesar...</div></div>
 </div></section>`;
 const form=document.getElementById('weatherSearch');
 form.onsubmit=async e=>{e.preventDefault();const place=document.getElementById('weatherPlace').value.trim();await fetchWeather(place||'Gamarra, Cesar, Colombia')};
 await fetchWeather('Gamarra, Cesar, Colombia');
}

async function fetchWeather(place){
 const result=document.getElementById('weatherResult');if(!result)return;
 result.innerHTML='<div class="weather-loading">Cargando información meteorológica...</div>';
 try{
  const geo=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=es&format=json`).then(r=>r.json());
  const loc=geo.results?.[0];
  if(!loc)throw new Error('No encontramos esa ubicación. Intenta con otra ciudad.');
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const data=await fetch(url).then(r=>r.json());
  const wcode=data.current.weather_code;
  const currentWeather=weatherInfo(wcode);
  const days=data.daily.time.map((d,i)=>({date:d,code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],rain:data.daily.precipitation_probability_max[i]}));
  result.innerHTML=`<div class="weather-current">
    <div class="weather-location">⌖ ${esc(loc.name)}, ${esc(loc.admin1||'')}, ${esc(loc.country||'')}</div>
    <div class="weather-current-main"><div class="weather-symbol">${currentWeather.icon}</div><div><div class="weather-temp">${Math.round(data.current.temperature_2m)}°<small>${esc(data.current_units?.temperature_2m||'C')}</small></div><strong>${currentWeather.label}</strong><span class="weather-updated">Condiciones actuales</span></div></div>
    <div class="weather-stats"><div><b>💧</b><span>Humedad</span><strong>${Math.round(data.current.relative_humidity_2m)}%</strong></div><div><b>≋</b><span>Viento</span><strong>${Math.round(data.current.wind_speed_10m)} km/h</strong></div><div><b>☔</b><span>Prob. lluvia</span><strong>${Math.round(data.daily.precipitation_probability_max?.[0]||0)}%</strong></div></div>
  </div>
  <div class="forecast-head"><div><span class="kicker">PRONÓSTICO</span><h2>Próximos 7 días</h2></div><small>Actualización automática</small></div>
  <div class="forecast-grid">${days.map((d,i)=>{const inf=weatherInfo(d.code);return `<div class="forecast-card ${i===0?'today':''}"><div class="forecast-day">${i===0?'HOY':formatForecastDay(d.date)}</div><div class="forecast-icon">${inf.icon}</div><strong>${Math.round(d.max)}°</strong><span>Min. ${Math.round(d.min)}°</span><div class="forecast-line"></div><small>☔ ${Math.round(d.rain||0)}%</small></div>`}).join('')}</div>
  <div class="weather-source">Información meteorológica proporcionada por Open-Meteo. Las condiciones pueden cambiar.</div>`;
 }catch(err){result.innerHTML=`<div class="weather-error"><h3>No se pudo consultar el clima</h3><p>${esc(err.message||'Intenta nuevamente.')}</p><button id="weatherRetry" class="btn btn-primary">Volver a Gamarra</button></div>`;const retry=document.getElementById('weatherRetry');if(retry)retry.onclick=()=>fetchWeather('Gamarra, Cesar, Colombia')}
}
function weatherInfo(code){
 const m={0:['☀️','Despejado'],1:['🌤️','Mayormente despejado'],2:['⛅','Parcialmente nublado'],3:['☁️','Nublado'],45:['🌫️','Niebla'],48:['🌫️','Niebla'],51:['🌦️','Llovizna'],53:['🌦️','Llovizna'],55:['🌧️','Llovizna intensa'],61:['🌧️','Lluvia'],63:['🌧️','Lluvia moderada'],65:['🌧️','Lluvia intensa'],71:['🌨️','Nieve'],73:['🌨️','Nieve moderada'],75:['❄️','Nieve intensa'],80:['🌦️','Chubascos'],81:['🌧️','Chubascos'],82:['⛈️','Chubascos fuertes'],95:['⛈️','Tormenta'],96:['⛈️','Tormenta con granizo'],99:['⛈️','Tormenta con granizo']};const x=m[code]||['🌡️','Condición variable'];return{icon:x[0],label:x[1]}}
function formatForecastDay(dateStr){return new Intl.DateTimeFormat('es-CO',{weekday:'short',day:'2-digit'}).format(new Date(dateStr+'T12:00:00')).toUpperCase().replace('.','')}

async function render(){const hash=location.hash||'#/';try{if(hash.startsWith('#/noticia/')){return article(decodeURIComponent(hash.slice(10)))}if(hash==='#/login')return login();if(hash==='#/admin')return admin();if(hash==='#/contacto')return contact();if(hash==='#/clima')return weatherPage();const cat=hash.startsWith('#/categoria/')?decodeURIComponent(hash.slice(12)).toLowerCase():null;if(hash==='#/noticias'||cat){await loadNews();return newsPage(cat||'')}if(hash==='#/en-vivo'||hash==='#/programacion'){setMeta();await loadPrograms();app.innerHTML=live();bindLive();return}setMeta();await loadNews();await loadPrograms();S.day=null;app.innerHTML=home();bindHome()}catch(e){console.error(e);app.innerHTML=`<div class="error-box"><h2>No se pudo cargar el contenido</h2><p>${esc(e.message||e)}</p><a class="back-link" href="#/">← Volver al inicio</a></div>`}}
sb.auth.onAuthStateChange(()=>setTimeout(session,0));window.addEventListener('hashchange',render);setInterval(()=>{if(location.hash==='#/en-vivo'||location.hash==='#/programacion'||location.hash===''||location.hash==='#/')render()},60000);(async()=>{await session();await render()})();
})();
