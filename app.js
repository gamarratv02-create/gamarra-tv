/* =========================================================
   GAMARRA TV
   Aplicación principal
   ========================================================= */

(() => {

  "use strict";


  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */

  const CONFIG = window.__SUPABASE_CONFIG__ || {};

  const app = document.getElementById("app");

  const authLink = document.getElementById("authLink");

  const menuToggle = document.getElementById("menuToggle");

  const mainNav = document.getElementById("mainNav");

  let sb = null;


  const CATEGORIES = [
    "gamarra",
    "judicial",
    "deportes",
    "region",
    "nacionales",
    "internacionales",
    "entretenimiento"
  ];


  const CATEGORY_NAMES = {
    gamarra: "Gamarra",
    judicial: "Judicial",
    deportes: "Deportes",
    region: "Región",
    nacionales: "Nacionales",
    internacionales: "Internacionales",
    entretenimiento: "Entretenimiento"
  };


  const DAYS = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
    domingo: 7
  };


  const state = {

    news: [],

    programs: [],

    editingNewsId: null,

    editingProgramId: null

  };


  /* =========================================================
     UTILIDADES
     ========================================================= */

  function escapeHTML(value) {

    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function imageURL(url) {

    if (url && String(url).trim()) {
      return escapeHTML(url);
    }

    return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";
  }


  function categoryName(category) {

    return CATEGORY_NAMES[category] ||
      String(category || "Noticias");
  }


  function formatDate(date) {

    if (!date) {
      return "";
    }

    try {

      return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long"
      }).format(new Date(date));

    } catch {

      return "";

    }

  }


  function getHashRoute() {

    let route = location.hash || "#/";

    if (route.startsWith("#")) {
      route = route.substring(1);
    }

    if (!route) {
      route = "/";
    }

    if (!route.startsWith("/")) {
      route = "/" + route;
    }

    return route;

  }


  function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) {
      return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

      toast.classList.remove("show");

    }, 3000);

  }


  function showError(message) {

    return `
      <div class="alert alert-error">
        ${escapeHTML(message)}
      </div>
    `;

  }


  function showSuccess(message) {

    return `
      <div class="alert alert-success">
        ${escapeHTML(message)}
      </div>
    `;

  }


  function closeMobileMenu() {

    if (mainNav) {
      mainNav.classList.remove("open");
    }

  }


  /* =========================================================
     CONFIGURACIÓN SUPABASE
     ========================================================= */

  function initSupabase() {

    if (!window.supabase) {

      app.innerHTML = `
        <section class="section">
          <div class="container">
            ${showError(
              "No se pudo cargar Supabase. Recarga la página."
            )}
          </div>
        </section>
      `;

      return false;

    }


    if (
      !CONFIG.url ||
      !CONFIG.publishableKey ||
      CONFIG.publishableKey.includes("sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsF")
    ) {

      app.innerHTML = `
        <section class="section">
          <div class="container">

            <div class="admin-card">

              <h2>Configuración pendiente</h2>

              <p>
                La página ya está funcionando, pero falta colocar
                la Publishable Key de Supabase.
              </p>

              <div class="alert alert-info">
                Abre <strong>index.html</strong> y coloca tu
                <strong>sb_publishable_...</strong> en
                <strong>publishableKey</strong>.
              </div>

              <p>
                No coloques la clave
                <strong>sb_secret_...</strong> en este archivo.
              </p>

            </div>

          </div>
        </section>
      `;

      return false;

    }


    sb = window.supabase.createClient(
      CONFIG.url,
      CONFIG.publishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );


    return true;

  }


  /* =========================================================
     AUTENTICACIÓN
     ========================================================= */

  async function getSession() {

    if (!sb) {
      return null;
    }

    const {
      data
    } = await sb.auth.getSession();

    return data?.session || null;

  }


  async function updateAuthButton() {

    if (!authLink) {
      return;
    }

    const session = await getSession();

    if (session) {

      authLink.href = "#/admin";

      authLink.innerHTML = "⚙️ Panel";

    } else {

      authLink.href = "#/login";

      authLink.innerHTML = "🔐 Iniciar sesión";

    }

  }


  /* =========================================================
     NOTICIAS
     ========================================================= */

  async function getPublishedNews(limit = 12) {

    const {
      data,
      error
    } = await sb
      .from("noticias")
      .select("*")
      .eq("publicada", true)
      .order("created_at", {
        ascending: false
      })
      .limit(limit);


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function getCategoryNews(category) {

    const {
      data,
      error
    } = await sb
      .from("noticias")
      .select("*")
      .eq("publicada", true)
      .eq("categoria", category)
      .order("created_at", {
        ascending: false
      })
      .limit(30);


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function getNewsById(id) {

    const {
      data,
      error
    } = await sb
      .from("noticias")
      .select("*")
      .eq("id", id)
      .eq("publicada", true)
      .maybeSingle();


    if (error) {
      throw error;
    }


    return data;

  }


  /* =========================================================
     PROGRAMACIÓN
     ========================================================= */

  async function getPrograms(activeOnly = true) {

    let query = sb
      .from("programacion")
      .select("*");


    if (activeOnly) {

      query = query.eq("activo", true);

    }


    const {
      data,
      error
    } = await query;


    if (error) {
      throw error;
    }


    const programs = data || [];


    programs.sort((a, b) => {

      const dayA =
        DAYS[String(a.dia || "").toLowerCase()] || 99;

      const dayB =
        DAYS[String(b.dia || "").toLowerCase()] || 99;


      if (dayA !== dayB) {
        return dayA - dayB;
      }


      return String(a.hora || "")
        .localeCompare(String(b.hora || ""));

    });


    return programs;

  }


  /* =========================================================
     TARJETA DE NOTICIA
     ========================================================= */

  function newsCard(news) {

    return `
      <article class="news-card">

        <a href="#/noticia/${encodeURIComponent(news.id)}">

          <img
            class="news-image"
            src="${imageURL(news.imagen_url)}"
            alt="${escapeHTML(news.titulo)}"
            loading="lazy"
          >

        </a>

        <div class="news-body">

          <div class="news-meta">
            ${escapeHTML(categoryName(news.categoria))}
            ${news.created_at ? " · " + escapeHTML(formatDate(news.created_at)) : ""}
          </div>

          <h3>

            <a href="#/noticia/${encodeURIComponent(news.id)}">

              ${escapeHTML(news.titulo)}

            </a>

          </h3>

          ${
            news.resumen
              ? `<p>${escapeHTML(news.resumen)}</p>`
              : ""
          }

        </div>

      </article>
    `;

  }


  /* =========================================================
     PROGRAMACIÓN CARD
     ========================================================= */

  function programCard(program) {

    return `
      <div class="schedule-card">

        <div class="schedule-day">
          ${escapeHTML(program.dia || "")}
        </div>

        <div class="schedule-time">
          ${escapeHTML(program.hora || "")}
        </div>

        <h3>
          ${escapeHTML(program.programa || "Programa")}
        </h3>

        ${
          program.descripcion
            ? `<p>${escapeHTML(program.descripcion)}</p>`
            : ""
        }

      </div>
    `;

  }


  /* =========================================================
     PÁGINA INICIO
     ========================================================= */

  async function renderHome() {

    app.innerHTML = `
      <section class="loading-page">
        <div class="loading-spinner"></div>
        <p>Cargando las últimas noticias...</p>
      </section>
    `;


    let news = [];

    let programs = [];


    try {

      news = await getPublishedNews(12);

    } catch (error) {

      console.error(error);

    }


    try {

      programs = await getPrograms(true);

    } catch (error) {

      console.error(error);

    }


    const mainNews = news[0];

    const secondaryNews = news.slice(1, 4);

    const latestNews = news.slice(0, 9);


    app.innerHTML = `

      <!-- HERO -->

      <section class="hero">

        <div class="container">

          <div class="hero-grid">

            ${
              mainNews
                ? `
                  <article class="hero-main">

                    <img
                      src="${imageURL(mainNews.imagen_url)}"
                      alt="${escapeHTML(mainNews.titulo)}"
                    >

                    <div class="hero-overlay">

                      <div class="hero-info">

                        <span class="category-label">
                          ${escapeHTML(categoryName(mainNews.categoria))}
                        </span>

                        <h1>
                          ${escapeHTML(mainNews.titulo)}
                        </h1>

                        ${
                          mainNews.resumen
                            ? `<p>${escapeHTML(mainNews.resumen)}</p>`
                            : ""
                        }

                      </div>

                    </div>

                    <a
                      href="#/noticia/${encodeURIComponent(mainNews.id)}"
                      style="position:absolute;inset:0"
                      aria-label="Leer noticia"
                    ></a>

                  </article>
                `
                : `
                  <div class="hero-main">

                    <div class="hero-info">

                      <span class="category-label">
                        GAMARRA TV
                      </span>

                      <h1>
                        Noticias, televisión y actualidad
                      </h1>

                      <p>
                        Información del sur del Cesar y el Magdalena Medio.
                      </p>

                    </div>

                  </div>
                `
            }


            <div class="featured-column">

              ${
                secondaryNews.length
                  ? secondaryNews
                      .map(item => `
                        <article class="feature-card">

                          <a href="#/noticia/${encodeURIComponent(item.id)}">

                            <img
                              src="${imageURL(item.imagen_url)}"
                              alt="${escapeHTML(item.titulo)}"
                            >

                          </a>

                          <div class="feature-content">

                            <div class="news-meta">
                              ${escapeHTML(categoryName(item.categoria))}
                            </div>

                            <h3>
                              <a href="#/noticia/${encodeURIComponent(item.id)}">
                                ${escapeHTML(item.titulo)}
                              </a>
                            </h3>

                          </div>

                        </article>
                      `)
                      .join("")
                  : `
                    <div class="empty">
                      Pronto encontrarás aquí más noticias destacadas.
                    </div>
                  `
              }

            </div>

          </div>

        </div>

      </section>


      <!-- ÚLTIMAS NOTICIAS -->

      <section class="section">

        <div class="container">

          <div class="section-header">

            <div>

              <h2 class="section-title">
                Últimas noticias
              </h2>

              <p class="section-subtitle">
                La información más reciente de Gamarra TV.
              </p>

            </div>

          </div>


          ${
            latestNews.length
              ? `
                <div class="news-grid">

                  ${latestNews.map(newsCard).join("")}

                </div>
              `
              : `
                <div class="empty">

                  <h3>
                    Aún no hay noticias publicadas
                  </h3>

                  <p>
                    Cuando publiques una noticia desde el panel,
                    aparecerá automáticamente aquí.
                  </p>

                </div>
              `
          }

        </div>

      </section>


      <!-- EN VIVO -->

      <section class="section live-section">

        <div class="container">

          <div class="section-header">

            <div>

              <h2 class="section-title">
                🔴 Gamarra TV en vivo
              </h2>

              <p class="section-subtitle" style="color:#b8c4d4">
                Disfruta nuestra señal y programación.
              </p>

            </div>

          </div>


          <div class="live-box">

            <div class="live-player">

              ${
                CONFIG.liveUrl
                  ? `
                    <iframe
                      src="${escapeHTML(CONFIG.liveUrl)}"
                      allow="autoplay; encrypted-media"
                      allowfullscreen
                    ></iframe>
                  `
                  : `
                    <div class="live-icon">
                      📺
                    </div>

                    <h2>
                      Gamarra TV
                    </h2>

                    <p>
                      Nuestra señal en vivo estará disponible aquí.
                    </p>

                    <a
                      href="#/en-vivo"
                      class="btn btn-primary"
                    >
                      Ver señal en vivo
                    </a>
                  `
              }

            </div>

          </div>

        </div>

      </section>


      <!-- PROGRAMACIÓN -->

      <section class="section">

        <div class="container">

          <div class="section-header">

            <div>

              <h2 class="section-title">
                Programación
              </h2>

              <p class="section-subtitle">
                Consulta los programas disponibles en Gamarra TV.
              </p>

            </div>

          </div>


          ${
            programs.length
              ? `
                <div class="schedule">

                  ${programs.slice(0, 8).map(programCard).join("")}

                </div>
              `
              : `
                <div class="empty">

                  La programación aparecerá aquí cuando sea
                  configurada desde el panel.

                </div>
              `
          }

        </div>

      </section>

    `;

  }


  /* =========================================================
     CATEGORÍA
     ========================================================= */

  async function renderCategory(category) {

    const name = categoryName(category);


    app.innerHTML = `
      <section class="category-header">

        <div class="container">

          <h1>
            ${escapeHTML(name)}
          </h1>

          <p>
            Noticias de ${escapeHTML(name)} y sus alrededores.
          </p>

        </div>

      </section>

      <section class="section">

        <div class="container">

          <div id="categoryContent">

            <div class="loading-page">
              <div class="loading-spinner"></div>
              <p>Cargando noticias...</p>
            </div>

          </div>

        </div>

      </section>
    `;


    try {

      const news = await getCategoryNews(category);


      document.getElementById("categoryContent").innerHTML =

        news.length
          ? `
              <div class="news-grid">

                ${news.map(newsCard).join("")}

              </div>
            `
          : `
              <div class="empty">

                <h3>
                  No hay noticias en esta sección
                </h3>

                <p>
                  Todavía no hay publicaciones disponibles.
                </p>

              </div>
            `;

    } catch (error) {

      console.error(error);

      document.getElementById("categoryContent").innerHTML =
        showError(
          "No fue posible cargar las noticias de esta sección."
        );

    }

  }


  /* =========================================================
     ARTÍCULO
     ========================================================= */

  async function renderArticle(id) {

    app.innerHTML = `
      <section class="loading-page">

        <div class="loading-spinner"></div>

        <p>Cargando noticia...</p>

      </section>
    `;


    try {

      const news = await getNewsById(id);


      if (!news) {

        app.innerHTML = `
          <section class="section">

            <div class="container">

              <div class="empty">

                <h2>
                  Noticia no encontrada
                </h2>

                <p>
                  La noticia puede haber sido retirada o no existe.
                </p>

                <a href="#/" class="btn btn-primary">
                  Volver al inicio
                </a>

              </div>

            </div>

          </section>
        `;

        return;

      }


      const paragraphs =
        String(news.contenido || "")
          .split(/\n+/)
          .filter(Boolean)
          .map(
            paragraph =>
              `<p>${escapeHTML(paragraph)}</p>`
          )
          .join("");


      app.innerHTML = `

        <article class="article">

          <div class="container article-container">

            <div class="news-meta">

              ${escapeHTML(categoryName(news.categoria))}

              ${
                news.created_at
                  ? " · " + escapeHTML(formatDate(news.created_at))
                  : ""
              }

            </div>


            <h1>
              ${escapeHTML(news.titulo)}
            </h1>


            ${
              news.resumen
                ? `
                  <p class="article-summary">
                    ${escapeHTML(news.resumen)}
                  </p>
                `
                : ""
            }


            ${
              news.imagen_url
                ? `
                  <img
                    class="article-image"
                    src="${imageURL(news.imagen_url)}"
                    alt="${escapeHTML(news.titulo)}"
                  >
                `
                : ""
            }


            <div class="article-content">

              ${paragraphs}

            </div>


            <div style="margin-top:35px">

              <a
                href="#/"
                class="btn btn-secondary"
              >
                ← Volver a noticias
              </a>

            </div>

          </div>

        </article>

      `;

    } catch (error) {

      console.error(error);

      app.innerHTML = `
        <section class="section">

          <div class="container">

            ${showError(
              "No fue posible cargar esta noticia."
            )}

          </div>

        </section>
      `;

    }

  }


  /* =========================================================
     EN VIVO
     ========================================================= */

  function renderLive() {

    app.innerHTML = `

      <section class="section live-section">

        <div class="container">

          <div class="section-header">

            <div>

              <h1 class="section-title">
                🔴 Gamarra TV en vivo
              </h1>

              <p class="section-subtitle" style="color:#b8c4d4">
                Señal de televisión y contenidos de Gamarra TV.
              </p>

            </div>

          </div>


          <div class="live-box">

            <div class="live-player">

              ${
                CONFIG.liveUrl
                  ? `
                    <iframe
                      src="${escapeHTML(CONFIG.liveUrl)}"
                      allow="autoplay; encrypted-media"
                      allowfullscreen
                    ></iframe>
                  `
                  : `
                    <div class="live-icon">
                      📺
                    </div>

                    <h2>
                      Gamarra TV
                    </h2>

                    <p>
                      La señal en vivo aparecerá aquí.
                    </p>

                    <p>
                      Puedes configurar el enlace de transmisión
                      en <strong>index.html</strong>.
                    </p>
                  `
              }

            </div>

          </div>

        </div>

      </section>

    `;

  }


  /* =========================================================
     LOGIN
     ========================================================= */

  function renderLogin() {

    app.innerHTML = `

      <section class="login-page">

        <div class="login-card">

          <img
            class="login-logo"
            src="https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png"
            alt="Gamarra TV"
          >


          <h1>
            Iniciar sesión
          </h1>


          <p class="login-description">
            Accede al panel de administración de Gamarra TV.
          </p>


          <div id="loginMessage"></div>


          <form id="loginForm">

            <div class="form-group">

              <label for="loginEmail">
                Correo electrónico
              </label>

              <input
                id="loginEmail"
                name="email"
                type="email"
                class="form-control"
                placeholder="correo@ejemplo.com"
                required
              >

            </div>


            <div class="form-group">

              <label for="loginPassword">
                Contraseña
              </label>

              <input
                id="loginPassword"
                name="password"
                type="password"
                class="form-control"
                placeholder="••••••••"
                required
              >

            </div>


            <button
              type="submit"
              class="btn btn-primary"
              style="width:100%"
            >
              Iniciar sesión
            </button>

          </form>


          <div style="text-align:center;margin-top:20px">

            <a
              href="#/"
              class="section-link"
            >
              ← Volver al sitio
            </a>

          </div>

        </div>

      </section>

    `;


    const form = document.getElementById("loginForm");


    form.addEventListener("submit", async event => {

      event.preventDefault();


      const message =
        document.getElementById("loginMessage");


      const email =
        document.getElementById("loginEmail").value.trim();


      const password =
        document.getElementById("loginPassword").value;


      message.innerHTML = `
        <div class="alert alert-info">
          Iniciando sesión...
        </div>
      `;


      const {
        error
      } = await sb.auth.signInWithPassword({
        email,
        password
      });


      if (error) {

        console.error(error);

        message.innerHTML = showError(
          "No se pudo iniciar sesión. Revisa el correo y la contraseña."
        );

        return;

      }


      showToast("Sesión iniciada correctamente.");

      await updateAuthButton();

      location.hash = "#/admin";

    });

  }


  /* =========================================================
     SUBIR IMAGEN
     ========================================================= */

  async function uploadImage(file) {

    if (!file) {
      return null;
    }


    if (!file.type.startsWith("image/")) {

      throw new Error(
        "El archivo seleccionado no es una imagen."
      );

    }


    if (file.size > 8 * 1024 * 1024) {

      throw new Error(
        "La imagen no puede superar los 8 MB."
      );

    }


    const extension =
      file.name.split(".").pop().toLowerCase();


    const random =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);


    const path =
      `${Date.now()}-${random}.${extension}`;


    const {
      error
    } = await sb.storage
      .from("noticias")
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });


    if (error) {
      throw error;
    }


    const {
      data
    } = sb.storage
      .from("noticias")
      .getPublicUrl(path);


    return data.publicUrl;

  }


  /* =========================================================
     ADMINISTRACIÓN
     ========================================================= */

  async function getAdminNews() {

    const {
      data,
      error
    } = await sb
      .from("noticias")
      .select("*")
      .order("created_at", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    return data || [];

  }


  async function getAdminPrograms() {

    return getPrograms(false);

  }


  function adminNewsItem(news) {

    return `

      <div class="admin-item">

        <div class="admin-item-title">

          ${escapeHTML(news.titulo)}

        </div>


        <div class="admin-item-meta">

          ${escapeHTML(categoryName(news.categoria))}

          ·

          ${
            news.publicada
              ? "Publicada"
              : "No publicada"
          }

        </div>


        <div class="admin-actions">

          <button
            class="btn btn-secondary"
            data-edit-news="${escapeHTML(news.id)}"
          >
            Editar
          </button>


          <button
            class="btn ${
              news.publicada
                ? "btn-secondary"
                : "btn-success"
            }"
            data-toggle-news="${escapeHTML(news.id)}"
          >
            ${
              news.publicada
                ? "Ocultar"
                : "Publicar"
            }
          </button>


          <button
            class="btn btn-danger"
            data-delete-news="${escapeHTML(news.id)}"
          >
            Eliminar
          </button>

        </div>

      </div>

    `;

  }


  function adminProgramItem(program) {

    return `

      <div class="admin-item">

        <div class="admin-item-title">

          ${escapeHTML(program.programa)}

        </div>


        <div class="admin-item-meta">

          ${escapeHTML(program.dia)}

          ·

          ${escapeHTML(program.hora)}

          ·

          ${
            program.activo
              ? "Activo"
              : "Inactivo"
          }

        </div>


        <div class="admin-actions">

          <button
            class="btn btn-secondary"
            data-edit-program="${escapeHTML(program.id)}"
          >
            Editar
          </button>


          <button
            class="btn ${
              program.activo
                ? "btn-secondary"
                : "btn-success"
            }"
            data-toggle-program="${escapeHTML(program.id)}"
          >
            ${
              program.activo
                ? "Desactivar"
                : "Activar"
            }
          </button>


          <button
            class="btn btn-danger"
            data-delete-program="${escapeHTML(program.id)}"
          >
            Eliminar
          </button>

        </div>

      </div>

    `;

  }


  async function renderAdmin() {

    const session = await getSession();


    if (!session) {

      renderLogin();

      return;

    }


    app.innerHTML = `

      <section class="admin-page">

        <div class="container">

          <div class="admin-header">

            <h1>
              Panel de Gamarra TV
            </h1>

            <p>
              Administra noticias y programación desde este lugar.
            </p>

          </div>


          <div id="adminMessage"></div>


          <div class="admin-grid">


            <!-- NOTICIAS -->

            <div class="admin-card">

              <h2>
                📰 Publicar noticia
              </h2>


              <form id="newsForm">

                <input
                  type="hidden"
                  id="newsId"
                >


                <div class="form-group">

                  <label>
                    Título
                  </label>

                  <input
                    id="newsTitle"
                    class="form-control"
                    required
                  >

                </div>


                <div class="form-group">

                  <label>
                    Categoría
                  </label>

                  <select
                    id="newsCategory"
                    class="form-control"
                    required
                  >

                    ${CATEGORIES.map(
                      category => `
                        <option value="${category}">
                          ${CATEGORY_NAMES[category]}
                        </option>
                      `
                    ).join("")}

                  </select>

                </div>


                <div class="form-group">

                  <label>
                    Resumen
                  </label>

                  <textarea
                    id="newsSummary"
                    placeholder="Resumen breve de la noticia"
                  ></textarea>

                </div>


                <div class="form-group">

                  <label>
                    Contenido
                  </label>

                  <textarea
                    id="newsContent"
                    required
                    placeholder="Escribe aquí el contenido de la noticia"
                  ></textarea>

                </div>


                <div class="form-group">

                  <label>
                    Imagen
                  </label>

                  <input
                    id="newsImage"
                    class="form-control"
                    type="file"
                    accept="image/*"
                  >

                </div>


                <div class="form-group">

                  <label>

                    <input
                      id="newsPublished"
                      type="checkbox"
                      checked
                    >

                    Publicar inmediatamente

                  </label>

                </div>


                <div class="admin-actions">

                  <button
                    type="submit"
                    class="btn btn-primary"
                  >
                    Guardar noticia
                  </button>


                  <button
                    type="button"
                    id="cancelNewsEdit"
                    class="btn btn-secondary"
                    style="display:none"
                  >
                    Cancelar edición
                  </button>

                </div>

              </form>


              <div class="admin-list">

                <h3>
                  Noticias
                </h3>

                <div id="adminNewsList"></div>

              </div>

            </div>


            <!-- PROGRAMACIÓN -->

            <div class="admin-card">

              <h2>
                📺 Administrar programación
              </h2>


              <form id="programForm">

                <input
                  type="hidden"
                  id="programId"
                >


                <div class="form-group">

                  <label>
                    Día
                  </label>

                  <select
                    id="programDay"
                    class="form-control"
                    required
                  >

                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miércoles">Miércoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                    <option value="sábado">Sábado</option>
                    <option value="domingo">Domingo</option>

                  </select>

                </div>


                <div class="form-group">

                  <label>
                    Hora
                  </label>

                  <input
                    id="programTime"
                    class="form-control"
                    type="time"
                    required
                  >

                </div>


                <div class="form-group">

                  <label>
                    Programa
                  </label>

                  <input
                    id="programName"
                    class="form-control"
                    required
                  >

                </div>


                <div class="form-group">

                  <label>
                    Descripción
                  </label>

                  <textarea
                    id="programDescription"
                    placeholder="Descripción del programa"
                  ></textarea>

                </div>


                <div class="form-group">

                  <label>
                    Imagen opcional
                  </label>

                  <input
                    id="programImage"
                    class="form-control"
                    type="file"
                    accept="image/*"
                  >

                </div>


                <div class="form-group">

                  <label>

                    <input
                      id="programActive"
                      type="checkbox"
                      checked
                    >

                    Programa activo

                  </label>

                </div>


                <div class="admin-actions">

                  <button
                    type="submit"
                    class="btn btn-primary"
                  >
                    Guardar programación
                  </button>


                  <button
                    type="button"
                    id="cancelProgramEdit"
                    class="btn btn-secondary"
                    style="display:none"
                  >
                    Cancelar edición
                  </button>

                </div>

              </form>


              <div class="admin-list">

                <h3>
                  Programas registrados
                </h3>

                <div id="adminProgramList"></div>

              </div>

            </div>

          </div>


          <div style="margin-top:25px">

            <button
              id="logoutButton"
              class="btn btn-danger"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

      </section>

    `;


    try {

      state.news = await getAdminNews();

      state.programs = await getAdminPrograms();


      document.getElementById("adminNewsList").innerHTML =

        state.news.length
          ? state.news.map(adminNewsItem).join("")
          : `
              <div class="empty">
                No hay noticias registradas.
              </div>
            `;


      document.getElementById("adminProgramList").innerHTML =

        state.programs.length
          ? state.programs
              .map(adminProgramItem)
              .join("")
          : `
              <div class="empty">
                No hay programación registrada.
              </div>
            `;

    } catch (error) {

      console.error(error);

      document.getElementById("adminMessage").innerHTML =
        showError(
          "No fue posible cargar los datos de administración."
        );

    }


    bindAdminEvents();

  }


  /* =========================================================
     EVENTOS ADMIN
     ========================================================= */

  function bindAdminEvents() {

    const newsForm =
      document.getElementById("newsForm");


    const programForm =
      document.getElementById("programForm");


    /* ---------------- NEWS ---------------- */

    newsForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const message =
          document.getElementById("adminMessage");


        try {

          const id =
            document.getElementById("newsId").value;


          const titulo =
            document.getElementById("newsTitle").value.trim();


          const categoria =
            document.getElementById("newsCategory").value;


          const resumen =
            document.getElementById("newsSummary").value.trim();


          const contenido =
            document.getElementById("newsContent").value.trim();


          const publicada =
            document.getElementById("newsPublished").checked;


          const file =
            document.getElementById("newsImage").files[0];


          message.innerHTML = `
            <div class="alert alert-info">
              Guardando noticia...
            </div>
          `;


          let imagen_url = null;


          if (file) {

            imagen_url = await uploadImage(file);

          }


          if (id) {

            const payload = {
              titulo,
              categoria,
              resumen,
              contenido,
              publicada
            };


            if (imagen_url) {

              payload.imagen_url = imagen_url;

            }


            const {
              error
            } = await sb
              .from("noticias")
              .update(payload)
              .eq("id", id);


            if (error) {
              throw error;
            }


            showToast(
              "Noticia actualizada correctamente."
            );

          } else {

            const payload = {
              titulo,
              categoria,
              resumen,
              contenido,
              publicada,
              imagen_url
            };


            const {
              error
            } = await sb
              .from("noticias")
              .insert(payload);


            if (error) {
              throw error;
            }


            showToast(
              "Noticia publicada correctamente."
            );

          }


          state.editingNewsId = null;

          await renderAdmin();

        } catch (error) {

          console.error(error);

          message.innerHTML =
            showError(
              error.message ||
              "No fue posible guardar la noticia."
            );

        }

      }
    );


    /* ---------------- PROGRAMACIÓN ---------------- */

    programForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const message =
          document.getElementById("adminMessage");


        try {

          const id =
            document.getElementById("programId").value;


          const dia =
            document.getElementById("programDay").value;


          const hora =
            document.getElementById("programTime").value;


          const programa =
            document.getElementById("programName").value.trim();


          const descripcion =
            document
              .getElementById("programDescription")
              .value
              .trim();


          const activo =
            document
              .getElementById("programActive")
              .checked;


          const file =
            document
              .getElementById("programImage")
              .files[0];


          message.innerHTML = `
            <div class="alert alert-info">
              Guardando programación...
            </div>
          `;


          let imagen_url = null;


          if (file) {

            imagen_url = await uploadImage(file);

          }


          if (id) {

            const payload = {
              dia,
              hora,
              programa,
              descripcion,
              activo
            };


            if (imagen_url) {

              payload.imagen_url = imagen_url;

            }


            const {
              error
            } = await sb
              .from("programacion")
              .update(payload)
              .eq("id", id);


            if (error) {
              throw error;
            }


            showToast(
              "Programación actualizada."
            );

          } else {

            const payload = {
              dia,
              hora,
              programa,
              descripcion,
              activo,
              imagen_url
            };


            const {
              error
            } = await sb
              .from("programacion")
              .insert(payload);


            if (error) {
              throw error;
            }


            showToast(
              "Programa agregado correctamente."
            );

          }


          state.editingProgramId = null;

          await renderAdmin();

        } catch (error) {

          console.error(error);

          message.innerHTML =
            showError(
              error.message ||
              "No fue posible guardar el programa."
            );

        }

      }
    );


    /* ---------------- LOGOUT ---------------- */

    document
      .getElementById("logoutButton")
      .addEventListener(
        "click",
        async () => {

          await sb.auth.signOut();

          await updateAuthButton();

          location.hash = "#/";

          showToast(
            "Sesión cerrada."
          );

        }
      );


    /* ---------------- CANCEL NEWS ---------------- */

    document
      .getElementById("cancelNewsEdit")
      .addEventListener(
        "click",
        () => {

          state.editingNewsId = null;

          resetNewsForm();

        }
      );


    /* ---------------- CANCEL PROGRAM ---------------- */

    document
      .getElementById("cancelProgramEdit")
      .addEventListener(
        "click",
        () => {

          state.editingProgramId = null;

          resetProgramForm();

        }
      );


    /* ---------------- EDIT NEWS ---------------- */

    document.querySelectorAll(
      "[data-edit-news]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.editNews;


          const news =
            state.news.find(
              item => String(item.id) === String(id)
            );


          if (!news) {
            return;
          }


          state.editingNewsId = id;


          document.getElementById("newsId").value =
            news.id;


          document.getElementById("newsTitle").value =
            news.titulo || "";


          document.getElementById("newsCategory").value =
            news.categoria || "gamarra";


          document.getElementById("newsSummary").value =
            news.resumen || "";


          document.getElementById("newsContent").value =
            news.contenido || "";


          document.getElementById("newsPublished").checked =
            !!news.publicada;


          document.getElementById(
            "cancelNewsEdit"
          ).style.display = "inline-block";


          document
            .getElementById("newsTitle")
            .focus();

        }
      );

    });


    /* ---------------- DELETE NEWS ---------------- */

    document.querySelectorAll(
      "[data-delete-news]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.deleteNews;


          if (!confirm(
            "¿Seguro que quieres eliminar esta noticia?"
          )) {
            return;
          }


          const {
            error
          } = await sb
            .from("noticias")
            .delete()
            .eq("id", id);


          if (error) {

            showToast(
              "No se pudo eliminar la noticia."
            );

            console.error(error);

            return;

          }


          showToast(
            "Noticia eliminada."
          );


          await renderAdmin();

        }
      );

    });


    /* ---------------- TOGGLE NEWS ---------------- */

    document.querySelectorAll(
      "[data-toggle-news]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.toggleNews;


          const news =
            state.news.find(
              item => String(item.id) === String(id)
            );


          if (!news) {
            return;
          }


          const {
            error
          } = await sb
            .from("noticias")
            .update({
              publicada: !news.publicada
            })
            .eq("id", id);


          if (error) {

            showToast(
              "No se pudo cambiar el estado."
            );

            return;

          }


          await renderAdmin();

        }
      );

    });


    /* ---------------- EDIT PROGRAM ---------------- */

    document.querySelectorAll(
      "[data-edit-program]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.editProgram;


          const program =
            state.programs.find(
              item => String(item.id) === String(id)
            );


          if (!program) {
            return;
          }


          state.editingProgramId = id;


          document.getElementById("programId").value =
            program.id;


          document.getElementById("programDay").value =
            program.dia || "lunes";


          document.getElementById("programTime").value =
            String(program.hora || "").substring(0, 5);


          document.getElementById("programName").value =
            program.programa || "";


          document.getElementById(
            "programDescription"
          ).value =
            program.descripcion || "";


          document.getElementById(
            "programActive"
          ).checked =
            !!program.activo;


          document.getElementById(
            "cancelProgramEdit"
          ).style.display =
            "inline-block";


          document
            .getElementById("programName")
            .focus();

        }
      );

    });


    /* ---------------- DELETE PROGRAM ---------------- */

    document.querySelectorAll(
      "[data-delete-program]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.deleteProgram;


          if (!confirm(
            "¿Seguro que quieres eliminar este programa?"
          )) {
            return;
          }


          const {
            error
          } = await sb
            .from("programacion")
            .delete()
            .eq("id", id);


          if (error) {

            console.error(error);

            showToast(
              "No se pudo eliminar el programa."
            );

            return;

          }


          showToast(
            "Programa eliminado."
          );


          await renderAdmin();

        }
      );

    });


    /* ---------------- TOGGLE PROGRAM ---------------- */

    document.querySelectorAll(
      "[data-toggle-program]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.toggleProgram;


          const program =
            state.programs.find(
              item => String(item.id) === String(id)
            );


          if (!program) {
            return;
          }


          const {
            error
          } = await sb
            .from("programacion")
            .update({
              activo: !program.activo
            })
            .eq("id", id);


          if (error) {

            showToast(
              "No se pudo cambiar el estado."
            );

            return;

          }


          await renderAdmin();

        }
      );

    });

  }


  function resetNewsForm() {

    document.getElementById("newsForm").reset();

    document.getElementById("newsId").value = "";

    document.getElementById("newsPublished").checked =
      true;

    document.getElementById(
      "cancelNewsEdit"
    ).style.display = "none";

  }


  function resetProgramForm() {

    document.getElementById("programForm").reset();

    document.getElementById("programId").value = "";

    document.getElementById("programActive").checked =
      true;

    document.getElementById(
      "cancelProgramEdit"
    ).style.display = "none";

  }


  /* =========================================================
     ROUTER
     ========================================================= */

  async function router() {

    closeMobileMenu();


    const route = getHashRoute();


    console.log(
      "Gamarra TV route:",
      route
    );


    /* INICIO */

    if (
      route === "/" ||
      route === ""
    ) {

      await renderHome();

      return;

    }


    /* LOGIN */

    if (
      route === "/login" ||
      route === "/iniciar-sesion"
    ) {

      const session = await getSession();


      if (session) {

        location.hash = "#/admin";

        return;

      }


      renderLogin();

      return;

    }


    /* ADMIN */

    if (
      route === "/admin" ||
      route === "/administracion"
    ) {

      await renderAdmin();

      return;

    }


    /* EN VIVO */

    if (
      route === "/en-vivo"
    ) {

      renderLive();

      return;

    }


    /* CATEGORÍA */

    if (
      route.startsWith("/categoria/")
    ) {

      const category =
        decodeURIComponent(
          route
            .replace("/categoria/", "")
            .split("/")[0]
        ).toLowerCase();


      if (!CATEGORIES.includes(category)) {

        app.innerHTML = `
          <section class="section">

            <div class="container">

              <div class="empty">

                <h2>
                  Sección no encontrada
                </h2>

                <a
                  href="#/"
                  class="btn btn-primary"
                >
                  Volver al inicio
                </a>

              </div>

            </div>

          </section>
        `;

        return;

      }


      await renderCategory(category);

      return;

    }


    /* NOTICIA */

    if (
      route.startsWith("/noticia/")
    ) {

      const id =
        decodeURIComponent(
          route.replace("/noticia/", "")
        );


      await renderArticle(id);

      return;

    }


    /* 404 */

    app.innerHTML = `

      <section class="section">

        <div class="container">

          <div class="empty">

            <h2>
              La página que buscas no existe.
            </h2>

            <p>
              Puede que el enlace haya cambiado.
            </p>

            <a
              href="#/"
              class="btn btn-primary"
            >
              Ir al inicio
            </a>

          </div>

        </div>

      </section>

    `;

  }


  /* =========================================================
     MENÚ MÓVIL
     ========================================================= */

  if (menuToggle) {

    menuToggle.addEventListener(
      "click",
      () => {

        mainNav.classList.toggle("open");

      }
    );

  }


  /* =========================================================
     CAMBIO DE RUTA
     ========================================================= */

  window.addEventListener(
    "hashchange",
    router
  );


  /* =========================================================
     AUTH STATE
     ========================================================= */

  async function startAuthListener() {

    if (!sb) {
      return;
    }


    sb.auth.onAuthStateChange(
      async () => {

        await updateAuthButton();

      }
    );

  }


  /* =========================================================
     INICIO
     ========================================================= */

  async function start() {

    const initialized =
      initSupabase();


    if (!initialized) {
      return;
    }


    await updateAuthButton();

    await startAuthListener();

    await router();

  }


  start();

})();
