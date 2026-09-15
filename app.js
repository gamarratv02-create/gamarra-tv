/* ==========================================================
   GAMARRA TV
   Sistema de noticias + programación + administración
========================================================== */


/* ==========================================================
   1. CONFIGURACIÓN SUPABASE
==========================================================

   IMPORTANTE:

   Reemplaza únicamente los dos valores de abajo.

   NO utilices la Secret key.

========================================================== */

const SUPABASE_URL = "PEGAR_AQUI_TU_PROJECT_URL";

const SUPABASE_PUBLISHABLE_KEY =
  "PEGAR_AQUI_TU_PUBLISHABLE_KEY";


/* ==========================================================
   2. CLIENTE SUPABASE
========================================================== */

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ==========================================================
   3. CONFIGURACIÓN GENERAL
========================================================== */

const LOGO_GAMARRA =
  "https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png";

const LIVE_URL =
  "https://new.opencaster.com/player/embed?user=gamarratv";

const STORAGE_BUCKET = "noticias";

const app = document.getElementById("app");


/* ==========================================================
   4. MENÚ MÓVIL
========================================================== */

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle) {

  menuToggle.addEventListener("click", () => {

    mainNav.classList.toggle("open");

  });

}


/* ==========================================================
   5. FUNCIONES GENERALES
========================================================== */

