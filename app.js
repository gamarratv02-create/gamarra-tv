/* =========================================================
   GAMARRA TV
   app.js
========================================================= */


/* =========================================================
   CONFIGURACIÓN SUPABASE
========================================================= */

/*
  IMPORTANTE:

  Cambia solamente SUPABASE_URL.

  Ejemplo:

  const SUPABASE_URL =
    "https://xxxxxxxxxxxxxxxx.supabase.co";

  Tu Publishable Key ya está colocada.
*/

const SUPABASE_URL =
  "PEGA_AQUI_LA_URL_DE_TU_PROYECTO_SUPABASE";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsK";


/* =========================================================
   DATOS DE GAMARRA TV
========================================================= */

const SITE_NAME = "Gamarra TV";

const SITE_URL =
  window.location.origin;

const LOGO_URL =
  "https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png";

const WHATSAPP =
  "573027820622";

const PHONE =
  "3027820622";

const EMAIL =
  "gamarratv02@gmail.com";

const OPENCASTER_URL =
  "https://new.opencaster.com/player/embed?user=gamarratv";


/* =========================================================
   CATEGORÍAS
========================================================= */

const CATEGORIES = [
  "Gamarra",
  "Seguridad",
  "Judicial",
  "Política",
  "Educación",
  "Salud",
  "Economía",
  "Deportes",
  "Región",
  "Nacionales",
  "Internacionales",
  "Entretenimiento"
];


const DAY_NAMES = {
  1: "LUN",
  2: "MAR",
  3: "MIÉ",
  4: "JUE",
  5: "VIE",
  6: "SÁB",
  7: "DOM"
};


/* =========================================================
   SUPABASE
========================================================= */

let supabase = null;

if (
  SUPABASE_URL &&
  !SUPABASE_URL.startsWith("PEGA_AQUI")
) {

  supabase =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

}


/* =========================================================
   ESTADO
========================================================= */

let currentNews = [];

let currentPrograms = [];

let currentClients = [];

let currentAds = [];

let currentUser = null;

let selectedNewsCategory = "Todas";

let selectedScheduleDay = getTodayDay();


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupForms();

    setupImagePreviews();

    await checkSession();

    await route();

  }
);


/* =========================================================
   UTILIDADES
========================================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function slugify(text) {

  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

}


function formatDate(date) {

  if (!date) {
    return "";
  }

  const d = new Date(date);

  return d.toLocaleDateString(
    "es-CO",
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


function formatTime(time) {

  if (!time) {
    return "";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  let hour = parseInt(parts[0], 10);

  const minute = parts[1];

  const suffix = hour >= 12 ? "p. m." : "a. m.";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${suffix}`;

}


function getTodayDay() {

  const day = new Date().getDay();

  return day === 0 ? 7 : day;

}


function youtubeEmbed(url) {

  if (!url) {
    return "";
  }

  try {

    const parsed =
      new URL(url);

    let videoId = "";

    if (
      parsed.hostname.includes("youtube.com")
    ) {

      videoId =
        parsed.searchParams.get("v") || "";

    }

    if (
      parsed.hostname === "youtu.be"
    ) {

      videoId =
        parsed.pathname.replace("/", "");

    }

    if (!videoId) {
      return "";
    }

    return `
      <div class="article-video">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}"
          title="Video de Gamarra TV"
          loading="lazy"
          allowfullscreen>
        </iframe>
      </div>
    `;

  } catch {

    return "";

  }

}


/* =========================================================
   SUPABASE DISPONIBILIDAD
========================================================= */

function databaseReady() {

  if (!supabase) {

    showAppError(
      "Configuración pendiente",
      "Debes colocar la URL de tu proyecto Supabase en app.js."
    );

    return false;

  }

  return true;

}


/* =========================================================
   SESIÓN
========================================================= */

async function checkSession() {

  if (!supabase) {
    return;
  }

  const {
    data
  } =
    await supabase.auth.getSession();

  currentUser =
    data?.session?.user || null;

  updatePanelButton();

  supabase.auth.onAuthStateChange(
    (_event, session) => {

      currentUser =
        session?.user || null;

      updatePanelButton();

    }
  );

}


function updatePanelButton() {

  const button =
    document.getElementById("panelButton");

  if (!button) {
    return;
  }

  if (currentUser) {

    button.textContent =
      "⚙️ Panel";

  } else {

    button.textContent =
      "🔐 Panel";

  }

}


/* =========================================================
   LOGIN
========================================================= */

function openPanel() {

  if (currentUser) {

    document
      .getElementById("panelModal")
      .classList.remove("hidden");

    document
      .getElementById("sessionUser")
      .textContent =
      currentUser.email || "";

    loadAdminData();

    return;

  }

  document
    .getElementById("loginModal")
    .classList.remove("hidden");

}


function closeLogin() {

  document
    .getElementById("loginModal")
    .classList.add("hidden");

}


async function login(event) {

  event.preventDefault();

  if (!databaseReady()) {
    return;
  }

  const email =
    document
      .getElementById("loginEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("loginPassword")
      .value;

  const message =
    document.getElementById(
      "loginMessage"
    );

  message.innerHTML =
    `<div class="message">Iniciando sesión...</div>`;

  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    message.innerHTML =
      `<div class="message error">
        ${escapeHTML(error.message)}
      </div>`;

    return;

  }

  currentUser =
    data.user;

  closeLogin();

  openPanel();

}


async function logout() {

  if (supabase) {
    await supabase.auth.signOut();
  }

  currentUser = null;

  document
    .getElementById("panelModal")
    .classList.add("hidden");

  updatePanelButton();

}


/* =========================================================
   FORMULARIOS
========================================================= */

function setupForms() {

  document
    .getElementById("loginForm")
    ?.addEventListener(
      "submit",
      login
    );

  document
    .getElementById("newsForm")
    ?.addEventListener(
      "submit",
      saveNews
    );

  document
    .getElementById("programForm")
    ?.addEventListener(
      "submit",
      saveProgram
    );

  document
    .getElementById("adForm")
    ?.addEventListener(
      "submit",
      saveAd
    );

  document
    .getElementById("clientForm")
    ?.addEventListener(
      "submit",
      saveClient
    );

}


