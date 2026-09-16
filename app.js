(() => {

  "use strict";


  /* =========================================================
     CONFIGURACIÓN
  ========================================================= */

  const CFG =
    window.__SUPABASE_CONFIG__ || {};

  const app =
    document.getElementById("app");

  const authLink =
    document.getElementById("authLink");

  const menuToggle =
    document.getElementById("menuToggle");

  const mainNav =
    document.getElementById("mainNav");


  /* =========================================================
     ESTADO
  ========================================================= */

  let sb = null;

  let currentSession = null;

  let editingNewsId = null;

  let editingProgramId = null;

  let adminNews = [];

  let adminPrograms = [];


  /* =========================================================
     CONSTANTES
  ========================================================= */

  const CATEGORIES = [

    ["gamarra", "Gamarra"],

    ["judicial", "Judicial"],

    ["deportes", "Deportes"],

    ["region", "Región"],

    ["nacionales", "Nacionales"],

    ["internacionales", "Internacionales"],

    ["entretenimiento", "Entretenimiento"]

  ];


  const DAYS = [

    ["lunes", "LUN", 1],

    ["martes", "MAR", 2],

    ["miercoles", "MIÉ", 3],

    ["jueves", "JUE", 4],

    ["viernes", "VIE", 5],

    ["sabado", "SÁB", 6],

    ["domingo", "DOM", 7]

  ];


  /* =========================================================
     VALIDACIÓN DE CONFIGURACIÓN
  ========================================================= */

  if (
    !CFG.url ||
    !CFG.publishableKey
  ) {

    renderError(
      "Configuración pendiente",
      "Falta configurar la Publishable Key de Supabase en index.html."
    );

    return;

  }


  /* =========================================================
     CREAR SUPABASE
  ========================================================= */

  try {

    sb =
      window.supabase.createClient(
        CFG.url,
        CFG.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

  } catch (error) {

    renderError(
      "Error de conexión",
      error.message
    );

    return;

  }


  /* =========================================================
     UTILIDADES
  ========================================================= */

  function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

      return "";

    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function formatDate(dateValue) {

    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    );

  }


  function categoryName(slug) {

    const found =
      CATEGORIES.find(
        item => item[0] === slug
      );

    return found
      ? found[1]
      : slug || "Gamarra";

  }


  function dayName(slug) {

    const found =
      DAYS.find(
        item => item[0] === slug
      );

    return found
      ? found[1]
      : slug;

  }


  function dayNumber(slug) {

    const found =
      DAYS.find(
        item => item[0] === slug
      );

    return found
      ? found[2]
      : null;

  }


  function formatTime(value) {

    if (!value) {
      return "";
    }

    const parts =
      String(value).split(":");

    if (parts.length < 2) {
      return value;
    }

    const hour =
      Number(parts[0]);

    const minute =
      parts[1];

    if (
      Number.isNaN(hour)
    ) {

      return value;

    }

    const suffix =
      hour >= 12
        ? "p. m."
        : "a. m.";

    const hour12 =
      hour % 12 || 12;

    return `${hour12}:${minute} ${suffix}`;

  }


  function timeToMinutes(value) {

    if (!value) {
      return null;
    }

    const parts =
      String(value).split(":");

    if (parts.length < 2) {
      return null;
    }

    const h =
      Number(parts[0]);

    const m =
      Number(parts[1]);

    if (
      Number.isNaN(h) ||
      Number.isNaN(m)
    ) {

      return null;

    }

    return h * 60 + m;

  }


  function showError(message) {

    const old =
      document.querySelector(
        ".dynamic-alert"
      );

    if (old) {
      old.remove();
    }

    const div =
      document.createElement("div");

    div.className =
      "container dynamic-alert";

    div.innerHTML = `
      <div class="alert alert-error">
        ${escapeHTML(message)}
      </div>
    `;

    app.prepend(div);

  }


  function showSuccess(message) {

    const old =
      document.querySelector(
        ".dynamic-alert"
      );

    if (old) {
      old.remove();
    }

    const div =
      document.createElement("div");

    div.className =
      "container dynamic-alert";

    div.innerHTML = `
      <div class="alert alert-success">
        ${escapeHTML(message)}
      </div>
    `;

    app.prepend(div);

  }


  function renderError(title, message) {

    app.innerHTML = `

      <section class="section">

        <div class="container">

          <div class="admin-card">

            <h1>
              ${escapeHTML(title)}
            </h1>

            <div class="alert alert-error">

              ${escapeHTML(message)}

            </div>

          </div>

        </div>

      </section>

    `;

  }


  function imageUrl(url) {

    if (url) {
      return url;
    }

    return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";

  }


  /* =========================================================
     MENÚ
  ========================================================= */

  if (menuToggle) {

    menuToggle.addEventListener(
      "click",
      () => {

        mainNav.classList.toggle(
          "open"
        );

      }
    );

  }


  document.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          ".main-nav a"
        )
      ) {

        mainNav.classList.remove(
          "open"
        );

      }

    }
  );


  /* =========================================================
     AUTH
  ========================================================= */

  async function loadSession() {

    const {
      data,
      error
    } =
      await sb.auth.getSession();

    if (error) {

      console.error(error);

      return null;

    }

    currentSession =
      data.session || null;

    updateAuthLink();

    return currentSession;

  }


  function updateAuthLink() {

    if (!authLink) {
      return;
    }

    if (currentSession) {

      authLink.href =
        "#/admin";

      authLink.innerHTML =
        "⚙️ Panel";

    } else {

      authLink.href =
        "#/login";

      authLink.innerHTML =
        "🔒 Iniciar sesión";

    }

  }


  sb.auth.onAuthStateChange(
    (_event, session) => {

      currentSession =
        session || null;

      updateAuthLink();

    }
  );


  async function requireAuth() {

    const session =
      await loadSession();

    if (!session) {

      location.hash =
        "#/login";

      return false;

    }

    return true;

  }


  /* =========================================================
     NOTICIAS
  ========================================================= */

  async function getNews(limit = 12) {

    const {
      data,
      error
    } =
      await sb
        .from("noticias")
        .select("*")
        .eq("publicada", true)
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(limit);

    if (error) {

      throw error;

    }

    return data || [];

  }


  async function getAllNews() {

    const {
      data,
      error
    } =
      await sb
        .from("noticias")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {

      throw error;

    }

    return data || [];

  }


  /* =========================================================
     PROGRAMACIÓN
  ========================================================= */

  async function getPrograms() {

    const {
      data,
      error
    } =
      await sb
        .from("programacion")
        .select("*")
        .eq("activo", true)
        .order(
          "hora",
          {
            ascending: true
          }
        );

    if (error) {

      throw error;

    }

    return data || [];

  }


  async function getAllPrograms() {

    const {
      data,
      error
    } =
      await sb
        .from("programacion")
        .select("*")
        .order(
          "hora",
          {
            ascending: true
          }
        );

    if (error) {

      throw error;

    }

    return data || [];

  }


  /* =========================================================
     HOME
  ========================================================= */

  async function renderHome() {

    app.innerHTML = `

      <div class="loading-page">

        <div class="loading-spinner"></div>

        <p>
          Cargando noticias...
        </p>

      </div>

    `;

    try {

      const [
        news,
        programs
      ] =
        await Promise.all([
          getNews(12),
          getPrograms()
        ]);

      const featured =
        news[0] || null;

      const sideNews =
        news.slice(1, 4);

      const latest =
        news.slice(1);

      app.innerHTML = `

        ${
          featured
            ? renderHero(featured, sideNews)
            : ""
        }


        <section class="section">

          <div class="container">

            <div class="section-header">

              <h2 class="section-title">
                Últimas noticias
              </h2>

            </div>

            ${
              latest.length
                ? `
                  <div class="news-grid">

                    ${latest
                      .map(
                        renderNewsCard
                      )
                      .join("")}

                  </div>
                `
                : `
                  <div class="empty">
                    Aún no hay noticias publicadas.
                  </div>
                `
            }

          </div>

        </section>


        ${renderLiveSection(programs)}

      `;

      bindDayTabs();

      refreshLiveSchedule();

      startScheduleTimer();

    } catch (error) {

      console.error(error);

      renderError(
        "No se pudo cargar la página",
        error.message
      );

    }

  }


  function renderHero(
    article,
    sideNews
  ) {

    return `

      <section class="hero">

        <div class="container">

          <div class="hero-grid">


            <a
              href="#/noticia/${article.id}"
              class="hero-main"
            >

              <img
                src="${escapeHTML(
                  imageUrl(
                    article.imagen_url
                  )
                )}"
                alt="${escapeHTML(
                  article.titulo
                )}"
              >

              <div class="hero-overlay">

                <span class="category-badge">

                  ${escapeHTML(
                    categoryName(
                      article.categoria
                    )
                  )}

                </span>

                <h1 class="hero-title">

                  ${escapeHTML(
                    article.titulo
                  )}

                </h1>

                <p class="hero-summary">

                  ${escapeHTML(
                    article.resumen || ""
                  )}

                </p>

              </div>

            </a>


            <div class="side-news">

              ${
                sideNews.length
                  ? sideNews
                      .map(
                        renderSideCard
                      )
                      .join("")
                  : `
                    <div class="empty">
                      No hay más noticias.
                    </div>
                  `
              }

            </div>


          </div>

        </div>

      </section>

    `;

  }


  function renderSideCard(article) {

    return `

      <a
        class="side-card"
        href="#/noticia/${article.id}"
      >

        <img
          src="${escapeHTML(
            imageUrl(
              article.imagen_url
            )
          )}"
          alt="${escapeHTML(
            article.titulo
          )}"
        >

        <div class="side-card-content">

          <span class="category-badge">

            ${escapeHTML(
              categoryName(
                article.categoria
              )
            )}

          </span>

          <h3>

            ${escapeHTML(
              article.titulo
            )}

          </h3>

        </div>

      </a>

    `;

  }


  function renderNewsCard(article) {

    return `

      <article class="news-card">

        <a
          href="#/noticia/${article.id}"
        >

          <img
            class="news-card-image"
            src="${escapeHTML(
              imageUrl(
                article.imagen_url
              )
            )}"
            alt="${escapeHTML(
              article.titulo
            )}"
          >

          <div class="news-card-content">

            <span class="category-badge">

              ${escapeHTML(
                categoryName(
                  article.categoria
                )
              )}

            </span>

            <h3>

              ${escapeHTML(
                article.titulo
              )}

            </h3>

            <p>

              ${escapeHTML(
                article.resumen || ""
              )}

            </p>

          </div>

        </a>

      </article>

    `;

  }


  /* =========================================================
     LIVE + PROGRAMACIÓN
  ========================================================= */

  function renderLiveSection(
    programs
  ) {

    return `

      <section class="live-section">

        <div class="container">

          <div class="live-box">


            <div class="live-header">

              <h2>
                🔴 Señal en vivo
              </h2>

              <span class="live-status">
                EN VIVO
              </span>

            </div>


            <div class="live-grid">


              <div class="player-wrapper">

                <iframe
                  src="${escapeHTML(
                    CFG.liveUrl
                  )}"
                  title="Gamarra TV - Señal en vivo"
                  allow="autoplay; fullscreen"
                  allowfullscreen
                  loading="lazy"
                ></iframe>

              </div>


              <div
                class="schedule-panel"
                id="schedulePanel"
              >

                ${renderSchedulePanel(
                  programs
                )}

              </div>


            </div>

          </div>

        </div>

      </section>

    `;

  }


  function renderSchedulePanel(
    programs
  ) {

    const today =
      getTodaySlug();

    return `

      <h3 class="schedule-title">

        📺 PROGRAMACIÓN

      </h3>


      <div class="day-tabs">

        ${DAYS
          .map(
            day => `

              <button
                class="day-tab ${
                  day[0] === today
                    ? "active"
                    : ""
                }"
                type="button"
                data-day="${day[0]}"
              >

                ${day[1]}

              </button>

            `
          )
          .join("")}

      </div>


      <div
        class="schedule-list"
        id="scheduleList"
      >

        ${renderScheduleItems(
          programs,
          today
        )}

      </div>

    `;

  }


  function renderScheduleItems(
    programs,
    selectedDay
  ) {

    const dayPrograms =
      programs
        .filter(
          item =>
            item.dia === selectedDay ||
            Number(
              item.dia_semana
            ) === dayNumber(
              selectedDay
            )
        )
        .sort(
          (a, b) =>
            (
              timeToMinutes(a.hora) ??
              9999
            ) -
            (
              timeToMinutes(b.hora) ??
              9999
            )
        );


    if (!dayPrograms.length) {

      return `

        <div class="empty">

          No hay programación
          publicada para este día.

        </div>

      `;

    }


    const current =
      getCurrentProgram(
        dayPrograms
      );


    return dayPrograms
      .map(
        program =>
          renderScheduleItem(
            program,
            current
          )
      )
      .join("");

  }


  function renderScheduleItem(
    program,
    current
  ) {

    const isCurrent =
      current &&
      String(current.id) ===
      String(program.id);

    return `

      <div
        class="schedule-item ${
          isCurrent
            ? "active"
            : ""
        }"
        data-program-id="${program.id}"
      >

        ${
          isCurrent
            ? `
              <div class="on-air">
                🔴 EN VIVO AHORA
              </div>
            `
            : ""
        }

        <div class="schedule-time">

          ${formatTime(
            program.hora
          )}

          —

          ${formatTime(
            program.hora_fin
          )}

        </div>


        <div class="schedule-program">

          ${escapeHTML(
            program.programa ||
            "Programa"
          )}

        </div>


        ${
          program.descripcion
            ? `
              <div class="schedule-next">

                ${escapeHTML(
                  program.descripcion
                )}

              </div>
            `
            : ""
        }

      </div>

    `;

  }


  function getTodaySlug() {

    const day =
      new Date().getDay();

    const map = [

      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado"

    ];

    return map[day];

  }


  function getCurrentProgram(
    programs
  ) {

    const now =
      new Date();

    const minutes =
      now.getHours() * 60 +
      now.getMinutes();


    return programs.find(
      program => {

        const start =
          timeToMinutes(
            program.hora
          );

        const end =
          timeToMinutes(
            program.hora_fin
          );

        if (
          start === null ||
          end === null
        ) {

          return false;

        }


        if (end > start) {

          return (
            minutes >= start &&
            minutes < end
          );

        }


        /* Programa que cruza medianoche */

        return (
          minutes >= start ||
          minutes < end
        );

      }
    ) || null;

  }


  function bindDayTabs() {

    document
      .querySelectorAll(
        ".day-tab"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".day-tab"
              )
              .forEach(
                btn =>
                  btn.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );


            const selectedDay =
              button.dataset.day;


            if (
              window.__GTV_PROGRAMS__
            ) {

              const list =
                document.getElementById(
                  "scheduleList"
                );

              if (list) {

                list.innerHTML =
                  renderScheduleItems(
                    window.__GTV_PROGRAMS__,
                    selectedDay
                  );

              }

            }

          }
        );

      });

  }


  let scheduleTimer = null;


  function startScheduleTimer() {

    if (scheduleTimer) {

      clearInterval(
        scheduleTimer
      );

    }

    scheduleTimer =
      setInterval(
        refreshLiveSchedule,
        60000
      );

  }


  function refreshLiveSchedule() {

    const panel =
      document.getElementById(
        "schedulePanel"
      );

    if (!panel) {
      return;
    }

    const programs =
      window.__GTV_PROGRAMS__;

    if (!programs) {
      return;
    }

    const activeTab =
      document.querySelector(
        ".day-tab.active"
      );

    const selectedDay =
      activeTab
        ? activeTab.dataset.day
        : getTodaySlug();


    const list =
      document.getElementById(
        "scheduleList"
      );

    if (list) {

      list.innerHTML =
        renderScheduleItems(
          programs,
          selectedDay
        );

    }

  }


  /* =========================================================
     ENVIVO
  ========================================================= */

  async function renderLivePage() {

    app.innerHTML = `

      <section class="live-section">

        <div class="container">

          <div class="live-box">

            <div class="live-header">

              <h1>
                🔴 Gamarra TV en vivo
              </h1>

              <span class="live-status">
                EN VIVO
              </span>

            </div>

            <div id="livePageContent">

              <div class="loading-page">
                <div class="loading-spinner"></div>
              </div>

            </div>

          </div>

        </div>

      </section>

    `;


    try {

      const programs =
        await getPrograms();

      window.__GTV_PROGRAMS__ =
        programs;


      const content =
        document.getElementById(
          "livePageContent"
        );


      content.innerHTML = `

        <div class="live-grid">

          <div class="player-wrapper">

            <iframe
              src="${escapeHTML(
                CFG.liveUrl
              )}"
              title="Gamarra TV en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen
            ></iframe>

          </div>


          <div
            class="schedule-panel"
            id="schedulePanel"
          >

            ${renderSchedulePanel(
              programs
            )}

          </div>

        </div>

      `;


      bindDayTabs();

      refreshLiveSchedule();

      startScheduleTimer();

    } catch (error) {

      showError(
        error.message
      );

    }

  }


  /* =========================================================
     CATEGORÍA
  ========================================================= */

  async function renderCategory(
    slug
  ) {

    app.innerHTML = `

      <div class="loading-page">

        <div class="loading-spinner"></div>

        <p>
          Cargando noticias...
        </p>

      </div>

    `;


    try {

      const {
        data,
        error
      } =
        await sb
          .from("noticias")
          .select("*")
          .eq(
            "publicada",
            true
          )
          .eq(
            "categoria",
            slug
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (error) {
        throw error;
      }


      app.innerHTML = `

        <section class="section">

          <div class="container">

            <div class="section-header">

              <h1 class="section-title">

                ${escapeHTML(
                  categoryName(slug)
                )}

              </h1>

            </div>


            ${
              data && data.length
                ? `
                  <div class="news-grid">

                    ${data
                      .map(
                        renderNewsCard
                      )
                      .join("")}

                  </div>
                `
                : `
                  <div class="empty">

                    No hay noticias
                    publicadas en esta categoría.

                  </div>
                `
            }

          </div>

        </section>

      `;

    } catch (error) {

      renderError(
        "Error al cargar categoría",
        error.message
      );

    }

  }


  /* =========================================================
     NOTICIA INDIVIDUAL
  ========================================================= */

  async function renderArticle(
    id
  ) {

    app.innerHTML = `

      <div class="loading-page">

        <div class="loading-spinner"></div>

        <p>
          Cargando noticia...
        </p>

      </div>

    `;


    try {

      const {
        data,
        error
      } =
        await sb
          .from("noticias")
          .select("*")
          .eq("id", id)
          .eq("publicada", true)
          .maybeSingle();


      if (error) {
        throw error;
      }


      if (!data) {

        renderError(
          "Noticia no encontrada",
          "La noticia no existe o ya no está publicada."
        );

        return;

      }


      app.innerHTML = `

        <section class="article-page">

          <div class="container">

            <article class="article-container">

              <span class="category-badge">

                ${escapeHTML(
                  categoryName(
                    data.categoria
                  )
                )}

              </span>


              <h1 class="article-title">

                ${escapeHTML(
                  data.titulo
                )}

              </h1>


              <div class="article-meta">

                Publicado el
                ${escapeHTML(
                  formatDate(
                    data.created_at
                  )
                )}

              </div>


              ${
                data.imagen_url
                  ? `
                    <img
                      class="article-image"
                      src="${escapeHTML(
                        data.imagen_url
                      )}"
                      alt="${escapeHTML(
                        data.titulo
                      )}"
                    >
                  `
                  : ""
              }


              ${
                data.resumen
                  ? `
                    <p>
                      <strong>
                        ${escapeHTML(
                          data.resumen
                        )}
                      </strong>
                    </p>
                  `
                  : ""
              }


              <div class="article-content">

                ${escapeHTML(
                  data.contenido
                )}

              </div>

            </article>

          </div>

        </section>

      `;

    } catch (error) {

      renderError(
        "Error al cargar noticia",
        error.message
      );

    }

  }


  /* =========================================================
     LOGIN
  ========================================================= */

  function renderLogin() {

    app.innerHTML = `

      <section class="auth-page">

        <div class="auth-card">

          <img
            class="auth-logo"
            src="https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png"
            alt="Gamarra TV"
          >


          <h1>
            Iniciar sesión
          </h1>


          <p class="auth-subtitle">

            Accede al panel de Gamarra TV
            para publicar noticias y administrar
            la programación.

          </p>


          <form id="loginForm">


            <div class="form-group">

              <label for="loginEmail">
                Correo electrónico
              </label>

              <input
                id="loginEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                required
              >

            </div>


            <div class="form-group">

              <label for="loginPassword">
                Contraseña
              </label>

              <input
                id="loginPassword"
                type="password"
                placeholder="Tu contraseña"
                autocomplete="current-password"
                required
              >

            </div>


            <div id="loginMessage"></div>


            <button
              class="btn btn-primary btn-block"
              type="submit"
            >

              🔐 Iniciar sesión

            </button>


          </form>

        </div>

      </section>

    `;


    const form =
      document.getElementById(
        "loginForm"
      );


    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          document
            .getElementById(
              "loginEmail"
            )
            .value
            .trim();


        const password =
          document
            .getElementById(
              "loginPassword"
            )
            .value;


        const message =
          document.getElementById(
            "loginMessage"
          );


        message.innerHTML = `

          <div class="alert alert-info">

            Iniciando sesión...

          </div>

        `;


        const {
          data,
          error
        } =
          await sb.auth
            .signInWithPassword({
              email,
              password
            });


        if (error) {

          message.innerHTML = `

            <div class="alert alert-error">

              ${escapeHTML(
                error.message
              )}

            </div>

          `;

          return;

        }


        currentSession =
          data.session;


        updateAuthLink();


        location.hash =
          "#/admin";

      }
    );

  }


  /* =========================================================
     ADMIN
  ========================================================= */

  async function renderAdmin() {

    const authenticated =
      await requireAuth();

    if (!authenticated) {
      return;
    }


    app.innerHTML = `

      <section class="admin-page">

        <div class="container">


          <div class="admin-header">

            <div>

              <h1>
                Panel de Gamarra TV
              </h1>

              <div class="admin-user">

                Sesión:
                ${escapeHTML(
                  currentSession.user.email
                )}

              </div>

            </div>


            <div class="admin-actions">

              <a
                href="#/"
                class="btn btn-light"
              >
                Ver página
              </a>

              <button
                id="logoutBtn"
                class="btn btn-danger"
                type="button"
              >
                Cerrar sesión
              </button>

            </div>

          </div>


          <div id="adminMessage"></div>


          <div class="admin-grid">


            <!-- =================================================
                 NOTICIAS
            ================================================== -->

            <div class="admin-card">

              <h2>
                📰
                <span id="newsFormTitle">
                  Publicar noticia
                </span>
              </h2>


              <form id="newsForm">


                <div class="form-group">

                  <label for="newsTitle">
                    Título
                  </label>

                  <input
                    id="newsTitle"
                    type="text"
                    placeholder="Título de la noticia"
                    required
                  >

                </div>


                <div class="form-group">

                  <label for="newsCategory">
                    Categoría
                  </label>

                  <select
                    id="newsCategory"
                    required
                  >

                    ${CATEGORIES
                      .map(
                        item => `
                          <option
                            value="${item[0]}"
                          >
                            ${item[1]}
                          </option>
                        `
                      )
                      .join("")}

                  </select>

                </div>


                <div class="form-group">

                  <label for="newsSummary">
                    Resumen
                  </label>

                  <textarea
                    id="newsSummary"
                    placeholder="Resumen breve de la noticia"
                  ></textarea>

                </div>


                <div class="form-group">

                  <label for="newsContent">
                    Contenido
                  </label>

                  <textarea
                    id="newsContent"
                    placeholder="Escribe aquí el contenido completo..."
                    required
                  ></textarea>

                </div>


                <div class="form-group">

                  <label for="newsImage">
                    Imagen
                  </label>

                  <input
                    id="newsImage"
                    type="file"
                    accept="image/*"
                  >

                  <small>
                    JPG, PNG o WEBP. Máximo recomendado: 8 MB.
                  </small>

                </div>


                <div class="checkbox-row">

                  <input
                    id="newsPublished"
                    type="checkbox"
                    checked
                  >

                  <label
                    for="newsPublished"
                  >
                    Publicar inmediatamente
                  </label>

                </div>


                <div class="admin-actions">

                  <button
                    class="btn btn-primary"
                    type="submit"
                  >
                    <span id="newsSubmitText">
                      Publicar noticia
                    </span>
                  </button>


                  <button
                    id="cancelNewsEdit"
                    class="btn btn-light"
                    type="button"
                    style="display:none"
                  >
                    Cancelar edición
                  </button>

                </div>


              </form>


              <div class="admin-list">

                <h3>
                  Noticias publicadas
                </h3>

                <div id="adminNewsList">

                  Cargando...

                </div>

              </div>

            </div>


            <!-- =================================================
                 PROGRAMACIÓN
            ================================================== -->

            <div class="admin-card">

              <h2>
                📺
                <span id="programFormTitle">
                  Administrar programación
                </span>
              </h2>


              <form id="programForm">


                <div class="form-group">

                  <label for="programDay">
                    Día
                  </label>

                  <select
                    id="programDay"
                    required
                  >

                    ${DAYS
                      .map(
                        day => `
                          <option
                            value="${day[0]}"
                          >
                            ${day[1]}
                          </option>
                        `
                      )
                      .join("")}

                  </select>

                </div>


                <!-- HORA INICIO Y FINAL -->

                <div class="form-row">


                  <div class="form-group">

                    <label for="programStart">
                      Hora de inicio
                    </label>

                    <input
                      id="programStart"
                      type="time"
                      required
                    >

                  </div>


                  <div class="form-group">

                    <label for="programEnd">
                      Hora final
                    </label>

                    <input
                      id="programEnd"
                      type="time"
                      required
                    >

                  </div>


                </div>


                <div class="form-group">

                  <label for="programName">
                    Programa
                  </label>

                  <input
                    id="programName"
                    type="text"
                    placeholder="Nombre del programa"
                    required
                  >

                </div>


                <div class="form-group">

                  <label for="programDescription">
                    Descripción
                  </label>

                  <textarea
                    id="programDescription"
                    placeholder="Descripción del programa"
                  ></textarea>

                </div>


                <div class="form-group">

                  <label for="programImage">
                    Imagen
                  </label>

                  <input
                    id="programImage"
                    type="file"
                    accept="image/*"
                  >

                </div>


                <div class="form-group">

                  <label for="programImageUrl">
                    O URL de imagen
                  </label>

                  <input
                    id="programImageUrl"
                    type="url"
                    placeholder="https://..."
                  >

                </div>


                <div class="checkbox-row">

                  <input
                    id="programActive"
                    type="checkbox"
                    checked
                  >

                  <label
                    for="programActive"
                  >
                    Mostrar en programación
                  </label>

                </div>


                <div class="admin-actions">

                  <button
                    class="btn btn-primary"
                    type="submit"
                  >

                    <span id="programSubmitText">
                      Guardar programa
                    </span>

                  </button>


                  <button
                    id="cancelProgramEdit"
                    class="btn btn-light"
                    type="button"
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

                <div id="adminProgramList">

                  Cargando...

                </div>

              </div>

            </div>


          </div>

        </div>

      </section>

    `;


    bindAdminEvents();

    await loadAdminData();

  }


  /* =========================================================
     ADMIN - EVENTOS
  ========================================================= */

  function bindAdminEvents() {

    const logoutBtn =
      document.getElementById(
        "logoutBtn"
      );


    logoutBtn.addEventListener(
      "click",
      async () => {

        await sb.auth.signOut();

        currentSession = null;

        updateAuthLink();

        location.hash =
          "#/";

      }
    );


    document
      .getElementById(
        "newsForm"
      )
      .addEventListener(
        "submit",
        handleNewsSubmit
      );


    document
      .getElementById(
        "programForm"
      )
      .addEventListener(
        "submit",
        handleProgramSubmit
      );


    document
      .getElementById(
        "cancelNewsEdit"
      )
      .addEventListener(
        "click",
        resetNewsForm
      );


    document
      .getElementById(
        "cancelProgramEdit"
      )
      .addEventListener(
        "click",
        resetProgramForm
      );

  }


  /* =========================================================
     ADMIN - CARGAR DATOS
  ========================================================= */

  async function loadAdminData() {

    try {

      adminNews =
        await getAllNews();

      adminPrograms =
        await getAllPrograms();


      renderAdminNews();

      renderAdminPrograms();


      window.__GTV_PROGRAMS__ =
        adminPrograms;

    } catch (error) {

      console.error(error);

      const message =
        document.getElementById(
          "adminMessage"
        );

      if (message) {

        message.innerHTML = `

          <div class="alert alert-error">

            ${escapeHTML(
              error.message
            )}

          </div>

        `;

      }

    }

  }


  /* =========================================================
     ADMIN - NOTICIAS
  ========================================================= */

  async function handleNewsSubmit(
    event
  ) {

    event.preventDefault();


    const title =
      document
        .getElementById(
          "newsTitle"
        )
        .value
        .trim();


    const category =
      document
        .getElementById(
          "newsCategory"
        )
        .value;


    const summary =
      document
        .getElementById(
          "newsSummary"
        )
        .value
        .trim();


    const content =
      document
        .getElementById(
          "newsContent"
        )
        .value
        .trim();


    const published =
      document
        .getElementById(
          "newsPublished"
        )
        .checked;


    const file =
      document
        .getElementById(
          "newsImage"
        )
        .files[0];


    const message =
      document.getElementById(
        "adminMessage"
      );


    try {

      message.innerHTML = `

        <div class="alert alert-info">

          Guardando noticia...

        </div>

      `;


      let imageUrl = null;


      if (
        editingNewsId
      ) {

        const old =
          adminNews.find(
            item =>
              String(item.id) ===
              String(editingNewsId)
          );

        imageUrl =
          old
            ? old.imagen_url
            : null;

      }


      if (file) {

        imageUrl =
          await uploadImage(
            file
          );

      }


      const payload = {

        titulo: title,

        resumen:
          summary || null,

        contenido: content,

        imagen_url:
          imageUrl || null,

        categoria: category,

        publicada: published

      };


      if (editingNewsId) {

        const {
          error
        } =
          await sb
            .from("noticias")
            .update(payload)
            .eq(
              "id",
              editingNewsId
            );

        if (error) {
          throw error;
        }


        message.innerHTML = `

          <div class="alert alert-success">

            Noticia actualizada correctamente.

          </div>

        `;

      } else {

        const {
          error
        } =
          await sb
            .from("noticias")
            .insert(
              payload
            );

        if (error) {
          throw error;
        }


        message.innerHTML = `

          <div class="alert alert-success">

            Noticia publicada correctamente.

          </div>

        `;

      }


      resetNewsForm();

      await loadAdminData();

    } catch (error) {

      console.error(error);

      message.innerHTML = `

        <div class="alert alert-error">

          Error:
          ${escapeHTML(
            error.message
          )}

        </div>

      `;

    }

  }


  /* =========================================================
     SUBIR IMAGEN
  ========================================================= */

  async function uploadImage(
    file
  ) {

    if (!file) {
      return null;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      throw new Error(
        "El archivo seleccionado no es una imagen."
      );

    }


    if (
      file.size >
      8 * 1024 * 1024
    ) {

      throw new Error(
        "La imagen supera los 8 MB. Comprímela antes de subirla."
      );

    }


    const extension =
      (
        file.name.split(".").pop()
        || "jpg"
      )
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        );


    const filename =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.${extension}`;


    const {
      error
    } =
      await sb.storage
        .from("noticias")
        .upload(
          filename,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          }
        );


    if (error) {
      throw error;
    }


    const {
      data
    } =
      sb.storage
        .from("noticias")
        .getPublicUrl(
          filename
        );


    return data.publicUrl;

  }


  /* =========================================================
     RENDER ADMIN NOTICIAS
  ========================================================= */

  function renderAdminNews() {

    const container =
      document.getElementById(
        "adminNewsList"
      );


    if (!container) {
      return;
    }


    if (!adminNews.length) {

      container.innerHTML = `

        <div class="empty">

          No hay noticias registradas.

        </div>

      `;

      return;

    }


    container.innerHTML =
      adminNews
        .map(
          article => `

            <div class="admin-item">

              <div class="admin-item-title">

                ${escapeHTML(
                  article.titulo
                )}

              </div>


              <div class="admin-item-meta">

                ${escapeHTML(
                  categoryName(
                    article.categoria
                  )
                )}

                ·

                ${
                  article.publicada
                    ? "Publicada"
                    : "No publicada"
                }

                ·

                ${escapeHTML(
                  formatDate(
                    article.created_at
                  )
                )}

              </div>


              <div class="admin-item-actions">

                <button
                  class="btn btn-light"
                  type="button"
                  data-edit-news="${article.id}"
                >
                  Editar
                </button>


                <button
                  class="btn btn-dark"
                  type="button"
                  data-toggle-news="${article.id}"
                >

                  ${
                    article.publicada
                      ? "Ocultar"
                      : "Publicar"
                  }

                </button>


                <button
                  class="btn btn-danger"
                  type="button"
                  data-delete-news="${article.id}"
                >
                  Eliminar
                </button>

              </div>

            </div>

          `
        )
        .join("");


    container
      .querySelectorAll(
        "[data-edit-news]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editNews(
                button.dataset.editNews
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-toggle-news]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              toggleNews(
                button.dataset.toggleNews
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-delete-news]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              deleteNews(
                button.dataset.deleteNews
              )
          );

        }
      );

  }


  /* =========================================================
     EDITAR NOTICIA
  ========================================================= */

  function editNews(id) {

    const article =
      adminNews.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!article) {
      return;
    }


    editingNewsId =
      article.id;


    document.getElementById(
      "newsTitle"
    ).value =
      article.titulo || "";


    document.getElementById(
      "newsCategory"
    ).value =
      article.categoria ||
      "gamarra";


    document.getElementById(
      "newsSummary"
    ).value =
      article.resumen || "";


    document.getElementById(
      "newsContent"
    ).value =
      article.contenido || "";


    document.getElementById(
      "newsPublished"
    ).checked =
      Boolean(
        article.publicada
      );


    document.getElementById(
      "newsFormTitle"
    ).textContent =
      "Editar noticia";


    document.getElementById(
      "newsSubmitText"
    ).textContent =
      "Guardar cambios";


    document.getElementById(
      "cancelNewsEdit"
    ).style.display =
      "inline-block";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =========================================================
     ELIMINAR NOTICIA
  ========================================================= */

  async function deleteNews(id) {

    if (
      !confirm(
        "¿Deseas eliminar esta noticia?"
      )
    ) {

      return;

    }


    try {

      const {
        error
      } =
        await sb
          .from("noticias")
          .delete()
          .eq("id", id);


      if (error) {
        throw error;
      }


      showSuccess(
        "Noticia eliminada correctamente."
      );


      await loadAdminData();

    } catch (error) {

      showError(
        error.message
      );

    }

  }


  /* =========================================================
     PUBLICAR / OCULTAR NOTICIA
  ========================================================= */

  async function toggleNews(id) {

    const article =
      adminNews.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!article) {
      return;
    }


    try {

      const {
        error
      } =
        await sb
          .from("noticias")
          .update({
            publicada:
              !article.publicada
          })
          .eq(
            "id",
            id
          );


      if (error) {
        throw error;
      }


      await loadAdminData();

    } catch (error) {

      showError(
        error.message
      );

    }

  }


  /* =========================================================
     RESET NEWS
  ========================================================= */

  function resetNewsForm() {

    editingNewsId =
      null;


    const form =
      document.getElementById(
        "newsForm"
      );


    if (form) {
      form.reset();
    }


    document.getElementById(
      "newsPublished"
    ).checked = true;


    document.getElementById(
      "newsFormTitle"
    ).textContent =
      "Publicar noticia";


    document.getElementById(
      "newsSubmitText"
    ).textContent =
      "Publicar noticia";


    document.getElementById(
      "cancelNewsEdit"
    ).style.display =
      "none";

  }


  /* =========================================================
     ADMIN - PROGRAMACIÓN
  ========================================================= */

  async function handleProgramSubmit(
    event
  ) {

    event.preventDefault();


    const dia =
      document
        .getElementById(
          "programDay"
        )
        .value;


    const hora =
      document
        .getElementById(
          "programStart"
        )
        .value;


    const horaFin =
      document
        .getElementById(
          "programEnd"
        )
        .value;


    const programa =
      document
        .getElementById(
          "programName"
        )
        .value
        .trim();


    const descripcion =
      document
        .getElementById(
          "programDescription"
        )
        .value
        .trim();


    const imageUrlInput =
      document
        .getElementById(
          "programImageUrl"
        )
        .value
        .trim();


    const activo =
      document
        .getElementById(
          "programActive"
        )
        .checked;


    const file =
      document
        .getElementById(
          "programImage"
        )
        .files[0];


    const message =
      document.getElementById(
        "adminMessage"
      );


    if (
      !hora ||
      !horaFin
    ) {

      showError(
        "Debes indicar la hora de inicio y la hora final."
      );

      return;

    }


    if (
      timeToMinutes(horaFin) <=
      timeToMinutes(hora)
    ) {

      showError(
        "La hora final debe ser posterior a la hora de inicio."
      );

      return;

    }


    try {

      message.innerHTML = `

        <div class="alert alert-info">

          Guardando programación...

        </div>

      `;


      let imageUrl =
        imageUrlInput || null;


      if (
        editingProgramId
      ) {

        const old =
          adminPrograms.find(
            item =>
              String(item.id) ===
              String(
                editingProgramId
              )
          );


        if (
          !imageUrl &&
          old
        ) {

          imageUrl =
            old.imagen_url;

        }

      }


      if (file) {

        imageUrl =
          await uploadImage(
            file
          );

      }


      const payload = {

        dia: dia,

        /*
         * IMPORTANTE:
         * dia_semana es INTEGER
         * en Supabase.
         */
        dia_semana:
          dayNumber(dia),

        hora:
          hora,

        hora_fin:
          horaFin,

        programa:
          programa,

        descripcion:
          descripcion || null,

        imagen_url:
          imageUrl,

        activo:
          activo

      };


      if (
        editingProgramId
      ) {

        const {
          error
        } =
          await sb
            .from(
              "programacion"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editingProgramId
            );


        if (error) {
          throw error;
        }


        message.innerHTML = `

          <div class="alert alert-success">

            Programa actualizado correctamente.

          </div>

        `;

      } else {

        const {
          error
        } =
          await sb
            .from(
              "programacion"
            )
            .insert(
              payload
            );


        if (error) {
          throw error;
        }


        message.innerHTML = `

          <div class="alert alert-success">

            Programa guardado correctamente.

          </div>

        `;

      }


      resetProgramForm();

      await loadAdminData();

    } catch (error) {

      console.error(error);

      message.innerHTML = `

        <div class="alert alert-error">

          Error al guardar programación:

          ${escapeHTML(
            error.message
          )}

        </div>

      `;

    }

  }


  /* =========================================================
     RENDER PROGRAMACIÓN ADMIN
  ========================================================= */

  function renderAdminPrograms() {

    const container =
      document.getElementById(
        "adminProgramList"
      );


    if (!container) {
      return;
    }


    if (!adminPrograms.length) {

      container.innerHTML = `

        <div class="empty">

          No hay programas registrados.

        </div>

      `;

      return;

    }


    const sorted =
      [...adminPrograms].sort(
        (a, b) => {

          const dayA =
            Number(
              a.dia_semana
            ) ||
            dayNumber(
              a.dia
            ) ||
            99;


          const dayB =
            Number(
              b.dia_semana
            ) ||
            dayNumber(
              b.dia
            ) ||
            99;


          if (
            dayA !== dayB
          ) {

            return dayA - dayB;

          }


          return (
            timeToMinutes(
              a.hora
            ) || 9999
          ) -
          (
            timeToMinutes(
              b.hora
            ) || 9999
          );

        }
      );


    container.innerHTML =
      sorted
        .map(
          program => `

            <div class="admin-item">

              <div class="admin-item-title">

                ${escapeHTML(
                  program.programa
                )}

              </div>


              <div class="admin-item-meta">

                ${escapeHTML(
                  dayName(
                    program.dia
                  )
                )}

                ·

                ${escapeHTML(
                  formatTime(
                    program.hora
                  )
                )}

                —

                ${escapeHTML(
                  formatTime(
                    program.hora_fin
                  )
                )}

                ·

                ${
                  program.activo
                    ? "Activo"
                    : "Oculto"
                }

              </div>


              <div class="admin-item-actions">


                <button
                  class="btn btn-light"
                  type="button"
                  data-edit-program="${program.id}"
                >

                  Editar

                </button>


                <button
                  class="btn btn-dark"
                  type="button"
                  data-toggle-program="${program.id}"
                >

                  ${
                    program.activo
                      ? "Ocultar"
                      : "Activar"
                  }

                </button>


                <button
                  class="btn btn-danger"
                  type="button"
                  data-delete-program="${program.id}"
                >

                  Eliminar

                </button>


              </div>

            </div>

          `
        )
        .join("");


    container
      .querySelectorAll(
        "[data-edit-program]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              editProgram(
                button.dataset.editProgram
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-toggle-program]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              toggleProgram(
                button.dataset.toggleProgram
              )
          );

        }
      );


    container
      .querySelectorAll(
        "[data-delete-program]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              deleteProgram(
                button.dataset.deleteProgram
              )
          );

        }
      );

  }


  /* =========================================================
     EDITAR PROGRAMACIÓN
  ========================================================= */

  function editProgram(id) {

    const program =
      adminPrograms.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!program) {
      return;
    }


    editingProgramId =
      program.id;


    document.getElementById(
      "programDay"
    ).value =
      program.dia ||
      "lunes";


    document.getElementById(
      "programStart"
    ).value =
      program.hora || "";


    document.getElementById(
      "programEnd"
    ).value =
      program.hora_fin || "";


    document.getElementById(
      "programName"
    ).value =
      program.programa || "";


    document.getElementById(
      "programDescription"
    ).value =
      program.descripcion || "";


    document.getElementById(
      "programImageUrl"
    ).value =
      program.imagen_url || "";


    document.getElementById(
      "programActive"
    ).checked =
      Boolean(
        program.activo
      );


    document.getElementById(
      "programFormTitle"
    ).textContent =
      "Editar programación";


    document.getElementById(
      "programSubmitText"
    ).textContent =
      "Guardar cambios";


    document.getElementById(
      "cancelProgramEdit"
    ).style.display =
      "inline-block";


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =========================================================
     ELIMINAR PROGRAMACIÓN
  ========================================================= */

  async function deleteProgram(id) {

    if (
      !confirm(
        "¿Deseas eliminar este programa?"
      )
    ) {

      return;

    }


    try {

      const {
        error
      } =
        await sb
          .from(
            "programacion"
          )
          .delete()
          .eq(
            "id",
            id
          );


      if (error) {
        throw error;
      }


      showSuccess(
        "Programa eliminado correctamente."
      );


      await loadAdminData();

    } catch (error) {

      showError(
        error.message
      );

    }

  }


  /* =========================================================
     ACTIVAR / DESACTIVAR PROGRAMACIÓN
  ========================================================= */

  async function toggleProgram(id) {

    const program =
      adminPrograms.find(
        item =>
          String(item.id) ===
          String(id)
      );


    if (!program) {
      return;
    }


    try {

      const {
        error
      } =
        await sb
          .from(
            "programacion"
          )
          .update({
            activo:
              !program.activo
          })
          .eq(
            "id",
            id
          );


      if (error) {
        throw error;
      }


      await loadAdminData();

    } catch (error) {

      showError(
        error.message
      );

    }

  }


  /* =========================================================
     RESET PROGRAMACIÓN
  ========================================================= */

  function resetProgramForm() {

    editingProgramId =
      null;


    const form =
      document.getElementById(
        "programForm"
      );


    if (form) {
      form.reset();
    }


    document.getElementById(
      "programActive"
    ).checked = true;


    document.getElementById(
      "programFormTitle"
    ).textContent =
      "Administrar programación";


    document.getElementById(
      "programSubmitText"
    ).textContent =
      "Guardar programa";


    document.getElementById(
      "cancelProgramEdit"
    ).style.display =
      "none";

  }


  /* =========================================================
     ROUTER
  ========================================================= */

  async function router() {

    const hash =
      location.hash || "#/";


    const clean =
      hash
        .replace(/^#\/?/, "")
        .replace(/\/+$/, "");


    if (
      !clean
    ) {

      await renderHome();

      return;

    }


    const parts =
      clean.split("/");


    if (
      parts[0] === "login"
    ) {

      const session =
        await loadSession();

      if (session) {

        location.hash =
          "#/admin";

        return;

      }

      renderLogin();

      return;

    }


    if (
      parts[0] === "admin"
    ) {

      await renderAdmin();

      return;

    }


    if (
      parts[0] === "en-vivo"
    ) {

      await renderLivePage();

      return;

    }


    if (
      parts[0] === "categoria" &&
      parts[1]
    ) {

      await renderCategory(
        parts[1]
      );

      return;

    }


    if (
      parts[0] === "noticia" &&
      parts[1]
    ) {

      await renderArticle(
        parts[1]
      );

      return;

    }


    await renderHome();

  }


  /* =========================================================
     INIT
  ========================================================= */

  window.addEventListener(
    "hashchange",
    router
  );


  window.addEventListener(
    "load",
    async () => {

      await loadSession();

      await router();

    }
  );


})();