function escapeHTML(text) {

  if (text === null || text === undefined) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatDate(date) {

  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

}


function showLoading() {

  app.innerHTML = `
    <div class="loading">
      Cargando información de Gamarra TV...
    </div>
  `;

}


function showError(message) {

  app.innerHTML = `
    <div class="container">
      <div class="alert alert-error">
        ${escapeHTML(message)}
      </div>
    </div>
  `;

}


/* ==========================================================
   6. OBTENER NOTICIAS
========================================================== */

async function getNews() {

  const { data, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    return [];

  }

  return data || [];

}


/* ==========================================================
   7. INICIO
========================================================== */

async function renderHome() {

  showLoading();

  const news = await getNews();

  let html = `

    <section class="live-section">

      <div class="container">

        <div class="page-title">

          <h1>Gamarra TV</h1>

          <p>
            Noticias, televisión y actualidad.
          </p>

        </div>


        <div class="live-layout">

          <div class="live-player">

            <iframe
              src="${LIVE_URL}"
              title="Gamarra TV en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen>
            </iframe>

          </div>


          <div class="live-info">

            <div class="live-title">
              🔴 EN VIVO
            </div>

            <div id="homeSchedule">
              <div class="schedule-empty">
                Cargando programación...
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>


    <section class="news-section">

      <div class="container">

        <div class="page-title">

          <h1>Últimas noticias</h1>

          <p>
            Información de Gamarra y la región.
          </p>

        </div>

        <div class="news-grid">
  `;


  if (!news.length) {

    html += `
      <div class="alert alert-success">
        Todavía no hay noticias publicadas.
      </div>
    `;

  } else {

    news.forEach(newsItem => {

      html += createNewsCard(newsItem);

    });

  }


  html += `
        </div>

      </div>

    </section>
  `;


  app.innerHTML = html;

  await loadHomeSchedule();

}


/* ==========================================================
   8. TARJETA DE NOTICIA
========================================================== */

function createNewsCard(item) {

  const image =
    item.imagen_url ||
    item.imagen ||
    LOGO_GAMARRA;

  const title =
    item.titulo ||
    "Sin título";

  const content =
    item.contenido ||
    "";

  const category =
    item.categoria ||
    "Noticias";

  const excerpt =
    content.length > 140
      ? content.substring(0, 140) + "..."
      : content;


  return `

    <article class="news-card">

      <a href="#/noticia/${item.id}">

        <img
          class="news-image"
          src="${escapeHTML(image)}"
          alt="${escapeHTML(title)}"
        >

      </a>


      <div class="news-content">

        <div class="news-category">
          ${escapeHTML(category)}
        </div>

        <h2>
          ${escapeHTML(title)}
        </h2>

        <div class="news-date">
          ${formatDate(item.created_at)}
        </div>

        <p class="news-excerpt">
          ${escapeHTML(excerpt)}
        </p>

        <a
          class="read-more"
          href="#/noticia/${item.id}"
        >
          Leer noticia →
        </a>

      </div>

    </article>

  `;

}


/* ==========================================================
   9. PROGRAMACIÓN
========================================================== */

async function getSchedule() {

  const { data, error } = await supabaseClient
    .from("programación")
    .select("*")
    .order("hora_inicio", {
      ascending: true
    });

  if (error) {

    console.error("Error programación:", error);

    return [];

  }

  return data || [];

}


async function loadHomeSchedule() {

  const container =
    document.getElementById("homeSchedule");

  if (!container) {
    return;
  }

  const schedule = await getSchedule();

  if (!schedule.length) {

    container.innerHTML = `
      <div class="schedule-empty">
        No hay programación registrada.
      </div>
    `;

    return;

  }

  container.innerHTML = schedule
    .slice(0, 8)
    .map(program => `

      <div class="schedule-item">

        <div class="schedule-time">
          ${escapeHTML(program.hora_inicio || "")}
          ${program.hora_fin ? " - " + escapeHTML(program.hora_fin) : ""}
        </div>

        <div class="schedule-name">
          ${escapeHTML(
            program.nombre_programa ||
            program.programa ||
            "Programa"
          )}
        </div>

      </div>

    `)
    .join("");

}


/* ==========================================================
   10. PÁGINA EN VIVO
========================================================== */

async function renderLive() {

  showLoading();

  const schedule = await getSchedule();

  let scheduleHTML = "";

  if (!schedule.length) {

    scheduleHTML = `
      <div class="schedule-empty">
        No hay programación registrada.
      </div>
    `;

  } else {

    scheduleHTML = schedule
      .map(program => `

        <div class="schedule-item">

          <div class="schedule-time">
            ${escapeHTML(program.hora_inicio || "")}
            ${program.hora_fin
              ? " - " + escapeHTML(program.hora_fin)
              : ""}
          </div>

          <div class="schedule-name">
            ${escapeHTML(
              program.nombre_programa ||
              program.programa ||
              "Programa"
            )}
          </div>

        </div>

      `)
      .join("");

  }


  app.innerHTML = `

    <section class="live-section">

      <div class="container">

        <div class="page-title">

          <h1>🔴 Gamarra TV En Vivo</h1>

          <p>
            Disfruta nuestra señal en directo.
          </p>

        </div>


        <div class="live-layout">

          <div class="live-player">

            <iframe
              src="${LIVE_URL}"
              title="Gamarra TV en vivo"
              allow="autoplay; fullscreen"
              allowfullscreen>
            </iframe>

          </div>


          <div class="live-info">

            <div class="live-title">
              Programación
            </div>

            ${scheduleHTML}

          </div>

        </div>

      </div>

    </section>

  `;

}


/* ==========================================================
   11. NOTICIA INDIVIDUAL
========================================================== */

async function renderArticle(id) {

  showLoading();

  const { data, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {

    showError("No encontramos esta noticia.");

    return;

  }


  const image =
    data.imagen_url ||
    data.imagen ||
    LOGO_GAMARRA;


  app.innerHTML = `

    <div class="container">

      <article class="article">

        <div class="news-category">
          ${escapeHTML(data.categoria || "Noticias")}
        </div>

        <h1>
          ${escapeHTML(data.titulo || "")}
        </h1>

        <div class="news-date">
          ${formatDate(data.created_at)}
        </div>

        <img
          class="article-image"
          src="${escapeHTML(image)}"
          alt="${escapeHTML(data.titulo || "Gamarra TV")}"
        >

        <div class="article-content">
          ${escapeHTML(data.contenido || "")}
        </div>

      </article>

    </div>

  `;

}


/* ==========================================================
   12. CATEGORÍA
========================================================== */

async function renderCategory(category) {

  showLoading();

  const news = await getNews();

  const filtered = news.filter(item => {

    const value =
      String(item.categoria || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const wanted =
      category
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return value === wanted;

  });


  let html = `

    <div class="container">

      <div class="page-title">

        <h1>
          ${escapeHTML(category)}
        </h1>

        <p>
          Noticias de ${escapeHTML(category)}.
        </p>

      </div>

      <div class="news-grid">

  `;


  if (!filtered.length) {

    html += `
      <div class="alert alert-success">
        No hay noticias publicadas en esta categoría.
      </div>
    `;

  } else {

    filtered.forEach(item => {

      html += createNewsCard(item);

    });

  }


  html += `
      </div>

    </div>
  `;


  app.innerHTML = html;

}


/* ==========================================================
   13. LOGIN ADMINISTRADOR
========================================================== */

async function renderAdmin() {

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();


  if (!user) {

    renderLogin();

    return;

  }


  renderAdminPanel();

}


/* ==========================================================
   14. FORMULARIO LOGIN
========================================================== */

function renderLogin(message = "") {

  app.innerHTML = `

    <section class="admin-wrapper">

      <div class="container">

        <div class="admin-login">

          <h1>🔐 Administración</h1>

          <p>
            Inicia sesión para administrar Gamarra TV.
          </p>

          ${message}

          <form id="loginForm">

            <div class="form-group">

              <label>
                Correo electrónico
              </label>

              <input
                type="email"
                id="loginEmail"
                required
                autocomplete="email"
              >

            </div>


            <br>


            <div class="form-group">

              <label>
                Contraseña
              </label>

              <input
                type="password"
                id="loginPassword"
                required
                autocomplete="current-password"
              >

            </div>


            <div class="form-actions">

              <button
                class="primary-button"
                type="submit"
              >
                Iniciar sesión
              </button>

            </div>

          </form>

        </div>

      </div>

    </section>

  `;


  document
    .getElementById("loginForm")
    .addEventListener("submit", login);

}


/* ==========================================================
   15. LOGIN
========================================================== */

async function login(event) {

  event.preventDefault();

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;


  const {
    error
  } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });


  if (error) {

    renderLogin(`
      <div class="alert alert-error">
        ${escapeHTML(error.message)}
      </div>
    `);

    return;

  }


  renderAdmin();

}


/* ==========================================================
   16. PANEL ADMIN
========================================================== */

async function renderAdminPanel() {

  app.innerHTML = `

    <section class="admin-wrapper">

      <div class="container">

        <div class="admin-panel">

          <div class="admin-header">

            <div>

              <h1>
                Panel de administración
              </h1>

              <p>
                Gamarra TV
              </p>

            </div>

            <button
              class="danger-button"
              id="logoutButton"
            >
              Cerrar sesión
            </button>

          </div>


          <div class="admin-tabs">

            <button
              class="admin-tab active"
              data-tab="news"
            >
              📰 Noticias
            </button>

            <button
              class="admin-tab"
              data-tab="schedule"
            >
              📺 Programación
            </button>

          </div>


          <div id="adminContent"></div>

        </div>

      </div>

    </section>

  `;


  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {

      await supabaseClient.auth.signOut();

      location.hash = "#/admin";

    });


  document
    .querySelectorAll(".admin-tab")
    .forEach(button => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".admin-tab")
          .forEach(btn =>
            btn.classList.remove("active")
          );

        button.classList.add("active");

        if (button.dataset.tab === "news") {

          renderAdminNews();

        } else {

          renderAdminSchedule();

        }

      });

    });


  renderAdminNews();

}