function setupImagePreviews() {

  document
    .getElementById("newsImage")
    ?.addEventListener(
      "input",
      () => {

        const url =
          document.getElementById(
            "newsImage"
          ).value;

        const preview =
          document.getElementById(
            "imagePreview"
          );

        if (!url) {

          preview.innerHTML = "";

          return;

        }

        preview.innerHTML =
          `<img src="${escapeHTML(url)}"
                alt="Vista previa"
                onerror="this.style.display='none'">`;

      }
    );


  document
    .getElementById("programLogo")
    ?.addEventListener(
      "input",
      () => {

        const url =
          document.getElementById(
            "programLogo"
          ).value;

        const preview =
          document.getElementById(
            "programLogoPreview"
          );

        if (!url) {

          preview.innerHTML = "";

          return;

        }

        preview.innerHTML =
          `<img src="${escapeHTML(url)}"
                alt="Logo"
                onerror="this.style.display='none'">`;

      }
    );

}


/* =========================================================
   ROUTER
========================================================= */

async function route() {

  const path =
    window.location.pathname;

  if (
    path === "/" ||
    path === ""
  ) {

    await renderHome();

    return;

  }


  if (
    path === "/noticias" ||
    path === "/noticias/"
  ) {

    await renderNewsPage();

    return;

  }


  if (
    path.startsWith("/noticia/")
  ) {

    const slug =
      decodeURIComponent(
        path.replace(
          "/noticia/",
          ""
        )
      );

    await renderArticle(slug);

    return;

  }


  if (
    path === "/en-vivo" ||
    path === "/en-vivo/"
  ) {

    await renderLivePage();

    return;

  }


  if (
    path === "/clima" ||
    path === "/clima/"
  ) {

    renderWeatherPage();

    return;

  }


  if (
    path === "/contacto" ||
    path === "/contacto/"
  ) {

    await renderContactPage();

    return;

  }


  if (
    path === "/programacion" ||
    path === "/programacion/"
  ) {

    await renderLivePage();

    return;

  }


  await renderHome();

}


function navigate(url) {

  window.history.pushState(
    {},
    "",
    url
  );

  route();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


window.addEventListener(
  "popstate",
  route
);


function navigateHome(event) {

  event.preventDefault();

  navigate("/");

}


function navigateNews(event) {

  event.preventDefault();

  navigate("/noticias");

}


function navigateLive(event) {

  event.preventDefault();

  navigate("/en-vivo");

}


function navigateWeather(event) {

  event.preventDefault();

  navigate("/clima");

}


function navigateContact(event) {

  event.preventDefault();

  navigate("/contacto");

}


/* =========================================================
   INICIO
========================================================= */

async function renderHome() {

  const app =
    document.getElementById("app");

  app.innerHTML =
    `
    <section class="section">

      <div class="container">

        <div id="homeContent">

          <div class="message">
            Cargando Gamarra TV...
          </div>

        </div>

      </div>

    </section>
    `;


  const [
    news,
    programs,
    clients,
    ads
  ] =
    await Promise.all([
      getNews(),
      getPrograms(),
      getClients(),
      getAds()
    ]);


  const latest =
    news.slice(0, 6);

  const featured =
    latest[0];


  let html = "";


  /* HERO */

  if (featured) {

    html += `
      <section class="hero">

        <div class="container hero-grid">

          <article
            class="hero-main"
            onclick="openArticle('${escapeHTML(featured.slug)}')"
            style="cursor:pointer"
          >

            <img
              src="${escapeHTML(
                featured.imagen_url || LOGO_URL
              )}"
              alt="${escapeHTML(featured.titulo)}"
              loading="eager"
            >

            <div class="hero-overlay"></div>

            <div class="hero-content">

              <span class="category-badge">
                ${escapeHTML(featured.categoria)}
              </span>

              <h1>
                ${escapeHTML(featured.titulo)}
              </h1>

              <p>
                ${escapeHTML(featured.resumen || "")}
              </p>

            </div>

          </article>

          <div class="side-news">

            ${latest
              .slice(1, 4)
              .map(renderSideNews)
              .join("")}

          </div>

        </div>

      </section>
    `;

  }


  /* TODAS LAS CATEGORÍAS */

  html += `
    <section class="section">

      <div class="container">

        <h2 class="section-title">
          Noticias
        </h2>

        <p class="section-subtitle">
          Toda la actualidad de Gamarra, el Cesar,
          Colombia y el mundo.
        </p>

        <div class="category-scroller">

          <button
            class="category-pill active"
            onclick="filterHomeCategory('Todas')"
          >
            Todas
          </button>

          ${CATEGORIES.map(
            category =>
              `
              <button
                class="category-pill"
                onclick="filterHomeCategory('${escapeHTML(category)}')"
              >
                ${escapeHTML(category)}
              </button>
              `
          ).join("")}

        </div>

        <div
          id="homeNewsGrid"
          class="news-grid"
        >
          ${latest.map(renderNewsCard).join("")}
        </div>

      </div>

    </section>
  `;


  /* CARRUSEL */

  html += `
    <section class="section">

      <div class="container">

        <h2 class="section-title">
          Últimas noticias
        </h2>

        <p class="section-subtitle">
          Las noticias más recientes publicadas por Gamarra TV.
        </p>

        <div class="carousel-buttons">

          <button onclick="moveCarousel(-1)">
            ←
          </button>

          <button onclick="moveCarousel(1)">
            →
          </button>

        </div>

        <div
          id="newsCarousel"
          class="carousel"
        >
          ${news.map(renderNewsCard).join("")}
        </div>

      </div>

    </section>
  `;


  /* SEÑAL */

  html += `
    <section class="section live-section">

      <div class="container">

        <h2 class="section-title" style="color:white">
          🔴 Señal en vivo
        </h2>

        <p class="section-subtitle" style="color:#b8c7d6">
          Gamarra TV en vivo las 24 horas.
        </p>

        <div class="live-layout">

          <div class="live-player">

            <iframe
              src="${OPENCASTER_URL}"
              title="Gamarra TV en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen
            ></iframe>

          </div>

          <div class="schedule-box">

            <h3>
              PROGRAMACIÓN
            </h3>

            <div class="schedule-days">

              ${Object.entries(DAY_NAMES)
                .map(
                  ([number, name]) =>
                    `
                    <button
                      class="schedule-day ${
                        Number(number) === selectedScheduleDay
                          ? "active"
                          : ""
                      }"
                      onclick="selectScheduleDay(${number})"
                    >
                      ${name}
                    </button>
                    `
                )
                .join("")}

            </div>

            <div id="homeSchedule">
              ${renderScheduleItems(
                programs,
                selectedScheduleDay
              )}
            </div>

          </div>

        </div>

      </div>

    </section>
  `;


  /* PUBLICIDAD */

  if (ads.length) {

    html += `
      <section class="section">

        <div class="container">

          <h2 class="section-title">
            Publicidad
          </h2>

          <div class="clients-grid">

            ${ads
              .filter(ad => ad.activo !== false)
              .map(renderAd)
              .join("")}

          </div>

        </div>

      </section>
    `;

  }


  /* PRODUCTOS Y SERVICIOS */

  html += `
    <section class="section">

      <div class="container">

        <h2 class="section-title">
          Productos y Servicios
        </h2>

        <p class="section-subtitle">
          Soluciones de comunicación y tecnología.
        </p>

        <div class="products-grid">

          <article class="product-card">

            <div class="product-icon">
              🧠
            </div>

            <h3>
              Servicios Profesionales
            </h3>

            <p>
              Consultoría experta en medios de comunicación,
              telecomunicaciones y emprendimientos digitales.
            </p>

            <a
              class="contract-button"
              target="_blank"
              href="https://wa.me/${WHATSAPP}?text=Hola,%20quiero%20más%20información%20sobre%20Servicios%20Profesionales"
            >
              💬 Contratar
            </a>

          </article>


          <article class="product-card">

            <div class="product-icon">
              💻
            </div>

            <h3>
              Diseño Web y Apps
            </h3>

            <p>
              Desarrollamos sitios web, apps móviles y plataformas
              adaptadas a tus necesidades.
            </p>

            <a
              class="contract-button"
              target="_blank"
              href="https://wa.me/${WHATSAPP}?text=Hola,%20quiero%20cotizar%20Diseño%20Web%20y%20Apps"
            >
              💬 Contratar
            </a>

          </article>


          <article class="product-card">

            <div class="product-icon">
              📡
            </div>

            <h3>
              Streaming
            </h3>

            <p>
              Soluciones para transmisiones en vivo,
              radio online y canales digitales.
            </p>

            <a
              class="contract-button"
              target="_blank"
              href="https://wa.me/${WHATSAPP}?text=Hola,%20me%20interesa%20el%20servicio%20de%20Streaming"
            >
              💬 Contratar
            </a>

          </article>

        </div>

      </div>

    </section>
  `;


  /* CLIENTES */

  html += `
    <section class="section">

      <div class="container">

        <h2 class="section-title">
          Nuestros clientes
        </h2>

        <p class="section-subtitle">
          Empresas y proyectos que hacen parte de nuestra comunidad.
        </p>

        <div class="clients-grid">

          ${clients
            .map(renderClient)
            .join("")}

        </div>

      </div>

    </section>
  `;


  document
    .getElementById("homeContent")
    .innerHTML =
    html;

}


