(() => {
  "use strict";

  const CFG = window.__SUPABASE_CONFIG__ || {};
  const { createClient } = window.supabase || {};
  const app = document.getElementById("app");

  if (!createClient || !CFG.url || !CFG.publishableKey) {
    app.innerHTML = `<div class="not-found"><h1>Configuración incompleta</h1><p>Revisa la configuración de Supabase en index.html.</p></div>`;
    return;
  }

  const sb = createClient(CFG.url, CFG.publishableKey);

  const DAYS = [
    { key: "lunes", label: "LUN", num: 1 },
    { key: "martes", label: "MAR", num: 2 },
    { key: "miercoles", label: "MIÉ", num: 3 },
    { key: "jueves", label: "JUE", num: 4 },
    { key: "viernes", label: "VIE", num: 5 },
    { key: "sabado", label: "SÁB", num: 6 },
    { key: "domingo", label: "DOM", num: 7 }
  ];

  const state = {
    session: null,
    news: [],
    programming: [],
    selectedDay: null,
    editingNewsId: null,
    editingProgramId: null
  };

  const esc = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = String(time).slice(0, 5).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const suffix = h >= 12 ? "p.m." : "a.m.";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };

  const todayKey = () => {
    const day = new Date().getDay();
    return DAYS[(day + 6) % 7].key;
  };

  const dayInfo = (key) => DAYS.find(d => d.key === key) || DAYS[0];

  const notify = (message, type = "success") => {
    const old = document.querySelector(".floating-alert");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = `floating-alert alert alert-${type}`;
    el.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:3000;max-width:420px;box-shadow:0 10px 35px rgba(0,0,0,.15)";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  };

  const showError = (error) => {
    console.error(error);
    notify(error?.message || "Ocurrió un error. Revisa Supabase y las políticas RLS.", "error");
  };

  async function getSession() {
    const { data, error } = await sb.auth.getSession();
    if (error) console.error(error);
    state.session = data?.session || null;
    updateAuthLink();
  }

  function updateAuthLink() {
    const link = document.getElementById("authLink");
    if (!link) return;
    if (state.session) {
      link.textContent = "⚙️ Panel";
      link.href = "#/admin";
    } else {
      link.textContent = "🔒 Iniciar sesión";
      link.href = "#/login";
    }
  }

  async function loadNews(category = null) {
    let query = sb.from("noticias")
      .select("id,titulo,resumen,contenido,imagen_url,categoria,publicada,created_at")
      .eq("publicada", true)
      .order("created_at", { ascending: false });

    if (category) query = query.eq("categoria", category);

    const { data, error } = await query;
    if (error) throw error;
    state.news = data || [];
    return state.news;
  }

  async function loadProgramming() {
    const { data, error } = await sb.from("programacion")
      .select("id,dia,dia_semana,hora_inicio,hora_fin,hora,programa,descripcion,imagen_url,activo,created_at")
      .eq("activo", true)
      .order("dia_semana", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) throw error;
    state.programming = data || [];
    return state.programming;
  }

  function newsCard(n, extraClass = "") {
    const image = n.imagen_url
      ? `<img class="news-image" src="${esc(n.imagen_url)}" alt="${esc(n.titulo)}" loading="lazy">`
      : `<div class="no-image">GAMARRA TV</div>`;

    return `
      <article class="news-card ${extraClass}">
        ${image}
        <div class="news-body">
          <span class="badge">${esc(n.categoria || "Noticias")}</span>
          <h3><a href="#/noticia/${n.id}">${esc(n.titulo)}</a></h3>
          <p>${esc(n.resumen || "")}</p>
          <span class="news-date">${esc(formatDate(n.created_at))}</span>
        </div>
      </article>
    `;
  }

  function liveSection() {
    const selected = state.selectedDay || todayKey();
    const day = dayInfo(selected);
    const rows = state.programming
      .filter(p => (p.dia || "").toLowerCase() === selected || Number(p.dia_semana) === day.num)
      .sort((a,b) => String(a.hora_inicio || a.hora || "").localeCompare(String(b.hora_inicio || b.hora || "")));

    const now = new Date();
    const today = todayKey();

    const cards = rows.length ? rows.map((p, i) => {
      const start = p.hora_inicio || p.hora || "";
      const end = p.hora_fin || "";
      let isNow = false;

      if (selected === today && start) {
        const [sh, sm] = start.slice(0,5).split(":").map(Number);
        const startMinutes = sh * 60 + sm;
        let endMinutes = end ? (() => {
          const [eh, em] = end.slice(0,5).split(":").map(Number);
          return eh * 60 + em;
        })() : startMinutes + 60;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        isNow = currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }

      return `
        <div class="schedule-item ${isNow ? "now" : ""}">
          ${isNow ? "<small>🔴 AHORA</small>" : ""}
          <span class="schedule-time">${esc(formatTime(start))}${end ? ` - ${esc(formatTime(end))}` : ""}</span>
          <strong>${esc(p.programa)}</strong>
          ${p.descripcion ? `<div class="schedule-time">${esc(p.descripcion)}</div>` : ""}
        </div>
      `;
    }).join("") : `<div class="schedule-empty">No hay programación publicada para este día.</div>`;

    return `
      <section class="live-tv-section" id="liveSection">
        <div class="live-tv-container">
          <div class="live-player">
            <iframe
              src="${esc(CFG.liveUrl || "")}"
              title="Gamarra TV - Señal en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen>
            </iframe>
          </div>
          <aside class="live-schedule">
            <div class="schedule-title">
              <span class="live-dot"></span>
              <h2>PROGRAMACIÓN</h2>
            </div>
            <div class="schedule-days">
              ${DAYS.map(d => `
                <button class="day-btn ${selected === d.key ? "active" : ""}" data-day="${d.key}">
                  ${d.label}
                </button>
              `).join("")}
            </div>
            <div class="schedule-list">${cards}</div>
          </aside>
        </div>
      </section>
    `;
  }

  function bindLiveDays() {
    document.querySelectorAll(".day-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.selectedDay = btn.dataset.day;
        renderLiveOnly();
      });
    });
  }

  function renderLiveOnly() {
    const existing = document.querySelector(".live-tv-section");
    if (!existing) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = liveSection();
    existing.replaceWith(wrap.firstElementChild);
    bindLiveDays();
  }

  function homeView() {
    return `
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <h1>Gamarra TV</h1>
            <p>Noticias, televisión, deportes y actualidad del municipio, el sur del Cesar y la región.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#/en-vivo">🔴 Ver señal en vivo</a>
              <a class="btn btn-dark" href="#/categoria/gamarra">Ver últimas noticias</a>
            </div>
          </div>
          <div class="hero-card">
            <strong>GTV</strong>
            <span>Información local, regional y nacional.</span>
          </div>
        </div>
      </section>

      ${liveSection()}

      <section class="section">
        <div class="container">
          <div class="section-head">
            <div>
              <h2 class="section-title">Últimas noticias</h2>
              <p class="section-subtitle">La información más reciente de Gamarra TV.</p>
            </div>
            <div class="carousel-controls">
              <button id="prevNews" aria-label="Noticias anteriores">‹</button>
              <button id="nextNews" aria-label="Noticias siguientes">›</button>
            </div>
          </div>
          <div class="latest-carousel">
            <div class="carousel-track" id="latestTrack">
              ${state.news.length ? state.news.map(n => newsCard(n, "carousel-card")).join("") : `<div class="empty">Todavía no hay noticias publicadas.</div>`}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function categoryView(category) {
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    return `
      <section class="category-head">
        <div class="container">
          <h1>${esc(label)}</h1>
          <p>Noticias de ${esc(label)} en Gamarra TV.</p>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="news-grid">
            ${state.news.length ? state.news.map(n => newsCard(n)).join("") : `<div class="empty">No hay noticias publicadas en esta categoría.</div>`}
          </div>
        </div>
      </section>
    `;
  }

  async function articleView(id) {
    app.innerHTML = `<div class="loading"><span class="spinner"></span> Cargando noticia...</div>`;
    const { data, error } = await sb.from("noticias")
      .select("id,titulo,resumen,contenido,imagen_url,categoria,created_at")
      .eq("id", id)
      .eq("publicada", true)
      .single();

    if (error || !data) {
      app.innerHTML = `<div class="not-found"><h1>Noticia no encontrada</h1><p>La noticia no está disponible.</p><a class="btn btn-primary" href="#/">Volver al inicio</a></div>`;
      return;
    }

    app.innerHTML = `
      <article class="article">
        <div class="container article-wrap">
          <span class="badge">${esc(data.categoria)}</span>
          <h1>${esc(data.titulo)}</h1>
          <div class="article-meta">${esc(formatDate(data.created_at))}</div>
          ${data.imagen_url ? `<img class="article-cover" src="${esc(data.imagen_url)}" alt="${esc(data.titulo)}">` : ""}
          ${data.resumen ? `<div class="article-summary">${esc(data.resumen)}</div>` : ""}
          <div class="article-content">${esc(data.contenido)}</div>
        </div>
      </article>
    `;
  }

  function loginView() {
    app.innerHTML = `
      <section class="login-page">
        <div class="login-box">
          <h1>Iniciar sesión</h1>
          <p>Accede al panel para publicar noticias y administrar la programación.</p>
          <div id="loginAlert"></div>
          <form id="loginForm">
            <div class="form-group">
              <label for="loginEmail">Correo electrónico</label>
              <input class="form-control" id="loginEmail" type="email" required autocomplete="email">
            </div>
            <div class="form-group">
              <label for="loginPassword">Contraseña</label>
              <input class="form-control" id="loginPassword" type="password" required autocomplete="current-password">
            </div>
            <button class="btn btn-primary" style="width:100%" type="submit">🔐 Iniciar sesión</button>
          </form>
        </div>
      </section>
    `;

    document.getElementById("loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const alert = document.getElementById("loginAlert");
      alert.innerHTML = `<div class="alert alert-success">Iniciando sesión...</div>`;

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      const { data, error } = await sb.auth.signInWithPassword({ email, password });

      if (error) {
        alert.innerHTML = `<div class="alert alert-error">${esc(error.message)}</div>`;
        return;
      }

      state.session = data.session;
      updateAuthLink();
      location.hash = "#/admin";
    });
  }

  function adminView() {
    if (!state.session) {
      location.hash = "#/login";
      return;
    }

    app.innerHTML = `
      <section class="admin-page">
        <div class="container">
          <div class="admin-top">
            <div>
              <h1 style="color:var(--navy)">Panel de Gamarra TV</h1>
              <p style="color:var(--muted)">Publica noticias y administra la programación.</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <span class="user-chip">${esc(state.session.user.email || "")}</span>
              <button class="btn btn-dark" id="logoutBtn">Cerrar sesión</button>
            </div>
          </div>

          <div class="admin-grid">
            <div class="panel">
              <h2>📰 Publicar noticia</h2>
              <p class="panel-sub">Puedes publicar, editar y eliminar noticias.</p>
              <div id="newsAdminAlert"></div>
              <form id="newsForm">
                <input type="hidden" name="noticia_id" value="">
                <div class="form-group">
                  <label>Título</label>
                  <input class="form-control" name="titulo" required maxlength="180">
                </div>
                <div class="form-group">
                  <label>Categoría</label>
                  <select class="form-control" name="categoria" required>
                    <option value="gamarra">Gamarra</option>
                    <option value="judicial">Judicial</option>
                    <option value="deportes">Deportes</option>
                    <option value="region">Región</option>
                    <option value="nacionales">Nacionales</option>
                    <option value="internacionales">Internacionales</option>
                    <option value="entretenimiento">Entretenimiento</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Resumen</label>
                  <textarea class="form-control" name="resumen" placeholder="Breve resumen de la noticia"></textarea>
                </div>
                <div class="form-group">
                  <label>Contenido</label>
                  <textarea class="form-control" name="contenido" required placeholder="Escribe aquí la noticia completa"></textarea>
                </div>
                <div class="form-group">
                  <label>Imagen</label>
                  <input class="form-control" name="imagen" type="file" accept="image/*">
                  <div id="newsImagePreview"></div>
                </div>
                <label class="checkbox"><input type="checkbox" name="publicada" checked> Publicar inmediatamente</label>
                <div class="form-actions">
                  <button class="btn btn-primary" type="submit">📰 <span id="newsSubmitText">Publicar noticia</span></button>
                  <button class="btn btn-outline" type="button" id="cancelNewsEdit" hidden>Cancelar edición</button>
                </div>
              </form>

              <div class="admin-list" id="newsAdminList"><div class="loading">Cargando noticias...</div></div>
            </div>

            <div class="panel">
              <h2>📺 Programación</h2>
              <p class="panel-sub">Define día, hora de inicio y hora final de cada programa.</p>
              <div id="programAdminAlert"></div>
              <form id="programForm">
                <input type="hidden" name="programacion_id" value="">
                <div class="form-group">
                  <label>Día</label>
                  <select class="form-control" name="dia" required>
                    ${DAYS.map(d => `<option value="${d.key}">${d.label}</option>`).join("")}
                  </select>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div class="form-group">
                    <label>Hora de inicio</label>
                    <input class="form-control" name="hora_inicio" type="time" required>
                  </div>
                  <div class="form-group">
                    <label>Hora final</label>
                    <input class="form-control" name="hora_fin" type="time" required>
                  </div>
                </div>
                <div class="form-group">
                  <label>Programa</label>
                  <input class="form-control" name="programa" required maxlength="150">
                </div>
                <div class="form-group">
                  <label>Descripción</label>
                  <textarea class="form-control" name="descripcion" placeholder="Descripción opcional"></textarea>
                </div>
                <div class="form-group">
                  <label>URL de imagen (opcional)</label>
                  <input class="form-control" name="imagen_url" type="url" placeholder="https://...">
                </div>
                <label class="checkbox"><input type="checkbox" name="activo" checked> Mostrar en la programación</label>
                <div class="form-actions">
                  <button class="btn btn-primary" type="submit">📺 <span id="programSubmitText">Guardar programa</span></button>
                  <button class="btn btn-outline" type="button" id="cancelProgramEdit" hidden>Cancelar edición</button>
                </div>
              </form>

              <div class="admin-list" id="programAdminList"><div class="loading">Cargando programación...</div></div>
            </div>
          </div>
        </div>
      </section>
    `;

    bindAdmin();
    loadAdminData();
  }

  async function loadAdminData() {
    try {
      const [{ data: news, error: newsError }, { data: programs, error: programError }] = await Promise.all([
        sb.from("noticias").select("id,titulo,resumen,contenido,imagen_url,categoria,publicada,created_at").order("created_at", { ascending: false }),
        sb.from("programacion").select("id,dia,dia_semana,hora_inicio,hora_fin,hora,programa,descripcion,imagen_url,activo,created_at").order("dia_semana", { ascending: true }).order("hora_inicio", { ascending: true })
      ]);

      if (newsError) throw newsError;
      if (programError) throw programError;

      state.news = news || [];
      state.programming = programs || [];
      renderAdminLists();
    } catch (error) {
      showError(error);
      document.getElementById("newsAdminList").innerHTML = `<div class="alert alert-error">${esc(error.message)}</div>`;
      document.getElementById("programAdminList").innerHTML = `<div class="alert alert-error">${esc(error.message)}</div>`;
    }
  }

  function renderAdminLists() {
    const nl = document.getElementById("newsAdminList");
    const pl = document.getElementById("programAdminList");

    nl.innerHTML = state.news.length ? state.news.map(n => `
      <div class="admin-item">
        <div>
          <div class="admin-item-title">${esc(n.titulo)}</div>
          <div class="admin-item-meta">${esc(n.categoria)} · ${esc(formatDate(n.created_at))} · ${n.publicada ? "Publicada" : "Borrador"}</div>
        </div>
        <div class="admin-actions">
          <button class="small-btn" data-edit-news="${n.id}">Editar</button>
          <button class="small-btn danger" data-delete-news="${n.id}">Eliminar</button>
        </div>
      </div>
    `).join("") : `<div class="empty">No hay noticias todavía.</div>`;

    pl.innerHTML = state.programming.length ? state.programming.map(p => {
      const d = dayInfo(p.dia) || DAYS.find(x => x.num === Number(p.dia_semana)) || DAYS[0];
      return `
        <div class="admin-item">
          <div>
            <div class="admin-item-title">${esc(p.programa)}</div>
            <div class="admin-item-meta">${esc(d.label)} · ${esc(formatTime(p.hora_inicio || p.hora))} - ${esc(formatTime(p.hora_fin))} · ${p.activo ? "Visible" : "Oculto"}</div>
          </div>
          <div class="admin-actions">
            <button class="small-btn" data-edit-program="${p.id}">Editar</button>
            <button class="small-btn danger" data-delete-program="${p.id}">Eliminar</button>
          </div>
        </div>
      `;
    }).join("") : `<div class="empty">No hay programas todavía.</div>`;

    nl.querySelectorAll("[data-edit-news]").forEach(b => b.addEventListener("click", () => editNews(b.dataset.editNews)));
    nl.querySelectorAll("[data-delete-news]").forEach(b => b.addEventListener("click", () => deleteNews(b.dataset.deleteNews)));
    pl.querySelectorAll("[data-edit-program]").forEach(b => b.addEventListener("click", () => editProgram(b.dataset.editProgram)));
    pl.querySelectorAll("[data-delete-program]").forEach(b => b.addEventListener("click", () => deleteProgram(b.dataset.deleteProgram)));
  }

  function bindAdmin() {
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await sb.auth.signOut();
      state.session = null;
      updateAuthLink();
      location.hash = "#/";
    });

    document.getElementById("newsForm").addEventListener("submit", publishNews);
    document.getElementById("programForm").addEventListener("submit", saveProgram);

    document.getElementById("cancelNewsEdit").addEventListener("click", resetNewsForm);
    document.getElementById("cancelProgramEdit").addEventListener("click", resetProgramForm);

    document.querySelector('input[name="imagen"]').addEventListener("change", e => {
      const file = e.target.files?.[0];
      const box = document.getElementById("newsImagePreview");
      box.innerHTML = "";
      if (file) {
        const img = document.createElement("img");
        img.className = "upload-preview";
        img.alt = "Vista previa";
        img.src = URL.createObjectURL(file);
        box.appendChild(img);
      }
    });
  }

  async function uploadNewsImage(file) {
    if (!file) return null;

    if (!file.type || !file.type.startsWith("image/")) {
      throw new Error("El archivo seleccionado no es una imagen válida.");
    }

    // Evita errores comunes por archivos enormes desde el celular.
    if (file.size > 15 * 1024 * 1024) {
      throw new Error("La imagen supera 15 MB. Elige una imagen más liviana.");
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const userId = state.session?.user?.id || "usuario";
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await sb.storage.from("noticias").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

    if (error) {
      throw new Error(`No se pudo subir la imagen: ${error.message}`);
    }

    const { data } = sb.storage.from("noticias").getPublicUrl(path);
    if (!data?.publicUrl) throw new Error("Supabase no devolvió la URL pública de la imagen.");
    return data.publicUrl;
  }

  function formatSupabaseError(error) {
    if (!error) return "Ocurrió un error desconocido.";
    const parts = [error.message, error.details, error.hint, error.code ? `Código: ${error.code}` : ""]
      .filter(Boolean);
    return parts.join(" | ");
  }

  async function publishNews(event) {
    event.preventDefault();

    if (!state.session) {
      notify("Tu sesión no está activa. Inicia sesión nuevamente.", "error");
      location.hash = "#/login";
      return;
    }

    const form = event.target;
    const fd = new FormData(form);
    const id = String(fd.get("noticia_id") || "").trim();
    const titulo = String(fd.get("titulo") || "").trim();
    const categoria = String(fd.get("categoria") || "gamarra").trim().toLowerCase();
    const resumen = String(fd.get("resumen") || "").trim();
    const contenido = String(fd.get("contenido") || "").trim();
    const publicada = fd.get("publicada") === "on";
    const file = form.elements.imagen?.files?.[0] || null;
    const alert = document.getElementById("newsAdminAlert");
    const button = form.querySelector('button[type="submit"]');

    if (!titulo || !contenido) {
      alert.innerHTML = `<div class="alert alert-error">Escribe el título y el contenido de la noticia.</div>`;
      return;
    }

    if (!categoria) {
      alert.innerHTML = `<div class="alert alert-error">Selecciona una categoría.</div>`;
      return;
    }

    if (button) button.disabled = true;
    alert.innerHTML = `<div class="alert alert-success">Guardando noticia...</div>`;

    try {
      let imagenUrl = null;
      let imageWarning = "";

      // Si la imagen falla, NO bloqueamos la publicación de la noticia.
      // Así puedes publicar primero y corregir la imagen después.
      if (file) {
        try {
          imagenUrl = await uploadNewsImage(file);
        } catch (imageError) {
          console.error("Error de Storage:", imageError);
          imageWarning = ` La noticia se guardará sin imagen porque: ${formatSupabaseError(imageError)}`;
        }
      }

      if (!imagenUrl && id) {
        const old = state.news.find(n => String(n.id) === id);
        imagenUrl = old?.imagen_url || null;
      }

      const payload = {
        titulo,
        resumen: resumen || null,
        contenido,
        imagen_url: imagenUrl,
        categoria,
        publicada
      };

      let result;
      if (id) {
        result = await sb.from("noticias")
          .update(payload)
          .eq("id", id);
      } else {
        result = await sb.from("noticias")
          .insert(payload);
      }

      if (result.error) {
        throw new Error(formatSupabaseError(result.error));
      }

      alert.innerHTML = `<div class="alert alert-success">✅ Noticia ${id ? "actualizada" : "publicada"} correctamente.${esc(imageWarning)}</div>`;
      resetNewsForm();
      await loadAdminData();
    } catch (error) {
      const message = formatSupabaseError(error);
      alert.innerHTML = `<div class="alert alert-error">❌ No se pudo guardar la noticia.<br><small>${esc(message)}</small></div>`;
      console.error("Error al publicar noticia:", error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function editNews(id) {
    const n = state.news.find(x => String(x.id) === String(id));
    if (!n) return;
    const form = document.getElementById("newsForm");
    form.elements.noticia_id.value = n.id;
    form.elements.titulo.value = n.titulo || "";
    form.elements.categoria.value = n.categoria || "gamarra";
    form.elements.resumen.value = n.resumen || "";
    form.elements.contenido.value = n.contenido || "";
    form.elements.publicada.checked = Boolean(n.publicada);
    form.elements.imagen.value = "";
    document.getElementById("newsSubmitText").textContent = "Actualizar noticia";
    document.getElementById("cancelNewsEdit").hidden = false;
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  function resetNewsForm() {
    const form = document.getElementById("newsForm");
    form.reset();
    form.elements.noticia_id.value = "";
    form.elements.publicada.checked = true;
    document.getElementById("newsSubmitText").textContent = "Publicar noticia";
    document.getElementById("cancelNewsEdit").hidden = true;
    document.getElementById("newsImagePreview").innerHTML = "";
  }

  async function deleteNews(id) {
    if (!confirm("¿Eliminar esta noticia?")) return;
    try {
      const { error } = await sb.from("noticias").delete().eq("id", id);
      if (error) throw error;
      notify("Noticia eliminada.");
      await loadAdminData();
    } catch (error) {
      showError(error);
    }
  }

  async function saveProgram(event) {
    event.preventDefault();
    const form = event.target;
    const fd = new FormData(form);
    const id = fd.get("programacion_id");
    const dia = String(fd.get("dia") || "").trim().toLowerCase();
    const horaInicio = String(fd.get("hora_inicio") || "").trim();
    const horaFin = String(fd.get("hora_fin") || "").trim();
    const programa = String(fd.get("programa") || "").trim();
    const descripcion = String(fd.get("descripcion") || "").trim();
    const imagenUrl = String(fd.get("imagen_url") || "").trim();
    const activo = fd.get("activo") === "on";
    const info = dayInfo(dia);

    if (!info) {
      notify("Selecciona un día válido.", "error");
      return;
    }
    if (!horaInicio || !horaFin || horaFin <= horaInicio) {
      notify("La hora final debe ser posterior a la hora de inicio.", "error");
      return;
    }

    const alert = document.getElementById("programAdminAlert");
    alert.innerHTML = `<div class="alert alert-success">Guardando programación...</div>`;

    try {
      /*
        IMPORTANTE:
        dia_semana SIEMPRE es entero 1-7.
        dia SIEMPRE es texto.
        Así se evita el error 42804 de PostgreSQL.
      */
      const payload = {
        dia,
        dia_semana: info.num,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        hora: horaInicio,
        programa,
        descripcion: descripcion || null,
        imagen_url: imagenUrl || null,
        activo
      };

      let result;
      if (id) {
        result = await sb.from("programacion").update(payload).eq("id", id).select().single();
      } else {
        result = await sb.from("programacion").insert(payload).select().single();
      }

      if (result.error) throw result.error;

      alert.innerHTML = `<div class="alert alert-success">Programa guardado correctamente.</div>`;
      resetProgramForm();
      await loadAdminData();
      await loadProgramming();
      if (document.querySelector(".live-tv-section")) renderLiveOnly();
    } catch (error) {
      alert.innerHTML = `<div class="alert alert-error">${esc(error.message)}</div>`;
      console.error(error);
    }
  }

  function editProgram(id) {
    const p = state.programming.find(x => String(x.id) === String(id));
    if (!p) return;

    const fallbackDay = DAYS.find(d => Number(d.num) === Number(p.dia_semana))?.key || "lunes";
    const form = document.getElementById("programForm");
    form.elements.programacion_id.value = p.id;
    form.elements.dia.value = p.dia || fallbackDay;
    form.elements.hora_inicio.value = (p.hora_inicio || p.hora || "").slice(0,5);
    form.elements.hora_fin.value = (p.hora_fin || "").slice(0,5);
    form.elements.programa.value = p.programa || "";
    form.elements.descripcion.value = p.descripcion || "";
    form.elements.imagen_url.value = p.imagen_url || "";
    form.elements.activo.checked = p.activo !== false;

    document.getElementById("programSubmitText").textContent = "Actualizar programa";
    document.getElementById("cancelProgramEdit").hidden = false;
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  function resetProgramForm() {
    const form = document.getElementById("programForm");
    form.reset();
    form.elements.programacion_id.value = "";
    form.elements.dia.value = "lunes";
    form.elements.activo.checked = true;
    document.getElementById("programSubmitText").textContent = "Guardar programa";
    document.getElementById("cancelProgramEdit").hidden = true;
  }

  async function deleteProgram(id) {
    if (!confirm("¿Eliminar este programa?")) return;
    try {
      const { error } = await sb.from("programacion").delete().eq("id", id);
      if (error) throw error;
      notify("Programa eliminado.");
      await loadAdminData();
      await loadProgramming();
      if (document.querySelector(".live-tv-section")) renderLiveOnly();
    } catch (error) {
      showError(error);
    }
  }

  function bindHomeCarousel() {
    const track = document.getElementById("latestTrack");
    const prev = document.getElementById("prevNews");
    const next = document.getElementById("nextNews");
    if (!track) return;
    prev?.addEventListener("click", () => track.scrollBy({ left: -330, behavior: "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: 330, behavior: "smooth" }));
  }

  async function renderHome() {
    app.innerHTML = `<div class="loading"><span class="spinner"></span> Cargando Gamarra TV...</div>`;
    try {
      await Promise.all([loadNews(), loadProgramming()]);
      state.selectedDay = state.selectedDay || todayKey();
      app.innerHTML = homeView();
      bindLiveDays();
      bindHomeCarousel();
    } catch (error) {
      console.error(error);
      app.innerHTML = `
        <section class="hero">
          <div class="container">
            <h1>Gamarra TV</h1>
            <p>La señal en vivo está disponible. No fue posible cargar las noticias o la programación.</p>
            <div class="hero-actions"><a class="btn btn-primary" href="#/en-vivo">🔴 Ver señal en vivo</a></div>
          </div>
        </section>
        ${liveSection()}
      `;
      bindLiveDays();
      notify(error.message || "No fue posible cargar los datos.", "error");
    }
  }

  async function renderLivePage() {
    app.innerHTML = `<div class="loading"><span class="spinner"></span> Cargando señal...</div>`;
    try {
      await loadProgramming();
      state.selectedDay = state.selectedDay || todayKey();
      app.innerHTML = `
        <section class="category-head">
          <div class="container">
            <h1>Señal en vivo</h1>
            <p>Disfruta la señal de Gamarra TV y consulta la programación.</p>
          </div>
        </section>
        ${liveSection()}
      `;
      bindLiveDays();
    } catch (error) {
      app.innerHTML = liveSection();
      bindLiveDays();
      notify(error.message || "No fue posible cargar la programación.", "error");
    }
  }

  async function renderCategory(category) {
    app.innerHTML = `<div class="loading"><span class="spinner"></span> Cargando noticias...</div>`;
    try {
      await loadNews(category);
      app.innerHTML = categoryView(category);
    } catch (error) {
      app.innerHTML = `<div class="not-found"><h1>Error al cargar</h1><p>${esc(error.message)}</p></div>`;
    }
  }

  async function router() {
    await getSession();
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);
    const route = parts[0] || "";

    if (route === "login") {
      if (state.session) location.hash = "#/admin";
      else loginView();
      return;
    }

    if (route === "admin") {
      adminView();
      return;
    }

    if (route === "en-vivo") {
      await renderLivePage();
      return;
    }

    if (route === "categoria" && parts[1]) {
      await renderCategory(parts[1].toLowerCase());
      return;
    }

    if (route === "noticia" && parts[1]) {
      await articleView(parts[1]);
      return;
    }

    await renderHome();
  }

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("mainNav")?.classList.toggle("open");
  });

  document.getElementById("mainNav")?.addEventListener("click", e => {
    if (e.target.matches("a")) document.getElementById("mainNav").classList.remove("open");
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  sb.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    updateAuthLink();
  });

  window.addEventListener("hashchange", router);
  router();
})();
