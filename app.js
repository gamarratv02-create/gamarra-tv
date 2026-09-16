/* =========================================================
   GAMARRA TV
   APP PRINCIPAL
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIGURACIÓN
    ====================================================== */

    const CONFIG = window.__SUPABASE_CONFIG__ || {};

    const app = document.getElementById("app");

    const authLink = document.getElementById("authLink");

    const menuToggle = document.getElementById("menuToggle");

    const mainNav = document.getElementById("mainNav");


    /* =====================================================
       VALIDAR SUPABASE
    ====================================================== */

    if (
        !CONFIG.url ||
        !CONFIG.publishableKey
    ) {

        app.innerHTML = `
            <div class="notice error">
                <strong>Error de configuración.</strong><br>
                No se encontró la configuración de Supabase.
            </div>
        `;

        return;
    }


    /* =====================================================
       CLIENTE SUPABASE
    ====================================================== */

    const sb = window.supabase.createClient(
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


    /* =====================================================
       ESTADO
    ====================================================== */

    const state = {

        editingNewsId: null,

        editingProgramId: null,

        adminNews: [],

        adminPrograms: []

    };


    /* =====================================================
       CATEGORÍAS
    ====================================================== */

    const CATEGORIES = [

        ["gamarra", "Gamarra"],

        ["judicial", "Judicial"],

        ["deportes", "Deportes"],

        ["region", "Región"],

        ["nacionales", "Nacionales"],

        ["internacionales", "Internacionales"],

        ["entretenimiento", "Entretenimiento"]

    ];


    /* =====================================================
       DÍAS
    ====================================================== */

    const DAYS = [

        ["lunes", "LUN"],

        ["martes", "MAR"],

        ["miercoles", "MIÉ"],

        ["jueves", "JUE"],

        ["viernes", "VIE"],

        ["sabado", "SÁB"],

        ["domingo", "DOM"]

    ];


    const DAY_ORDER = {

        lunes: 1,

        martes: 2,

        miercoles: 3,

        jueves: 4,

        viernes: 5,

        sabado: 6,

        domingo: 7

    };


    /* =====================================================
       UTILIDADES
    ====================================================== */

    function escapeHtml(value) {

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


    function normalizeCategory(value) {

        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    }


    function categoryName(slug) {

        const item = CATEGORIES.find(
            c => c[0] === normalizeCategory(slug)
        );

        return item ? item[1] : "Actualidad";

    }


    function dayName(slug) {

        const item = DAYS.find(
            d => d[0] === normalizeCategory(slug)
        );

        return item ? item[1] : String(slug || "").toUpperCase();

    }


    function formatDate(date) {

        if (!date) {
            return "";
        }

        try {

            return new Intl.DateTimeFormat(
                "es-CO",
                {
                    dateStyle: "medium"
                }
            ).format(new Date(date));

        } catch {

            return "";
        }

    }


    function imageFallback() {

        return `
            linear-gradient(
                135deg,
                #061a33,
                #0d47a1
            )
        `;
    }


    function showMessage(type, text) {

        return `
            <div class="message ${type}">
                ${escapeHtml(text)}
            </div>
        `;

    }


    function getErrorMessage(error) {

        if (!error) {
            return "Ocurrió un error.";
        }

        return (
            error.message ||
            error.error_description ||
            "Ocurrió un error inesperado."
        );

    }


    function closeMenu() {

        if (mainNav) {
            mainNav.classList.remove("open");
        }

    }


    /* =====================================================
       MENU
    ====================================================== */

    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            () => {

                mainNav.classList.toggle("open");

            }
        );

    }


    document.addEventListener(
        "click",
        event => {

            const link = event.target.closest(
                ".main-nav a"
            );

            if (link) {
                closeMenu();
            }

        }
    );


    /* =====================================================
       SESIÓN
    ====================================================== */

    async function getSession() {

        const {
            data,
            error
        } = await sb.auth.getSession();

        if (error) {
            console.error(error);
        }

        return data?.session || null;

    }


    async function updateAuthButton() {

        const session = await getSession();

        if (!authLink) {
            return;
        }

        if (session) {

            authLink.textContent = "⚙️ Panel";

            authLink.href = "#/admin";

        } else {

            authLink.textContent = "🔐 Iniciar sesión";

            authLink.href = "#/login";

        }

    }


    sb.auth.onAuthStateChange(
        () => {

            updateAuthButton();

        }
    );


    /* =====================================================
       NOTICIAS PÚBLICAS
    ====================================================== */

    async function getNews(limit = 12) {

        const {
            data,
            error
        } = await sb
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


    async function getNewsByCategory(category) {

        const {
            data,
            error
        } = await sb
            .from("noticias")
            .select("*")
            .eq("publicada", true)
            .eq(
                "categoria",
                normalizeCategory(category)
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

        return data || [];

    }


    async function getArticle(id) {

        const {
            data,
            error
        } = await sb
            .from("noticias")
            .select("*")
            .eq("id", id)
            .eq("publicada", true)
            .single();

        if (error) {
            throw error;
        }

        return data;

    }


    /* =====================================================
       PROGRAMACIÓN PÚBLICA
    ====================================================== */

    async function getProgramming() {

        const {
            data,
            error
        } = await sb
            .from("programacion")
            .select("*")
            .eq("activo", true);

        if (error) {
            throw error;
        }

        return sortProgramming(data || []);

    }


    function sortProgramming(items) {

        return items.sort(
            (a, b) => {

                const dayA =
                    DAY_ORDER[
                        normalizeCategory(a.dia)
                    ] || 99;

                const dayB =
                    DAY_ORDER[
                        normalizeCategory(b.dia)
                    ] || 99;

                if (dayA !== dayB) {
                    return dayA - dayB;
                }

                return String(a.hora || "")
                    .localeCompare(
                        String(b.hora || "")
                    );

            }
        );

    }


    /* =====================================================
       TARJETA NOTICIA
    ====================================================== */

    function newsCard(news) {

        const image = news.imagen_url
            ? `
                <img
                    src="${escapeHtml(news.imagen_url)}"
                    alt="${escapeHtml(news.titulo)}"
                    loading="lazy"
                >
            `
            : "";


        return `
            <article class="news-card">

                <a
                    class="news-image"
                    href="#/noticia/${encodeURIComponent(news.id)}"
                    style="${image ? "" : `background:${imageFallback()}`}"
                >

                    ${image}

                </a>


                <div class="news-content">

                    <div class="news-meta">

                        <span class="news-category">
                            ${escapeHtml(
                                categoryName(news.categoria)
                            )}
                        </span>

                        <span>
                            ${escapeHtml(
                                formatDate(news.created_at)
                            )}
                        </span>

                    </div>


                    <h3>

                        <a
                            href="#/noticia/${encodeURIComponent(news.id)}"
                        >
                            ${escapeHtml(news.titulo)}
                        </a>

                    </h3>


                    ${
                        news.resumen
                        ?
                        `<p>
                            ${escapeHtml(news.resumen)}
                        </p>`
                        :
                        ""
                    }

                </div>

            </article>
        `;

    }


    /* =====================================================
       PROGRAMACIÓN
    ====================================================== */

    function scheduleHTML(items, activeDay) {

        const filtered = items.filter(
            item =>
                normalizeCategory(item.dia) ===
                normalizeCategory(activeDay)
        );


        if (!filtered.length) {

            return `
                <div class="no-programming">

                    No hay programación registrada
                    para este día.

                </div>
            `;

        }


        return filtered
            .map(
                item => `

                    <div class="schedule-item">

                        <div class="schedule-time">

                            ${escapeHtml(
                                formatTime(item.hora)
                            )}

                        </div>


                        <div class="schedule-program">

                            ${escapeHtml(
                                item.programa
                            )}

                        </div>


                        ${
                            item.descripcion
                            ?
                            `<div class="schedule-desc">
                                ${escapeHtml(
                                    item.descripcion
                                )}
                            </div>`
                            :
                            ""
                        }

                    </div>

                `
            )
            .join("");

    }


    function formatTime(value) {

        if (!value) {
            return "";
        }

        const text = String(value);

        if (/^\d{2}:\d{2}/.test(text)) {

            const [hour, minute] =
                text.split(":");

            let h = Number(hour);

            const ampm =
                h >= 12
                    ? "p.m."
                    : "a.m.";

            h = h % 12;

            if (h === 0) {
                h = 12;
            }

            return `${h}:${minute} ${ampm}`;

        }

        return text;

    }


    /* =====================================================
       BLOQUE TV
    ====================================================== */

    function tvSection(programming) {

        const today =
            new Date()
                .toLocaleDateString(
                    "es-CO",
                    {
                        weekday: "long"
                    }
                )
                .toLowerCase();


        const todaySlug =
            normalizeCategory(today);


        const validDay =
            DAYS.some(
                day =>
                    day[0] === todaySlug
            )
            ? todaySlug
            : "lunes";


        return `

            <section class="tv-section">

                <div class="container">

                    <div class="tv-grid">


                        <!-- SEÑAL EN VIVO -->

                        <div class="live-box">

                            <iframe

                                src="${escapeHtml(
                                    CONFIG.liveUrl
                                )}"

                                title="Gamarra TV en vivo"

                                allow="
                                    autoplay;
                                    fullscreen;
                                    picture-in-picture
                                "

                                allowfullscreen

                            ></iframe>

                        </div>


                        <!-- PROGRAMACIÓN -->

                        <aside class="schedule-panel">

                            <h2 class="schedule-title">

                                PROGRAMACIÓN

                            </h2>


                            <div class="days">

                                ${DAYS.map(
                                    day => `

                                        <button

                                            type="button"

                                            class="
                                                day-button
                                                ${
                                                    day[0] === validDay
                                                        ? "active"
                                                        : ""
                                                }
                                            "

                                            data-day="${day[0]}"

                                        >
                                            ${day[1]}
                                        </button>

                                    `
                                ).join("")}

                            </div>


                            <div
                                class="schedule-list"
                                id="publicSchedule"
                            >

                                ${scheduleHTML(
                                    programming,
                                    validDay
                                )}

                            </div>

                        </aside>

                    </div>

                </div>

            </section>

        `;

    }


    /* =====================================================
       HOME
    ====================================================== */

    async function renderHome() {

        app.innerHTML = `
            <section class="loading-screen">
                <div class="loader"></div>
                <p>Cargando noticias...</p>
            </section>
        `;


        let news = [];

        let programming = [];

        let newsError = null;

        let programmingError = null;


        try {

            news = await getNews(12);

        } catch (error) {

            console.error(error);

            newsError = error;

        }


        try {

            programming =
                await getProgramming();

        } catch (error) {

            console.error(error);

            programmingError = error;

        }


        const latest = news[0];


        let html = "";


        /* HERO */

        if (latest) {

            html += `

                <section class="hero">

                    <div class="container">

                        <div class="hero-grid">

                            <a
                                class="hero-news"
                                href="#/noticia/${encodeURIComponent(
                                    latest.id
                                )}"
                            >

                                ${
                                    latest.imagen_url
                                    ?
                                    `<img
                                        src="${escapeHtml(
                                            latest.imagen_url
                                        )}"
                                        alt="${escapeHtml(
                                            latest.titulo
                                        )}"
                                    >`
                                    :
                                    ""
                                }


                                <div class="hero-overlay">

                                    <span class="badge">

                                        ${escapeHtml(
                                            categoryName(
                                                latest.categoria
                                            )
                                        )}

                                    </span>


                                    <h1>

                                        ${escapeHtml(
                                            latest.titulo
                                        )}

                                    </h1>


                                    ${
                                        latest.resumen
                                        ?
                                        `<p>
                                            ${escapeHtml(
                                                latest.resumen
                                            )}
                                        </p>`
                                        :
                                        ""
                                    }

                                </div>

                            </a>


                            <div class="hero-side">

                                <div class="admin-card">

                                    <h2>
                                        📰 Últimas noticias
                                    </h2>

                                    ${
                                        news
                                            .slice(1, 5)
                                            .map(
                                                item => `
                                                    <div
                                                        style="
                                                            padding:15px 0;
                                                            border-bottom:
                                                                1px solid #e5e7eb;
                                                        "
                                                    >

                                                        <a
                                                            href="#/noticia/${encodeURIComponent(
                                                                item.id
                                                            )}"
                                                        >

                                                            <strong>
                                                                ${escapeHtml(
                                                                    item.titulo
                                                                )}
                                                            </strong>

                                                        </a>

                                                        <div
                                                            style="
                                                                color:#697586;
                                                                font-size:13px;
                                                                margin-top:5px;
                                                            "
                                                        >
                                                            ${escapeHtml(
                                                                formatDate(
                                                                    item.created_at
                                                                )
                                                            )}
                                                        </div>

                                                    </div>
                                                `
                                            )
                                            .join("")
                                    }

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

            `;

        } else {

            html += `

                <section class="section">

                    <div class="container">

                        <div class="empty-state">

                            <h2>
                                Bienvenidos a Gamarra TV
                            </h2>

                            <p>
                                Todavía no hay noticias publicadas.
                            </p>

                        </div>

                    </div>

                </section>

            `;

        }


        /* ERROR NOTICIAS */

        if (newsError) {

            html += `

                <div class="notice error">

                    No fue posible cargar las noticias.

                    <br>

                    <small>
                        ${escapeHtml(
                            getErrorMessage(newsError)
                        )}
                    </small>

                </div>

            `;

        }


        /* ÚLTIMAS NOTICIAS */

        if (news.length) {

            html += `

                <section class="section">

                    <div class="container">

                        <div class="section-header">

                            <h2 class="section-title">

                                Últimas noticias

                            </h2>

                            <a
                                class="section-link"
                                href="#/categoria/gamarra"
                            >
                                Ver noticias →
                            </a>

                        </div>


                        <div class="news-grid">

                            ${news
                                .slice(0, 8)
                                .map(newsCard)
                                .join("")}

                        </div>

                    </div>

                </section>

            `;

        }


        /* TV */

        html += tvSection(programming);


        if (programmingError) {

            html += `

                <div class="notice error">

                    La señal en vivo funciona,
                    pero no se pudo cargar la programación.

                    <br>

                    <small>
                        ${escapeHtml(
                            getErrorMessage(
                                programmingError
                            )
                        )}
                    </small>

                </div>

            `;

        }


        app.innerHTML = html;


        bindScheduleButtons(programming);

    }


    /* =====================================================
       BOTONES DE PROGRAMACIÓN PÚBLICA
    ====================================================== */

    function bindScheduleButtons(programming) {

        document
            .querySelectorAll(".day-button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(".day-button")
                            .forEach(
                                btn =>
                                    btn.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add("active");


                        const day =
                            button.dataset.day;


                        const schedule =
                            document.getElementById(
                                "publicSchedule"
                            );


                        if (schedule) {

                            schedule.innerHTML =
                                scheduleHTML(
                                    programming,
                                    day
                                );

                        }

                    }
                );

            });

    }


    /* =====================================================
       CATEGORÍA
    ====================================================== */

    async function renderCategory(category) {

        app.innerHTML = `
            <section class="loading-screen">
                <div class="loader"></div>
                <p>Cargando sección...</p>
            </section>
        `;


        try {

            const news =
                await getNewsByCategory(
                    category
                );


            app.innerHTML = `

                <section class="section">

                    <div class="container">

                        <div class="section-header">

                            <h1 class="section-title">

                                ${escapeHtml(
                                    categoryName(category)
                                )}

                            </h1>

                        </div>


                        ${
                            news.length
                            ?
                            `<div class="news-grid">
                                ${news
                                    .map(newsCard)
                                    .join("")}
                            </div>`
                            :
                            `<div class="empty-state">

                                <h2>
                                    No hay noticias todavía
                                </h2>

                                <p>
                                    Esta sección aún no tiene
                                    noticias publicadas.
                                </p>

                            </div>`
                        }

                    </div>

                </section>

            `;

        } catch (error) {

            app.innerHTML = `

                <div class="notice error">

                    <strong>
                        No se pudo cargar la sección.
                    </strong>

                    <br>

                    ${escapeHtml(
                        getErrorMessage(error)
                    )}

                </div>

            `;

        }

    }


    /* =====================================================
       ARTÍCULO
    ====================================================== */

    async function renderArticle(id) {

        app.innerHTML = `
            <section class="loading-screen">
                <div class="loader"></div>
                <p>Cargando noticia...</p>
            </section>
        `;


        try {

            const article =
                await getArticle(id);


            app.innerHTML = `

                <section class="article-page">

                    <div class="container">

                        <article class="article">

                            <div class="news-meta">

                                <span class="news-category">

                                    ${escapeHtml(
                                        categoryName(
                                            article.categoria
                                        )
                                    )}

                                </span>

                                <span>

                                    ${escapeHtml(
                                        formatDate(
                                            article.created_at
                                        )
                                    )}

                                </span>

                            </div>


                            <h1>

                                ${escapeHtml(
                                    article.titulo
                                )}

                            </h1>


                            ${
                                article.resumen
                                ?
                                `<div class="article-summary">

                                    ${escapeHtml(
                                        article.resumen
                                    )}

                                </div>`
                                :
                                ""
                            }


                            ${
                                article.imagen_url
                                ?
                                `<img
                                    class="article-image"
                                    src="${escapeHtml(
                                        article.imagen_url
                                    )}"
                                    alt="${escapeHtml(
                                        article.titulo
                                    )}"
                                >`
                                :
                                ""
                            }


                            <div class="article-body">

                                ${escapeHtml(
                                    article.contenido
                                )}

                            </div>

                        </article>

                    </div>

                </section>

            `;

        } catch (error) {

            app.innerHTML = `

                <div class="notice error">

                    <strong>
                        No se pudo encontrar la noticia.
                    </strong>

                    <br>

                    ${escapeHtml(
                        getErrorMessage(error)
                    )}

                </div>

            `;

        }

    }


    /* =====================================================
       EN VIVO
    ====================================================== */

    async function renderLive() {

        const programming =
            await getProgramming()
                .catch(() => []);


        app.innerHTML = `

            <section class="live-page">

                <div class="container">

                    <div class="live-heading">

                        <h1>
                            🔴 Gamarra TV en vivo
                        </h1>

                        <p>
                            Disfruta nuestra señal de televisión
                            en directo.
                        </p>

                    </div>


                    <div class="tv-grid">

                        <div class="live-box">

                            <iframe

                                src="${escapeHtml(
                                    CONFIG.liveUrl
                                )}"

                                title="Gamarra TV en vivo"

                                allow="
                                    autoplay;
                                    fullscreen;
                                    picture-in-picture
                                "

                                allowfullscreen

                            ></iframe>

                        </div>


                        <aside class="schedule-panel">

                            <h2 class="schedule-title">
                                PROGRAMACIÓN
                            </h2>


                            <div class="days">

                                ${DAYS.map(
                                    day => `
                                        <button
                                            class="day-button"
                                            data-day="${day[0]}"
                                        >
                                            ${day[1]}
                                        </button>
                                    `
                                ).join("")}

                            </div>


                            <div
                                class="schedule-list"
                                id="publicSchedule"
                            >

                                ${scheduleHTML(
                                    programming,
                                    "lunes"
                                )}

                            </div>

                        </aside>

                    </div>

                </div>

            </section>

        `;


        bindScheduleButtons(programming);

    }


    /* =====================================================
       LOGIN
    ====================================================== */

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


                    <p>
                        Accede al panel de administración
                        de Gamarra TV.
                    </p>


                    <div id="loginMessage"></div>


                    <form id="loginForm">

                        <div class="form-group">

                            <label>
                                Correo electrónico
                            </label>

                            <input
                                class="form-control"
                                type="email"
                                id="loginEmail"
                                required
                                autocomplete="email"
                                placeholder="correo@ejemplo.com"
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Contraseña
                            </label>

                            <input
                                class="form-control"
                                type="password"
                                id="loginPassword"
                                required
                                autocomplete="current-password"
                                placeholder="••••••••"
                            >

                        </div>


                        <button
                            class="btn btn-dark btn-block"
                            type="submit"
                        >
                            🔐 Iniciar sesión
                        </button>

                    </form>

                </div>

            </section>

        `;


        document
            .getElementById("loginForm")
            .addEventListener(
                "submit",
                handleLogin
            );

    }


    async function handleLogin(event) {

        event.preventDefault();


        const email =
            document.getElementById(
                "loginEmail"
            ).value.trim();


        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        const message =
            document.getElementById(
                "loginMessage"
            );


        message.innerHTML = `

            <div class="message info">
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

            message.innerHTML =
                showMessage(
                    "error",
                    getErrorMessage(error)
                );

            return;

        }


        window.location.hash = "#/admin";

    }


    /* =====================================================
       ADMIN - NOTICIAS
    ====================================================== */

    async function getAdminNews() {

        const {
            data,
            error
        } = await sb
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


    async function getAdminProgramming() {

        const {
            data,
            error
        } = await sb
            .from("programacion")
            .select("*");


        if (error) {
            throw error;
        }


        return sortProgramming(
            data || []
        );

    }


    /* =====================================================
       SUBIR IMAGEN
    ====================================================== */

    async function uploadImage(file) {

        if (!file) {
            return null;
        }


        if (!file.type.startsWith("image/")) {

            throw new Error(
                "El archivo debe ser una imagen."
            );

        }


        if (
            file.size >
            8 * 1024 * 1024
        ) {

            throw new Error(
                "La imagen no puede superar 8 MB."
            );

        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const random =
            Math.random()
                .toString(36)
                .substring(2);


        const path =
            `public/${Date.now()}-${random}.${extension}`;


        const {
            error
        } = await sb
            .storage
            .from("noticias")
            .upload(
                path,
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
        } = sb
            .storage
            .from("noticias")
            .getPublicUrl(path);


        return data.publicUrl;

    }


    /* =====================================================
       ADMIN
    ====================================================== */

    async function renderAdmin() {

        const session =
            await getSession();


        if (!session) {

            renderLogin();

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
                                ${escapeHtml(
                                    session.user.email
                                )}

                            </div>

                        </div>


                        <button
                            class="btn btn-danger"
                            id="logoutBtn"
                        >
                            Cerrar sesión
                        </button>

                    </div>


                    <div id="adminMessage"></div>


                    <div
                        id="adminContent"
                        class="loading-screen"
                    >

                        <div class="loader"></div>

                        <p>
                            Cargando panel...
                        </p>

                    </div>

                </div>

            </section>

        `;


        document
            .getElementById("logoutBtn")
            .addEventListener(
                "click",
                async () => {

                    await sb.auth.signOut();

                    window.location.hash = "#/";

                }
            );


        try {

            state.adminNews =
                await getAdminNews();


            state.adminPrograms =
                await getAdminProgramming();


            renderAdminContent();

        } catch (error) {

            document.getElementById(
                "adminContent"
            ).innerHTML = `

                <div class="notice error">

                    <strong>
                        Error al cargar el panel.
                    </strong>

                    <br>

                    ${escapeHtml(
                        getErrorMessage(error)
                    )}

                </div>

            `;

        }

    }


    function renderAdminContent() {

        const content =
            document.getElementById(
                "adminContent"
            );


        content.className =
            "admin-grid";


        content.innerHTML = `

            <!-- =================================================
                 NOTICIAS
            ================================================== -->

            <div>

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
                                class="form-control"
                                id="newsTitle"
                                required
                                placeholder="Título de la noticia"
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Categoría
                            </label>

                            <select
                                class="form-control"
                                id="newsCategory"
                                required
                            >

                                ${CATEGORIES.map(
                                    cat => `
                                        <option
                                            value="${cat[0]}"
                                        >
                                            ${cat[1]}
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
                                class="form-control"
                                id="newsSummary"
                                placeholder="Breve resumen..."
                            ></textarea>

                        </div>


                        <div class="form-group">

                            <label>
                                Contenido
                            </label>

                            <textarea
                                class="form-control"
                                id="newsContent"
                                required
                                placeholder="Contenido completo de la noticia..."
                            ></textarea>

                        </div>


                        <div class="form-group">

                            <label>
                                Imagen
                            </label>

                            <input
                                class="form-control"
                                type="file"
                                id="newsImage"
                                accept="image/*"
                            >

                        </div>


                        <div class="form-group">

                            <label>

                                <input
                                    type="checkbox"
                                    id="newsPublished"
                                    checked
                                >

                                Publicar inmediatamente

                            </label>

                        </div>


                        <div class="form-actions">

                            <button
                                class="btn btn-red"
                                type="submit"
                            >
                                📰 Publicar noticia
                            </button>


                            <button
                                class="btn btn-light"
                                type="button"
                                id="cancelNewsEdit"
                                style="display:none"
                            >
                                Cancelar edición
                            </button>

                        </div>

                    </form>

                </div>


                <div class="admin-card">

                    <h2>
                        Noticias publicadas
                    </h2>


                    <div class="admin-list">

                        ${
                            state.adminNews.length
                            ?
                            state.adminNews
                                .map(
                                    adminNewsItem
                                )
                                .join("")
                            :
                            `
                                <div class="empty-state">
                                    No hay noticias.
                                </div>
                            `
                        }

                    </div>

                </div>

            </div>


            <!-- =================================================
                 PROGRAMACIÓN
            ================================================== -->

            <div>

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
                                class="form-control"
                                id="programDay"
                                required
                            >

                                ${DAYS.map(
                                    day => `
                                        <option
                                            value="${day[0]}"
                                        >
                                            ${day[1]}
                                        </option>
                                    `
                                ).join("")}

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                Hora
                            </label>

                            <input
                                class="form-control"
                                type="time"
                                id="programTime"
                                required
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Programa
                            </label>

                            <input
                                class="form-control"
                                id="programName"
                                required
                                placeholder="Ejemplo: Noticias Enlace"
                            >

                        </div>


                        <div class="form-group">

                            <label>
                                Descripción
                            </label>

                            <textarea
                                class="form-control"
                                id="programDescription"
                                placeholder="Descripción del programa..."
                            ></textarea>

                        </div>


                        <div class="form-group">

                            <label>
                                Imagen opcional
                            </label>

                            <input
                                class="form-control"
                                type="file"
                                id="programImage"
                                accept="image/*"
                            >

                        </div>


                        <div class="form-group">

                            <label>

                                <input
                                    type="checkbox"
                                    id="programActive"
                                    checked
                                >

                                Mostrar en programación

                            </label>

                        </div>


                        <div class="form-actions">

                            <button
                                class="btn btn-primary"
                                type="submit"
                            >
                                💾 Guardar programa
                            </button>


                            <button
                                class="btn btn-light"
                                type="button"
                                id="cancelProgramEdit"
                                style="display:none"
                            >
                                Cancelar edición
                            </button>

                        </div>

                    </form>

                </div>


                <div class="admin-card">

                    <h2>
                        Programación registrada
                    </h2>


                    <div class="admin-list">

                        ${
                            state.adminPrograms.length
                            ?
                            state.adminPrograms
                                .map(
                                    adminProgramItem
                                )
                                .join("")
                            :
                            `
                                <div class="empty-state">
                                    No hay programación.
                                </div>
                            `
                        }

                    </div>

                </div>

            </div>

        `;


        bindAdminForms();

    }


    /* =====================================================
       ITEM ADMIN NOTICIA
    ====================================================== */

    function adminNewsItem(item) {

        return `

            <div class="admin-item">

                ${
                    item.imagen_url
                    ?
                    `<img
                        class="admin-item-image"
                        src="${escapeHtml(
                            item.imagen_url
                        )}"
                        alt=""
                    >`
                    :
                    `<div
                        class="admin-item-image"
                        style="background:${imageFallback()}"
                    ></div>`
                }


                <div class="admin-item-main">

                    <div class="admin-item-title">

                        ${escapeHtml(
                            item.titulo
                        )}

                    </div>


                    <div class="admin-item-meta">

                        ${escapeHtml(
                            categoryName(
                                item.categoria
                            )
                        )}

                        ·

                        ${
                            item.publicada
                            ? "Publicada"
                            : "Borrador"
                        }

                    </div>

                </div>


                <div class="admin-item-actions">

                    <button
                        class="btn btn-small btn-light"
                        data-edit-news="${item.id}"
                    >
                        Editar
                    </button>


                    <button
                        class="btn btn-small btn-yellow"
                        data-toggle-news="${item.id}"
                    >
                        ${
                            item.publicada
                            ? "Ocultar"
                            : "Publicar"
                        }
                    </button>


                    <button
                        class="btn btn-small btn-danger"
                        data-delete-news="${item.id}"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        `;

    }


    /* =====================================================
       ITEM ADMIN PROGRAMACIÓN
    ====================================================== */

    function adminProgramItem(item) {

        return `

            <div class="admin-item">

                <div
                    class="admin-item-main"
                >

                    <div
                        class="admin-item-title"
                    >

                        ${escapeHtml(
                            dayName(item.dia)
                        )}

                        ·

                        ${escapeHtml(
                            formatTime(item.hora)
                        )}

                        —

                        ${escapeHtml(
                            item.programa
                        )}

                    </div>


                    <div
                        class="admin-item-meta"
                    >

                        ${
                            item.activo
                            ? "Visible en la web"
                            : "Oculto"
                        }

                        ${
                            item.descripcion
                            ?
                            ` · ${escapeHtml(
                                item.descripcion
                            )}`
                            :
                            ""
                        }

                    </div>

                </div>


                <div class="admin-item-actions">

                    <button
                        class="btn btn-small btn-light"
                        data-edit-program="${item.id}"
                    >
                        Editar
                    </button>


                    <button
                        class="btn btn-small btn-yellow"
                        data-toggle-program="${item.id}"
                    >
                        ${
                            item.activo
                            ? "Ocultar"
                            : "Mostrar"
                        }
                    </button>


                    <button
                        class="btn btn-small btn-danger"
                        data-delete-program="${item.id}"
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        `;

    }


    /* =====================================================
       FORMULARIOS ADMIN
    ====================================================== */

    function bindAdminForms() {

        document
            .getElementById("newsForm")
            .addEventListener(
                "submit",
                handleNewsSubmit
            );


        document
            .getElementById("programForm")
            .addEventListener(
                "submit",
                handleProgramSubmit
            );


        document
            .getElementById("cancelNewsEdit")
            .addEventListener(
                "click",
                resetNewsForm
            );


        document
            .getElementById("cancelProgramEdit")
            .addEventListener(
                "click",
                resetProgramForm
            );


        document
            .querySelectorAll(
                "[data-edit-news]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        editNews(
                            button.dataset.editNews
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-delete-news]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteNews(
                            button.dataset.deleteNews
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-toggle-news]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleNews(
                            button.dataset.toggleNews
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-edit-program]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        editProgram(
                            button.dataset.editProgram
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-delete-program]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteProgram(
                            button.dataset.deleteProgram
                        );

                    }
                );

            });


        document
            .querySelectorAll(
                "[data-toggle-program]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        toggleProgram(
                            button.dataset.toggleProgram
                        );

                    }
                );

            });

    }


    /* =====================================================
       GUARDAR NOTICIA
    ====================================================== */

    async function handleNewsSubmit(event) {

        event.preventDefault();


        const message =
            document.getElementById(
                "adminMessage"
            );


        message.innerHTML =
            showMessage(
                "info",
                "Guardando noticia..."
            );


        try {

            const id =
                document.getElementById(
                    "newsId"
                ).value;


            const titulo =
                document.getElementById(
                    "newsTitle"
                ).value.trim();


            const categoria =
                document.getElementById(
                    "newsCategory"
                ).value;


            const resumen =
                document.getElementById(
                    "newsSummary"
                ).value.trim();


            const contenido =
                document.getElementById(
                    "newsContent"
                ).value.trim();


            const publicada =
                document.getElementById(
                    "newsPublished"
                ).checked;


            const file =
                document.getElementById(
                    "newsImage"
                ).files[0];


            const payload = {

                titulo,

                categoria,

                resumen,

                contenido,

                publicada

            };


            if (file) {

                payload.imagen_url =
                    await uploadImage(file);

            }


            let result;


            if (id) {

                result =
                    await sb
                        .from("noticias")
                        .update(payload)
                        .eq("id", id);

            } else {

                result =
                    await sb
                        .from("noticias")
                        .insert({

                            ...payload,

                            imagen_url:
                                payload.imagen_url ||
                                null

                        });

            }


            if (result.error) {
                throw result.error;
            }


            message.innerHTML =
                showMessage(
                    "success",
                    id
                        ? "Noticia actualizada correctamente."
                        : "Noticia publicada correctamente."
                );


            state.editingNewsId = null;


            state.adminNews =
                await getAdminNews();


            resetNewsForm();


            renderAdminContent();

        } catch (error) {

            console.error(error);

            message.innerHTML =
                showMessage(
                    "error",
                    getErrorMessage(error)
                );

        }

    }


    /* =====================================================
       EDITAR NOTICIA
    ====================================================== */

    function editNews(id) {

        const item =
            state.adminNews.find(
                news =>
                    String(news.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        document.getElementById(
            "newsId"
        ).value = item.id;


        document.getElementById(
            "newsTitle"
        ).value =
            item.titulo || "";


        document.getElementById(
            "newsCategory"
        ).value =
            normalizeCategory(
                item.categoria
            );


        document.getElementById(
            "newsSummary"
        ).value =
            item.resumen || "";


        document.getElementById(
            "newsContent"
        ).value =
            item.contenido || "";


        document.getElementById(
            "newsPublished"
        ).checked =
            item.publicada !== false;


        document.getElementById(
            "cancelNewsEdit"
        ).style.display =
            "inline-flex";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    function resetNewsForm() {

        const form =
            document.getElementById(
                "newsForm"
            );


        if (!form) {
            return;
        }


        form.reset();


        document.getElementById(
            "newsId"
        ).value = "";


        document.getElementById(
            "newsPublished"
        ).checked = true;


        document.getElementById(
            "cancelNewsEdit"
        ).style.display =
            "none";

    }


    /* =====================================================
       ELIMINAR NOTICIA
    ====================================================== */

    async function deleteNews(id) {

        if (
            !confirm(
                "¿Seguro que deseas eliminar esta noticia?"
            )
        ) {
            return;
        }


        try {

            const {
                error
            } = await sb
                .from("noticias")
                .delete()
                .eq("id", id);


            if (error) {
                throw error;
            }


            state.adminNews =
                await getAdminNews();


            renderAdminContent();

        } catch (error) {

            alert(
                getErrorMessage(error)
            );

        }

    }


    /* =====================================================
       PUBLICAR / OCULTAR NOTICIA
    ====================================================== */

    async function toggleNews(id) {

        const item =
            state.adminNews.find(
                news =>
                    String(news.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        try {

            const {
                error
            } = await sb
                .from("noticias")
                .update({
                    publicada:
                        !item.publicada
                })
                .eq("id", id);


            if (error) {
                throw error;
            }


            state.adminNews =
                await getAdminNews();


            renderAdminContent();

        } catch (error) {

            alert(
                getErrorMessage(error)
            );

        }

    }


    /* =====================================================
       GUARDAR PROGRAMACIÓN
    ====================================================== */

    async function handleProgramSubmit(event) {

        event.preventDefault();


        const message =
            document.getElementById(
                "adminMessage"
            );


        message.innerHTML =
            showMessage(
                "info",
                "Guardando programación..."
            );


        try {

            const id =
                document.getElementById(
                    "programId"
                ).value;


            const dia =
                document.getElementById(
                    "programDay"
                ).value;


            const hora =
                document.getElementById(
                    "programTime"
                ).value;


            const programa =
                document.getElementById(
                    "programName"
                ).value.trim();


            const descripcion =
                document.getElementById(
                    "programDescription"
                ).value.trim();


            const activo =
                document.getElementById(
                    "programActive"
                ).checked;


            const file =
                document.getElementById(
                    "programImage"
                ).files[0];


            const payload = {

                dia,

                hora,

                programa,

                descripcion,

                activo

            };


            if (file) {

                payload.imagen_url =
                    await uploadImage(file);

            }


            let result;


            if (id) {

                result =
                    await sb
                        .from("programacion")
                        .update(payload)
                        .eq("id", id);

            } else {

                result =
                    await sb
                        .from("programacion")
                        .insert({

                            ...payload,

                            imagen_url:
                                payload.imagen_url ||
                                null

                        });

            }


            if (result.error) {
                throw result.error;
            }


            state.adminPrograms =
                await getAdminProgramming();


            resetProgramForm();


            renderAdminContent();


            message.innerHTML =
                showMessage(
                    "success",
                    id
                        ? "Programa actualizado correctamente."
                        : "Programa agregado correctamente."
                );

        } catch (error) {

            console.error(error);

            message.innerHTML =
                showMessage(
                    "error",
                    getErrorMessage(error)
                );

        }

    }


    /* =====================================================
       EDITAR PROGRAMACIÓN
    ====================================================== */

    function editProgram(id) {

        const item =
            state.adminPrograms.find(
                program =>
                    String(program.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        document.getElementById(
            "programId"
        ).value = item.id;


        document.getElementById(
            "programDay"
        ).value =
            normalizeCategory(
                item.dia
            );


        document.getElementById(
            "programTime"
        ).value =
            String(item.hora || "")
                .substring(0, 5);


        document.getElementById(
            "programName"
        ).value =
            item.programa || "";


        document.getElementById(
            "programDescription"
        ).value =
            item.descripcion || "";


        document.getElementById(
            "programActive"
        ).checked =
            item.activo !== false;


        document.getElementById(
            "cancelProgramEdit"
        ).style.display =
            "inline-flex";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    function resetProgramForm() {

        const form =
            document.getElementById(
                "programForm"
            );


        if (!form) {
            return;
        }


        form.reset();


        document.getElementById(
            "programId"
        ).value = "";


        document.getElementById(
            "programActive"
        ).checked = true;


        document.getElementById(
            "cancelProgramEdit"
        ).style.display =
            "none";

    }


    /* =====================================================
       ELIMINAR PROGRAMACIÓN
    ====================================================== */

    async function deleteProgram(id) {

        if (
            !confirm(
                "¿Seguro que deseas eliminar este programa?"
            )
        ) {
            return;
        }


        try {

            const {
                error
            } = await sb
                .from("programacion")
                .delete()
                .eq("id", id);


            if (error) {
                throw error;
            }


            state.adminPrograms =
                await getAdminProgramming();


            renderAdminContent();

        } catch (error) {

            alert(
                getErrorMessage(error)
            );

        }

    }


    /* =====================================================
       ACTIVAR / DESACTIVAR PROGRAMACIÓN
    ====================================================== */

    async function toggleProgram(id) {

        const item =
            state.adminPrograms.find(
                program =>
                    String(program.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        try {

            const {
                error
            } = await sb
                .from("programacion")
                .update({
                    activo:
                        !item.activo
                })
                .eq("id", id);


            if (error) {
                throw error;
            }


            state.adminPrograms =
                await getAdminProgramming();


            renderAdminContent();

        } catch (error) {

            alert(
                getErrorMessage(error)
            );

        }

    }


    /* =====================================================
       ROUTER
    ====================================================== */

    async function router() {

        const hash =
            window.location.hash || "#/";


        const route =
            hash
                .replace(/^#/, "")
                .split("?")[0];


        const parts =
            route
                .split("/")
                .filter(Boolean);


        try {

            if (!parts.length) {

                await renderHome();

                return;

            }


            if (parts[0] === "login") {

                const session =
                    await getSession();


                if (session) {

                    window.location.hash =
                        "#/admin";

                    return;

                }


                renderLogin();

                return;

            }


            if (parts[0] === "admin") {

                await renderAdmin();

                return;

            }


            if (parts[0] === "en-vivo") {

                await renderLive();

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
                    decodeURIComponent(
                        parts[1]
                    )
                );

                return;

            }


            app.innerHTML = `

                <div class="notice error">

                    La página que buscas no existe.

                </div>

            `;

        } catch (error) {

            console.error(error);

            app.innerHTML = `

                <div class="notice error">

                    <strong>
                        Ocurrió un error al cargar la página.
                    </strong>

                    <br><br>

                    ${escapeHtml(
                        getErrorMessage(error)
                    )}

                </div>

            `;

        }


        updateAuthButton();

    }


    /* =====================================================
       INICIO
    ====================================================== */

    window.addEventListener(
        "hashchange",
        router
    );


    document.addEventListener(
        "DOMContentLoaded",
        async () => {

            await updateAuthButton();

            await router();

        }
    );


})();