function renderSideNews(news) {

  return `
    <article
      class="side-news-card"
      onclick="openArticle('${escapeHTML(news.slug)}')"
      style="cursor:pointer"
    >

      <img
        src="${escapeHTML(
          news.imagen_url || LOGO_URL
        )}"
        alt="${escapeHTML(news.titulo)}"
        loading="lazy"
      >

      <div>

        <span class="category-badge">
          ${escapeHTML(news.categoria)}
        </span>

        <h3>
          ${escapeHTML(news.titulo)}
        </h3>

      </div>

    </article>
  `;

}


function renderNewsCard(news) {

  return `
    <article class="news-card">

      <div
        class="news-card-image"
        onclick="openArticle('${escapeHTML(news.slug)}')"
        style="cursor:pointer"
      >

        <img
          src="${escapeHTML(
            news.imagen_url || LOGO_URL
          )}"
          alt="${escapeHTML(news.titulo)}"
          loading="lazy"
        >

      </div>

      <div class="news-card-body">

        <span class="category-badge">
          ${escapeHTML(news.categoria)}
        </span>

        <h3>
          ${escapeHTML(news.titulo)}
        </h3>

        <p>
          ${escapeHTML(
            truncate(news.resumen || "", 140)
          )}
        </p>

        <div class="news-meta">

          <span>
            📅 ${formatDate(news.created_at)}
          </span>

          <span>
            GTV
          </span>

        </div>

        <a
          class="read-more"
          href="/noticia/${encodeURIComponent(news.slug)}"
          onclick="event.preventDefault(); openArticle('${escapeHTML(news.slug)}')"
        >
          Leer noticia →
        </a>

      </div>

    </article>
  `;

}


function truncate(text, length) {

  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length) + "...";

}


/* =========================================================
   NOTICIAS
========================================================= */

async function getNews() {

  if (!supabase) {
    return [];
  }

  const {
    data,
    error
  } =
    await supabase
      .from("noticias")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(
      "Error cargando noticias:",
      error
    );

    return [];

  }

  currentNews =
    data || [];

  return currentNews;

}


async function renderNewsPage() {

  const news =
    await getNews();

  const app =
    document.getElementById("app");

  const params =
    new URLSearchParams(
      window.location.search
    );

  const category =
    params.get("categoria") ||
    "Todas";

  selectedNewsCategory =
    category;

  app.innerHTML = `

    <section class="section">

      <div class="container">

        <h1 class="section-title">
          Últimas noticias
        </h1>

        <p class="section-subtitle">
          Noticias, televisión y actualidad de Gamarra TV.
        </p>


        <div class="category-scroller">

          <button
            class="category-pill ${
              category === "Todas"
                ? "active"
                : ""
            }"
            onclick="filterNewsPage('Todas')"
          >
            Todas
          </button>

          ${CATEGORIES.map(
            item =>
              `
              <button
                class="category-pill ${
                  category === item
                    ? "active"
                    : ""
                }"
                onclick="filterNewsPage('${escapeHTML(item)}')"
              >
                ${escapeHTML(item)}
              </button>
              `
          ).join("")}

        </div>


        <div
          id="allNewsGrid"
          class="news-grid"
        >
          ${renderFilteredNews(
            news,
            category
          )}
        </div>

      </div>

    </section>

  `;

}