/* ==========================================================
   17. ADMIN NOTICIAS
========================================================== */

async function renderAdminNews() {

  const container =
    document.getElementById("adminContent");

  if (!container) {
    return;
  }


  const news = await getNews();


  container.innerHTML = `

    <div class="admin-section">

      <h2>
        Publicar nueva noticia
      </h2>

      <div id="newsMessage"></div>


      <form id="newsForm">

        <div class="form-grid">

          <div class="form-group full">

            <label>
              Título
            </label>

            <input
              type="text"
              id="newsTitle"
              required
              placeholder="Escribe el título de la noticia"
            >

          </div>


          <div class="form-group">

            <label>
              Categoría
            </label>

            <select id="newsCategory" required>

              <option value="">
                Seleccionar categoría
              </option>

              <option value="Gamarra">
                Gamarra
              </option>

              <option value="Judicial">
                Judicial
              </option>

              <option value="Deportes">
                Deportes
              </option>

              <option value="Región">
                Región
              </option>

              <option value="Nacionales">
                Nacionales
              </option>

              <option value="Internacionales">
                Internacionales
              </option>

              <option value="Entretenimiento">
                Entretenimiento
              </option>

            </select>

          </div>


          <div class="form-group">

            <label>
              Imagen
            </label>

            <input
              type="file"
              id="newsImage"
              accept="image/*"
            >

          </div>


          <div class="form-group full">

            <label>
              Contenido
            </label>

            <textarea
              id="newsContent"
              required
              placeholder="Escribe el contenido de la noticia..."
            ></textarea>

          </div>

        </div>


        <div class="form-actions">

          <button
            class="primary-button"
            type="submit"
          >
            📰 Publicar noticia
          </button>

        </div>

      </form>

    </div>


    <hr>


    <div class="admin-section">

      <h2>
        Noticias publicadas
      </h2>

      <div class="admin-table-wrapper">

        <table class="admin-table">

          <thead>

            <tr>

              <th>Imagen</th>
              <th>Título</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Acciones</th>

            </tr>

          </thead>

          <tbody>

            ${
              news.length
                ? news.map(createAdminNewsRow).join("")
                : `
                  <tr>
                    <td colspan="5">
                      No hay noticias publicadas.
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>

    </div>

  `;


  document
    .getElementById("newsForm")
    .addEventListener("submit", createNews);


  document
    .querySelectorAll("[data-delete-news]")
    .forEach(button => {

      button.addEventListener("click", () => {

        deleteNews(button.dataset.deleteNews);

      });

    });

}


/* ==========================================================
   18. FILA ADMIN NOTICIA
========================================================== */

function createAdminNewsRow(item) {

  const image =
    item.imagen_url ||
    item.imagen ||
    LOGO_GAMARRA;


  return `

    <tr>

      <td>

        <img
          class="admin-table-image"
          src="${escapeHTML(image)}"
          alt=""
        >

      </td>

      <td>
        ${escapeHTML(item.titulo || "")}
      </td>

      <td>
        ${escapeHTML(item.categoria || "")}
      </td>

      <td>
        ${formatDate(item.created_at)}
      </td>

      <td>

        <button
          class="danger-button"
          data-delete-news="${escapeHTML(item.id)}"
        >
          Eliminar
        </button>

      </td>

    </tr>

  `;

}


/* ==========================================================
   19. SUBIR IMAGEN
========================================================== */

async function uploadNewsImage(file) {

  if (!file) {
    return null;
  }


  const extension =
    file.name.split(".").pop().toLowerCase();


  const filename =
    `${Date.now()}-${crypto.randomUUID()}.${extension}`;


  const path =
    `noticias/${filename}`;


  const {
    error
  } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });


  if (error) {

    throw error;

  }


  const {
    data
  } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);


  return data.publicUrl;

}


/* ==========================================================
   20. CREAR NOTICIA
========================================================== */

async function createNews(event) {

  event.preventDefault();


  const message =
    document.getElementById("newsMessage");


  message.innerHTML = `
    <div class="alert alert-success">
      Publicando noticia...
    </div>
  `;


  try {

    const title =
      document.getElementById("newsTitle").value.trim();

    const category =
      document.getElementById("newsCategory").value;

    const content =
      document.getElementById("newsContent").value.trim();

    const file =
      document.getElementById("newsImage").files[0];


    let imageUrl = null;


    if (file) {

      imageUrl =
        await uploadNewsImage(file);

    }


    const {
      error
    } = await supabaseClient
      .from("noticias")
      .insert({

        titulo: title,

        contenido: content,

        categoria: category,

        imagen_url: imageUrl

      });


    if (error) {

      throw error;

    }


    message.innerHTML = `
      <div class="alert alert-success">
        ✅ La noticia fue publicada correctamente.
      </div>
    `;


    document
      .getElementById("newsForm")
      .reset();


    setTimeout(() => {

      renderAdminNews();

    }, 1200);


  } catch (error) {

    console.error(error);

    message.innerHTML = `
      <div class="alert alert-error">
        ${escapeHTML(error.message)}
      </div>
    `;

  }

}


/* ==========================================================
   21. ELIMINAR NOTICIA
========================================================== */

async function deleteNews(id) {

  const confirmed =
    confirm(
      "¿Seguro que quieres eliminar esta noticia?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("noticias")
    .delete()
    .eq("id", id);


  if (error) {

    alert(
      "No se pudo eliminar la noticia: " +
      error.message
    );

    return;

  }


  renderAdminNews();

}


/* ==========================================================
   22. ADMIN PROGRAMACIÓN
========================================================== */

async function renderAdminSchedule() {

  const container =
    document.getElementById("adminContent");

  if (!container) {
    return;
  }


  const schedule =
    await getSchedule();


  container.innerHTML = `

    <div class="admin-section">

      <h2>
        Agregar programa
      </h2>

      <div id="scheduleMessage"></div>


      <form id="scheduleForm">

        <div class="form-grid">

          <div class="form-group">

            <label>
              Nombre del programa
            </label>

            <input
              type="text"
              id="programName"
              required
              placeholder="Ej: Mañana de Vallenato"
            >

          </div>


          <div class="form-group">

            <label>
              Día
            </label>

            <select id="programDay" required>

              <option value="Lunes">
                Lunes
              </option>

              <option value="Martes">
                Martes
              </option>

              <option value="Miércoles">
                Miércoles
              </option>

              <option value="Jueves">
                Jueves
              </option>

              <option value="Viernes">
                Viernes
              </option>

              <option value="Sábado">
                Sábado
              </option>

              <option value="Domingo">
                Domingo
              </option>

            </select>

          </div>


          <div class="form-group">

            <label>
              Hora de inicio
            </label>

            <input
              type="time"
              id="programStart"
              required
            >

          </div>


          <div class="form-group">

            <label>
              Hora de finalización
            </label>

            <input
              type="time"
              id="programEnd"
              required
            >

          </div>

        </div>


        <div class="form-actions">

          <button
            class="primary-button"
            type="submit"
          >
            ➕ Agregar programa
          </button>

        </div>

      </form>

    </div>


    <hr>


    <div class="admin-section">

      <h2>
        Programación actual
      </h2>

      <div class="admin-table-wrapper">

        <table class="admin-table">

          <thead>

            <tr>

              <th>Programa</th>
              <th>Día</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acción</th>

            </tr>

          </thead>

          <tbody>

            ${
              schedule.length
                ? schedule.map(createScheduleRow).join("")
                : `
                  <tr>
                    <td colspan="5">
                      No hay programas registrados.
                    </td>
                  </tr>
                `
            }

          </tbody>

        </table>

      </div>

    </div>

  `;


  document
    .getElementById("scheduleForm")
    .addEventListener(
      "submit",
      createSchedule
    );


  document
    .querySelectorAll("[data-delete-schedule]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          deleteSchedule(
            button.dataset.deleteSchedule
          );
        }
      );

    });

}


/* ==========================================================
   23. FILA PROGRAMACIÓN
========================================================== */

function createScheduleRow(item) {

  return `

    <tr>

      <td>
        ${escapeHTML(
          item.nombre_programa ||
          item.programa ||
          ""
        )}
      </td>

      <td>
        ${escapeHTML(item.dia || "")}
      </td>

      <td>
        ${escapeHTML(item.hora_inicio || "")}
      </td>

      <td>
        ${escapeHTML(item.hora_fin || "")}
      </td>

      <td>

        <button
          class="danger-button"
          data-delete-schedule="${escapeHTML(item.id)}"
        >
          Eliminar
        </button>

      </td>

    </tr>

  `;

}


/* ==========================================================
   24. CREAR PROGRAMA
========================================================== */

async function createSchedule(event) {

  event.preventDefault();


  const message =
    document.getElementById(
      "scheduleMessage"
    );


  message.innerHTML = `
    <div class="alert alert-success">
      Guardando programación...
    </div>
  `;


  try {

    const name =
      document.getElementById(
        "programName"
      ).value.trim();

    const day =
      document.getElementById(
        "programDay"
      ).value;

    const start =
      document.getElementById(
        "programStart"
      ).value;

    const end =
      document.getElementById(
        "programEnd"
      ).value;


    const {
      error
    } = await supabaseClient
      .from("programación")
      .insert({

        nombre_programa: name,

        dia: day,

        hora_inicio: start,

        hora_fin: end

      });


    if (error) {

      throw error;

    }


    message.innerHTML = `
      <div class="alert alert-success">
        ✅ Programa agregado correctamente.
      </div>
    `;


    document
      .getElementById("scheduleForm")
      .reset();


    setTimeout(() => {

      renderAdminSchedule();

    }, 1000);


  } catch (error) {

    console.error(error);

    message.innerHTML = `
      <div class="alert alert-error">
        ${escapeHTML(error.message)}
      </div>
    `;

  }

}


/* ==========================================================
   25. ELIMINAR PROGRAMA
========================================================== */

async function deleteSchedule(id) {

  const confirmed =
    confirm(
      "¿Seguro que quieres eliminar este programa?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } = await supabaseClient
    .from("programación")
    .delete()
    .eq("id", id);


  if (error) {

    alert(
      "No se pudo eliminar: " +
      error.message
    );

    return;

  }


  renderAdminSchedule();

}


/* ==========================================================
   26. ROUTER
========================================================== */

async function router() {

  const hash =
    location.hash || "#/";


  /* Inicio */

  if (
    hash === "#/" ||
    hash === ""
  ) {

    await renderHome();

    return;

  }


  /* En vivo */

  if (
    hash === "#/en-vivo"
  ) {

    await renderLive();

    return;

  }


  /* Administración */

  if (
    hash === "#/admin"
  ) {

    await renderAdmin();

    return;

  }


  /* Noticia */

  if (
    hash.startsWith("#/noticia/")
  ) {

    const id =
      hash.split("/")[2];

    await renderArticle(id);

    return;

  }


  /* Categoría */

  if (
    hash.startsWith("#/categoria/")
  ) {

    const category =
      decodeURIComponent(
        hash.split("/")[2]
      );


    await renderCategory(category);

    return;

  }


  /* Página no encontrada */

  showError(
    "La página que buscas no existe."
  );

}


/* ==========================================================
   27. ESCUCHAR CAMBIOS DE URL
========================================================== */

window.addEventListener(
  "hashchange",
  router
);


/* ==========================================================
   28. INICIAR
========================================================== */

router();