function renderFilteredNews(
  news,
  category
) {

  let filtered =
    news;

  if (
    category &&
    category !== "Todas"
  ) {

    filtered =
      news.filter(
        item =>
          item.categoria === category
      );

  }

  if (!filtered.length) {

    return `
      <div class="message">
        No hay noticias publicadas en esta categoría.
      </div>
    `;

  }

  return filtered
    .map(renderNewsCard)
    .join("");

}


function filterNewsPage(category) {

  const url =
    category === "Todas"
      ? "/noticias"
      : `/noticias?categoria=${encodeURIComponent(category)}`;

  window.history.pushState(
    {},
    "",
    url
  );

  renderNewsPage();

}


function filterHomeCategory(category) {

  const grid =
    document.getElementById(
      "homeNewsGrid"
    );

  if (!grid) {
    return;
  }

  let list =
    currentNews;

  if (
    category &&
    category !== "Todas"
  ) {

    list =
      currentNews.filter(
        item =>
          item.categoria === category
      );

  }

  grid.innerHTML =
    list
      .slice(0, 9)
      .map(renderNewsCard)
      .join("");

}


/* =========================================================
   ARTÍCULO INDIVIDUAL
========================================================= */

async function openArticle(slug) {

  const url =
    `/noticia/${encodeURIComponent(slug)}`;

  window.history.pushState(
    {},
    "",
    url
  );

  await renderArticle(slug);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


async function renderArticle(slug) {

  if (!supabase) {

    showAppError(
      "Configuración pendiente",
      "Debes conectar Supabase."
    );

    return;

  }

  const {
    data,
    error
  } =
    await supabase
      .from("noticias")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

  const app =
    document.getElementById("app");


  if (
    error ||
    !data
  ) {

    app.innerHTML = `
      <section class="section">

        <div class="container">

          <div class="message error">
            La noticia no existe o fue eliminada.
          </div>

          <a
            href="/noticias"
            onclick="navigateNews(event)"
          >
            ← Volver a noticias
          </a>

        </div>

      </section>
    `;

    return;

  }


  const canonical =
    `${SITE_URL}/noticia/${encodeURIComponent(data.slug)}`;


  /* =====================================================
     SEO / OPEN GRAPH
  ====================================================== */

  updateMeta(
    "og:title",
    data.titulo
  );

  updateMeta(
    "og:description",
    data.resumen || ""
  );

  updateMeta(
    "og:image",
    data.imagen_url || LOGO_URL
  );

  updateMeta(
    "og:url",
    canonical
  );

  updateMeta(
    "og:type",
    "article"
  );

  updateMeta(
    "twitter:title",
    data.titulo
  );

  updateMeta(
    "twitter:description",
    data.resumen || ""
  );

  updateMeta(
    "twitter:image",
    data.imagen_url || LOGO_URL
  );

  document.title =
    `${data.titulo} | Gamarra TV`;


  app.innerHTML = `

    <article class="article-page">

      <div class="article-container">

        <div class="article-category">
          ${escapeHTML(data.categoria)}
        </div>

        <h1 class="article-title">
          ${escapeHTML(data.titulo)}
        </h1>

        <p class="article-summary">
          ${escapeHTML(data.resumen || "")}
        </p>

        <div class="news-meta">
          <span>
            📅 ${formatDate(data.created_at)}
          </span>

          <span>
            Gamarra TV
          </span>
        </div>


        <img
          class="article-image"
          src="${escapeHTML(
            data.imagen_url || LOGO_URL
          )}"
          alt="${escapeHTML(data.titulo)}"
        >


        <div class="share-buttons">

          <a
            target="_blank"
            href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}"
          >
            Facebook
          </a>

          <a
            target="_blank"
            href="https://api.whatsapp.com/send?text=${encodeURIComponent(
              data.titulo + " " + canonical
            )}"
          >
            WhatsApp
          </a>

          <button
            onclick="copyArticleLink('${escapeHTML(canonical)}')"
          >
            Copiar enlace
          </button>

        </div>


        <div class="article-content">
          ${escapeHTML(
            data.contenido || ""
          )}
        </div>


        ${youtubeEmbed(
          data.video_url
        )}


        <div style="margin-top:40px">

          <a
            href="/noticias"
            onclick="navigateNews(event)"
            class="read-more"
          >
            ← Volver a noticias
          </a>

        </div>

      </div>

    </article>

  `;

}


function updateMeta(
  property,
  content
) {

  let meta =
    document.querySelector(
      `meta[property="${property}"]`
    );

  if (!meta) {

    meta =
      document.createElement("meta");

    meta.setAttribute(
      "property",
      property
    );

    document.head.appendChild(
      meta
    );

  }

  meta.setAttribute(
    "content",
    content
  );

}


async function copyArticleLink(url) {

  try {

    await navigator.clipboard.writeText(url);

    alert(
      "Enlace copiado correctamente."
    );

  } catch {

    alert(url);

  }

}


/* =========================================================
   PROGRAMACIÓN
========================================================= */

async function getPrograms() {

  if (!supabase) {
    return [];
  }

  const {
    data,
    error
  } =
    await supabase
      .from("programacion")
      .select("*")
      .order("dia_semana", {
        ascending: true
      })
      .order("hora_inicio", {
        ascending: true
      });

  if (error) {

    console.error(
      "Error cargando programación:",
      error
    );

    return [];

  }

  currentPrograms =
    data || [];

  return currentPrograms;

}


function renderScheduleItems(
  programs,
  day
) {

  const filtered =
    programs
      .filter(
        program =>
          Number(
            program.dia_semana
          ) === Number(day)
      )
      .sort(
        (a, b) =>
          String(a.hora_inicio)
            .localeCompare(
              String(b.hora_inicio)
            )
      );


  if (!filtered.length) {

    return `
      <div class="message">
        No hay programación registrada para este día.
      </div>
    `;

  }


  return filtered
    .map(
      program =>
        `
        <div class="program-item">

          <div class="program-time">
            ${formatTime(
              program.hora_inicio
            )}
          </div>

          <div>

            <div class="program-name">
              ${escapeHTML(
                program.programa
              )}
            </div>

            ${
              program.descripcion
                ? `
                  <small>
                    ${escapeHTML(
                      program.descripcion
                    )}
                  </small>
                `
                : ""
            }

          </div>

          ${
            program.logo_url
              ? `
                <img
                  class="program-logo"
                  src="${escapeHTML(
                    program.logo_url
                  )}"
                  alt="${escapeHTML(
                    program.programa
                  )}"
                >
              `
              : `
                <div class="program-logo">
                  GTV
                </div>
              `
          }

          <div class="program-end">
            ${
              program.hora_fin
                ? `Hasta ${formatTime(
                    program.hora_fin
                  )}`
                : ""
            }
          </div>

        </div>
        `
    )
    .join("");

}


function selectScheduleDay(day) {

  selectedScheduleDay =
    Number(day);

  const container =
    document.getElementById(
      "homeSchedule"
    );

  if (container) {

    container.innerHTML =
      renderScheduleItems(
        currentPrograms,
        selectedScheduleDay
      );

  }

  document
    .querySelectorAll(
      ".schedule-day"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.textContent.trim() ===
          DAY_NAMES[
            selectedScheduleDay
          ]
      );

    });

}


async function renderLivePage() {

  const programs =
    await getPrograms();

  const app =
    document.getElementById("app");

  app.innerHTML = `

    <section class="section live-section">

      <div class="container">

        <h1
          class="section-title"
          style="color:white"
        >
          🔴 Gamarra TV en vivo
        </h1>

        <p
          class="section-subtitle"
          style="color:#b8c7d6"
        >
          Señal en vivo 24/7.
        </p>

        <div class="live-layout">

          <div class="live-player">

            <iframe
              src="${OPENCASTER_URL}"
              title="Gamarra TV en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen
            ></iframe>

          </div>

          <div class="schedule-box">

            <h2>
              PROGRAMACIÓN
            </h2>

            <div class="schedule-days">

              ${Object.entries(DAY_NAMES)
                .map(
                  ([number, name]) =>
                    `
                    <button
                      class="schedule-day ${
                        Number(number) ===
                        selectedScheduleDay
                          ? "active"
                          : ""
                      }"
                      onclick="selectScheduleDay(${number})"
                    >
                      ${name}
                    </button>
                    `
                )
                .join("")}

            </div>

            <div id="liveSchedule">

              ${renderScheduleItems(
                programs,
                selectedScheduleDay
              )}

            </div>

          </div>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   PANEL PROGRAMACIÓN
========================================================= */

async function saveProgram(event) {

  event.preventDefault();

  if (!currentUser) {

    alert(
      "Debes iniciar sesión."
    );

    return;

  }

  if (!databaseReady()) {
    return;
  }


  const id =
    document.getElementById(
      "programId"
    ).value;


  const payload = {

    dia_semana:
      Number(
        document.getElementById(
          "programDay"
        ).value
      ),

    hora_inicio:
      document.getElementById(
        "programStart"
      ).value,

    hora_fin:
      document.getElementById(
        "programEnd"
      ).value,

    programa:
      document.getElementById(
        "programName"
      ).value
      .trim(),

    logo_url:
      document.getElementById(
        "programLogo"
      ).value
      .trim(),

    descripcion:
      document.getElementById(
        "programDescription"
      ).value
      .trim()

  };


  let result;


  if (id) {

    result =
      await supabase
        .from("programacion")
        .update(payload)
        .eq("id", id);

  } else {

    result =
      await supabase
        .from("programacion")
        .insert(payload);

  }


  if (result.error) {

    showAdminError(
      result.error.message
    );

    return;

  }


  showAdminSuccess(
    "Programa guardado correctamente."
  );

  clearProgramForm();

  await loadAdminPrograms();

}


function editProgram(program) {

  document.getElementById(
    "programId"
  ).value =
    program.id || "";

  document.getElementById(
    "programDay"
  ).value =
    program.dia_semana || 1;

  document.getElementById(
    "programStart"
  ).value =
    program.hora_inicio || "";

  document.getElementById(
    "programEnd"
  ).value =
    program.hora_fin || "";

  document.getElementById(
    "programName"
  ).value =
    program.programa || "";

  document.getElementById(
    "programLogo"
  ).value =
    program.logo_url || "";

  document.getElementById(
    "programDescription"
  ).value =
    program.descripcion || "";

  showAdminTab(
    "programacion"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


async function deleteProgram(id) {

  if (
    !confirm(
      "¿Seguro que deseas eliminar este programa?"
    )
  ) {
    return;
  }

  const {
    error
  } =
    await supabase
      .from("programacion")
      .delete()
      .eq("id", id);

  if (error) {

    showAdminError(
      error.message
    );

    return;

  }

  showAdminSuccess(
    "Programa eliminado correctamente."
  );

  await loadAdminPrograms();

}


function clearProgramForm() {

  document
    .getElementById(
      "programForm"
    )
    .reset();

  document.getElementById(
    "programId"
  ).value = "";

  document.getElementById(
    "programLogoPreview"
  ).innerHTML = "";

}


async function loadAdminPrograms() {

  const container =
    document.getElementById(
      "adminProgramList"
    );

  if (!container) {
    return;
  }

  const programs =
    await getPrograms();

  if (!programs.length) {

    container.innerHTML =
      `<div class="message">
        No hay programas registrados.
      </div>`;

    return;

  }

  container.innerHTML =
    programs
      .map(
        program =>
          `
          <div class="admin-item">

            <div class="admin-item-top">

              ${
                program.logo_url
                  ? `
                    <img
                      class="admin-item-image"
                      src="${escapeHTML(
                        program.logo_url
                      )}"
                      alt=""
                    >
                  `
                  : ""
              }

              <div style="flex:1">

                <strong>
                  ${escapeHTML(
                    program.programa
                  )}
                </strong>

                <div>
                  ${
                    DAY_NAMES[
                      Number(
                        program.dia_semana
                      )
                    ] || ""
                  }
                  ·
                  ${formatTime(
                    program.hora_inicio
                  )}
                  -
                  ${formatTime(
                    program.hora_fin
                  )}
                </div>

              </div>

            </div>

            <div class="admin-actions">

              <button
                class="edit-btn"
                onclick='editProgram(${JSON.stringify(program).replaceAll("'", "&#039;")})'
              >
                Editar
              </button>

              <button
                class="delete-btn"
                onclick="deleteProgram('${program.id}')"
              >
                Eliminar
              </button>

            </div>

          </div>
          `
      )
      .join("");

}


/* =========================================================
   PANEL NOTICIAS
========================================================= */

async function saveNews(event) {

  event.preventDefault();

  if (!currentUser) {

    alert(
      "Debes iniciar sesión."
    );

    return;

  }

  if (!databaseReady()) {
    return;
  }


  const id =
    document.getElementById(
      "newsId"
    ).value;


  const title =
    document.getElementById(
      "newsTitle"
    ).value
    .trim();


  /*
    ESTA ES LA CORRECCIÓN DEL ERROR
    "slug = null"

    El slug se genera siempre
    antes de guardar.
  */

  let slug =
    slugify(title);


  if (!slug) {

    showAdminError(
      "No se pudo generar el enlace de la noticia. Revisa el título."
    );

    return;

  }


  /*
    Si ya existe otra noticia
    con el mismo slug, añadimos
    una parte única.
  */

  if (!id) {

    slug +=
      "-" +
      Date.now()
        .toString()
        .slice(-6);

  }


  const payload = {

    titulo:
      title,

    slug:
      slug,

    categoria:
      document.getElementById(
        "newsCategory"
      ).value,

    resumen:
      document.getElementById(
        "newsSummary"
      ).value
      .trim(),

    contenido:
      document.getElementById(
        "newsContent"
      ).value
      .trim(),

    imagen_url:
      document.getElementById(
        "newsImage"
      ).value
      .trim(),

    video_url:
      document.getElementById(
        "newsVideo"
      ).value
      .trim()

  };


  let result;


  if (id) {

    /*
      Al editar conservamos
      el slug existente si no
      se desea cambiar la URL.
    */

    const existing =
      currentNews.find(
        item =>
          String(item.id) ===
          String(id)
      );

    if (
      existing &&
      existing.slug
    ) {

      payload.slug =
        existing.slug;

    }


    result =
      await supabase
        .from("noticias")
        .update(payload)
        .eq("id", id);

  } else {

    result =
      await supabase
        .from("noticias")
        .insert(payload);

  }


  if (result.error) {

    console.error(
      result.error
    );

    showAdminError(
      result.error.message
    );

    return;

  }


  showAdminSuccess(
    id
      ? "Noticia actualizada correctamente."
      : "Noticia publicada correctamente."
  );


  clearNewsForm();

  await loadAdminNews();

}


function editNews(news) {

  document.getElementById(
    "newsId"
  ).value =
    news.id || "";

  document.getElementById(
    "newsTitle"
  ).value =
    news.titulo || "";

  document.getElementById(
    "newsCategory"
  ).value =
    news.categoria || "Gamarra";

  document.getElementById(
    "newsSummary"
  ).value =
    news.resumen || "";

  document.getElementById(
    "newsContent"
  ).value =
    news.contenido || "";

  document.getElementById(
    "newsImage"
  ).value =
    news.imagen_url || "";

  document.getElementById(
    "newsVideo"
  ).value =
    news.video_url || "";

  if (news.imagen_url) {

    document.getElementById(
      "imagePreview"
    ).innerHTML =
      `<img src="${escapeHTML(
        news.imagen_url
      )}" alt="">`;

  }

  showAdminTab(
    "noticias"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


async function deleteNews(id) {

  if (
    !confirm(
      "¿Seguro que deseas eliminar esta noticia?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("noticias")
      .delete()
      .eq("id", id);


  if (error) {

    showAdminError(
      error.message
    );

    return;

  }


  showAdminSuccess(
    "Noticia eliminada correctamente."
  );

  await loadAdminNews();

}


function clearNewsForm() {

  document
    .getElementById(
      "newsForm"
    )
    .reset();

  document.getElementById(
    "newsId"
  ).value = "";

  document.getElementById(
    "imagePreview"
  ).innerHTML = "";

}


async function loadAdminNews() {

  const container =
    document.getElementById(
      "adminNewsList"
    );

  if (!container) {
    return;
  }

  const news =
    await getNews();


  if (!news.length) {

    container.innerHTML =
      `<div class="message">
        No hay noticias publicadas.
      </div>`;

    return;

  }


  container.innerHTML =
    news
      .map(
        newsItem =>
          `
          <div class="admin-item">

            <div class="admin-item-top">

              ${
                newsItem.imagen_url
                  ? `
                    <img
                      class="admin-item-image"
                      src="${escapeHTML(
                        newsItem.imagen_url
                      )}"
                      alt=""
                    >
                  `
                  : ""
              }

              <div style="flex:1">

                <strong>
                  ${escapeHTML(
                    newsItem.titulo
                  )}
                </strong>

                <div>
                  ${escapeHTML(
                    newsItem.categoria
                  )}
                </div>

                <small>
                  /noticia/${escapeHTML(
                    newsItem.slug
                  )}
                </small>

              </div>

            </div>


            <div class="admin-actions">

              <button
                class="edit-btn"
                onclick='editNews(${JSON.stringify(newsItem).replaceAll("'", "&#039;")})'
              >
                Editar
              </button>

              <button
                class="delete-btn"
                onclick="deleteNews('${newsItem.id}')"
              >
                Eliminar
              </button>

            </div>

          </div>
          `
      )
      .join("");

}


/* =========================================================
   PUBLICIDAD
========================================================= */

async function getAds() {

  if (!supabase) {
    return [];
  }

  const {
    data,
    error
  } =
    await supabase
      .from("publicidad")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.warn(
      "Tabla publicidad no disponible:",
      error.message
    );

    return [];

  }

  currentAds =
    data || [];

  return currentAds;

}


function renderAd(ad) {

  return `
    <a
      class="client-card"
      href="${escapeHTML(
        ad.enlace || "#"
      )}"
      target="_blank"
    >

      <img
        src="${escapeHTML(
          ad.imagen_url
        )}"
        alt="${escapeHTML(
          ad.titulo
        )}"
      >

      <h3>
        ${escapeHTML(ad.titulo)}
      </h3>

    </a>
  `;

}


async function saveAd(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      "adId"
    ).value;


  const payload = {

    titulo:
      document.getElementById(
        "adTitle"
      ).value
      .trim(),

    imagen_url:
      document.getElementById(
        "adImage"
      ).value
      .trim(),

    enlace:
      document.getElementById(
        "adLink"
      ).value
      .trim(),

    activo:
      document.getElementById(
        "adActive"
      ).value === "true"

  };


  let result;


  if (id) {

    result =
      await supabase
        .from("publicidad")
        .update(payload)
        .eq("id", id);

  } else {

    result =
      await supabase
        .from("publicidad")
        .insert(payload);

  }


  if (result.error) {

    showAdminError(
      result.error.message
    );

    return;

  }


  showAdminSuccess(
    "Publicidad guardada correctamente."
  );

  document
    .getElementById(
      "adForm"
    )
    .reset();

  await loadAdminAds();

}


async function deleteAd(id) {

  if (
    !confirm(
      "¿Eliminar publicidad?"
    )
  ) {
    return;
  }

  const {
    error
  } =
    await supabase
      .from("publicidad")
      .delete()
      .eq("id", id);

  if (error) {

    showAdminError(
      error.message
    );

    return;

  }

  await loadAdminAds();

}


async function loadAdminAds() {

  const container =
    document.getElementById(
      "adminAdsList"
    );

  if (!container) {
    return;
  }

  const ads =
    await getAds();


  container.innerHTML =
    ads
      .map(
        ad =>
          `
          <div class="admin-item">

            <strong>
              ${escapeHTML(
                ad.titulo
              )}
            </strong>

            <div class="admin-actions">

              <button
                class="delete-btn"
                onclick="deleteAd('${ad.id}')"
              >
                Eliminar
              </button>

            </div>

          </div>
          `
      )
      .join("");

}


/* =========================================================
   CLIENTES
========================================================= */

async function getClients() {

  if (!supabase) {
    return [];
  }

  const {
    data,
    error
  } =
    await supabase
      .from("clientes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.warn(
      "Tabla clientes:",
      error.message
    );

    return [];

  }

  currentClients =
    data || [];

  return currentClients;

}


function renderClient(client) {

  return `
    <a
      class="client-card"
      href="${escapeHTML(
        client.url
      )}"
      target="_blank"
      rel="noopener"
    >

      <img
        src="${escapeHTML(
          client.logo_url
        )}"
        alt="${escapeHTML(
          client.nombre
        )}"
        loading="lazy"
      >

      <h3>
        ${escapeHTML(
          client.nombre
        )}
      </h3>

    </a>
  `;

}


async function saveClient(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "clientId"
    ).value;


  const payload = {

    nombre:
      document.getElementById(
        "clientName"
      ).value
      .trim(),

    logo_url:
      document.getElementById(
        "clientLogo"
      ).value
      .trim(),

    url:
      document.getElementById(
        "clientUrl"
      ).value
      .trim()

  };


  let result;


  if (id) {

    result =
      await supabase
        .from("clientes")
        .update(payload)
        .eq("id", id);

  } else {

    result =
      await supabase
        .from("clientes")
        .insert(payload);

  }


  if (result.error) {

    showAdminError(
      result.error.message
    );

    return;

  }


  showAdminSuccess(
    "Cliente guardado correctamente."
  );


  document
    .getElementById(
      "clientForm"
    )
    .reset();

  await loadAdminClients();

}


async function deleteClient(id) {

  if (
    !confirm(
      "¿Eliminar este cliente?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await supabase
      .from("clientes")
      .delete()
      .eq("id", id);


  if (error) {

    showAdminError(
      error.message
    );

    return;

  }


  await loadAdminClients();

}


async function loadAdminClients() {

  const container =
    document.getElementById(
      "adminClientsList"
    );

  if (!container) {
    return;
  }

  const clients =
    await getClients();


  container.innerHTML =
    clients
      .map(
        client =>
          `
          <div class="admin-item">

            <div class="admin-item-top">

              <img
                class="admin-item-image"
                src="${escapeHTML(
                  client.logo_url
                )}"
                alt=""
              >

              <div>

                <strong>
                  ${escapeHTML(
                    client.nombre
                  )}
                </strong>

              </div>

            </div>

            <div class="admin-actions">

              <button
                class="delete-btn"
                onclick="deleteClient('${client.id}')"
              >
                Eliminar
              </button>

            </div>

          </div>
          `
      )
      .join("");

}


/* =========================================================
   PANEL
========================================================= */

async function loadAdminData() {

  await Promise.all([
    loadAdminNews(),
    loadAdminPrograms(),
    loadAdminAds(),
    loadAdminClients()
  ]);

}


function showAdminTab(tab) {

  document
    .querySelectorAll(
      ".admin-section"
    )
    .forEach(section => {

      section.classList.add(
        "hidden"
      );

    });


  document
    .querySelectorAll(
      ".admin-tab"
    )
    .forEach(button => {

      button.classList.remove(
        "active"
      );

    });


  const sectionMap = {

    noticias:
      "adminNoticias",

    programacion:
      "adminProgramacion",

    publicidad:
      "adminPublicidad",

    clientes:
      "adminClientes"

  };


  const section =
    document.getElementById(
      sectionMap[tab]
    );

  if (section) {

    section.classList.remove(
      "hidden"
    );

  }


  const index = [
    "noticias",
    "programacion",
    "publicidad",
    "clientes"
  ].indexOf(tab);


  const tabs =
    document.querySelectorAll(
      ".admin-tab"
    );

  if (tabs[index]) {

    tabs[index].classList.add(
      "active"
    );

  }

}


function showAdminSuccess(message) {

  const element =
    document.getElementById(
      "adminMessage"
    );

  if (!element) {
    return;
  }

  element.innerHTML =
    `
      <div class="message success">
        ${escapeHTML(message)}
      </div>
    `;

}


function showAdminError(message) {

  const element =
    document.getElementById(
      "adminMessage"
    );

  if (!element) {
    return;
  }

  element.innerHTML =
    `
      <div class="message error">
        ${escapeHTML(message)}
      </div>
    `;

}


function showAppError(
  title,
  message
) {

  document.getElementById(
    "app"
  ).innerHTML =
    `
    <section class="section">

      <div class="container">

        <div class="admin-card">

          <h1>
            ${escapeHTML(title)}
          </h1>

          <p>
            ${escapeHTML(message)}
          </p>

        </div>

      </div>

    </section>
    `;

}


/* =========================================================
   CLIMA
========================================================= */

function renderWeatherPage() {

  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML = `

    <section class="section weather-page">

      <div class="container">

        <div class="weather-box">

          <span class="category-badge">
            🌤️ GAMARRA TV
          </span>

          <h1 class="section-title"
              style="color:white">
            El clima
          </h1>

          <p>
            Consulta las condiciones meteorológicas
            actuales y el pronóstico.
          </p>

          <div class="weather-search">

            <input
              id="weatherCity"
              placeholder="Ejemplo: Gamarra, Cesar"
              value="Gamarra, Cesar"
            >

            <button
              class="primary-button"
              onclick="searchWeather()"
            >
              🔎 Buscar
            </button>

          </div>

          <div
            id="weatherResult"
            class="message"
          >
            Consulta el clima de tu ciudad.
          </div>

        </div>

      </div>

    </section>

  `;

}


async function searchWeather() {

  const city =
    document
      .getElementById(
        "weatherCity"
      )
      .value
      .trim();

  const result =
    document.getElementById(
      "weatherResult"
    );


  if (!city) {
    return;
  }


  result.innerHTML =
    "Consultando clima...";


  try {

    const geoResponse =
      await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`
      );

    const geo =
      await geoResponse.json();


    if (
      !geo.results ||
      !geo.results.length
    ) {

      result.innerHTML =
        "No encontramos esa ubicación.";

      return;

    }


    const place =
      geo.results[0];


    const weatherResponse =
      await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );


    const weather =
      await weatherResponse.json();


    result.innerHTML =
      `
      <h2>
        ${escapeHTML(
          place.name
        )}, ${escapeHTML(
          place.country || ""
        )}
      </h2>

      <p>
        🌡️ Temperatura:
        <strong>
          ${weather.current.temperature_2m}°C
        </strong>
      </p>

      <p>
        💧 Humedad:
        ${weather.current.relative_humidity_2m}%
      </p>

      <p>
        💨 Viento:
        ${weather.current.wind_speed_10m} km/h
      </p>
      `;

  } catch {

    result.innerHTML =
      "No fue posible consultar el clima en este momento.";

  }

}


/* =========================================================
   CONTACTO
========================================================= */

async function renderContactPage() {

  const app =
    document.getElementById(
      "app"
    );

  app.innerHTML = `

    <section class="section">

      <div class="container">

        <div class="contact-hero">

          <span class="category-badge">
            GTV MEDIOS
          </span>

          <h1>
            Estamos para escucharte
          </h1>

          <p>
            ¿Tienes una noticia, una denuncia,
            una propuesta comercial o quieres
            comunicarte con nuestro equipo?
            Estamos disponibles para recibir
            tus mensajes.
          </p>

        </div>


        <div class="contact-grid">

          <div class="contact-card">

            <h2>
              COMUNÍCATE CON NOSOTROS
            </h2>

            <p>
              Gamarra TV es un medio regional
              comprometido con informar,
              conectar y dar voz a nuestra comunidad.
            </p>


            <div class="products-grid">

              <div class="product-card">

                <h3>
                  Noticias
                </h3>

                <p>
                  Envíanos información,
                  fotografías o videos sobre
                  hechos que estén ocurriendo.
                </p>

              </div>


              <div class="product-card">

                <h3>
                  Publicidad
                </h3>

                <p>
                  Comunícate con nosotros para
                  conocer nuestras opciones
                  comerciales.
                </p>

              </div>


              <div class="product-card">

                <h3>
                  Radio
                </h3>

                <p>
                  También puedes comunicarte
                  con nuestro equipo para
                  información relacionada con radio.
                </p>

              </div>


              <div class="product-card">

                <h3>
                  Alianzas
                </h3>

                <p>
                  Estamos abiertos a proyectos,
                  alianzas y propuestas.
                </p>

              </div>

            </div>

          </div>


          <div class="contact-card">

            <h2>
              CONTACTO
            </h2>

            <p>
              Comunícate con Gamarra TV
            </p>

            <div class="contact-items">

              <a
                class="contact-item"
                target="_blank"
                href="https://wa.me/${WHATSAPP}"
              >
                💬
                <strong>
                  WhatsApp
                </strong>
                <br>
                ${PHONE}
              </a>


              <a
                class="contact-item"
                href="tel:+${WHATSAPP}"
              >
                📞
                <strong>
                  Teléfono
                </strong>
                <br>
                ${PHONE}
              </a>


              <a
                class="contact-item"
                href="mailto:${EMAIL}"
              >
                ✉️
                <strong>
                  Correo electrónico
                </strong>
                <br>
                ${EMAIL}
              </a>

            </div>

          </div>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   CARRUSEL
========================================================= */

function moveCarousel(direction) {

  const carousel =
    document.getElementById(
      "newsCarousel"
    );

  if (!carousel) {
    return;
  }

  carousel.scrollBy({
    left:
      direction * 360,
    behavior: "smooth"
  });

}


/* =========================================================
   MENÚ MÓVIL
========================================================= */

function toggleMobileMenu() {

  const menu =
    document.getElementById(
      "mobileMenu"
    );

  menu.classList.toggle(
    "open"
  );

}


/* =========================================================
   HELPERS ADMIN
========================================================= */

window.openPanel =
  openPanel;

window.closeLogin =
  closeLogin;

window.logout =
  logout;

window.showAdminTab =
  showAdminTab;

window.editNews =
  editNews;

window.deleteNews =
  deleteNews;

window.editProgram =
  editProgram;

window.deleteProgram =
  deleteProgram;

window.deleteAd =
  deleteAd;

window.deleteClient =
  deleteClient;

window.openArticle =
  openArticle;

window.navigateHome =
  navigateHome;

window.navigateNews =
  navigateNews;

window.navigateLive =
  navigateLive;

window.navigateWeather =
  navigateWeather;

window.navigateContact =
  navigateContact;

window.filterNewsPage =
  filterNewsPage;

window.filterHomeCategory =
  filterHomeCategory;

window.selectScheduleDay =
  selectScheduleDay;

window.moveCarousel =
  moveCarousel;

window.toggleMobileMenu =
  toggleMobileMenu;

window.searchWeather =
  searchWeather;

window.copyArticleLink =
  copyArticleLink;


/* =========================================================
   FIN
========================================================= */
