/* =====================================================
   GAMARRA TV
   APP PRINCIPAL
===================================================== */


/* =====================================================
   CONFIGURACIÓN SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://hjexlltqhjdm1wxgptpj.supabase.co";

/*
   sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsF.

   NO pongas la SECRET KEY.
*/

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsF";


const supabaseClient =
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


/* =====================================================
   VARIABLES
===================================================== */

const app =
    document.getElementById("app");

const menuToggle =
    document.getElementById("menuToggle");

const mainNav =
    document.getElementById("mainNav");


/* =====================================================
   MENÚ
===================================================== */

if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            mainNav.classList.toggle("open");

        }
    );

}


/* =====================================================
   UTILIDADES
===================================================== */

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


function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date)
        .toLocaleDateString(
            "es-CO",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


function imageOrDefault(url) {

    return url ||
        "https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png";

}


function showError(message) {

    app.innerHTML = `
        <div class="container section">
            <div class="alert alert-error">
                ${escapeHTML(message)}
            </div>
        </div>
    `;

}


function showLoading() {

    app.innerHTML = `
        <div class="loading">

            <div class="spinner"></div>

            <p>
                Cargando Gamarra TV...
            </p>

        </div>
    `;

}


/* =====================================================
   OBTENER NOTICIAS
===================================================== */

async function getNoticias(limit = 30) {

    const {
        data,
        error
    } = await supabaseClient
        .from("noticias")
        .select("*")
        .eq("publicada", true)
        .order(
            "fecha_publicacion",
            {
                ascending: false
            }
        )
        .limit(limit);

    if (error) {

        console.error(error);

        throw new Error(
            "No fue posible cargar las noticias: " +
            error.message
        );

    }

    return data || [];
}


/* =====================================================
   INICIO
===================================================== */

async function renderHome() {

    showLoading();

    try {

        const noticias =
            await getNoticias(30);

        const programacion =
            await getProgramacion();

        if (!noticias.length) {

            app.innerHTML = `
                <section class="section">

                    <div class="container">

                        <div class="alert alert-success">

                            Todavía no hay noticias
                            publicadas.

                        </div>

                    </div>

                </section>
            `;

            return;
        }


        const principal =
            noticias[0];

        const restantes =
            noticias.slice(1);


        app.innerHTML = `

            <!-- HERO -->

            <section class="hero">

                <div class="container hero-grid">

                    <article
                        class="hero-main"
                        onclick="location.hash='#/noticia/${principal.id}'"
                        style="cursor:pointer">

                        <img
                            src="${escapeHTML(
                                imageOrDefault(
                                    principal.imagen_url
                                )
                            )}"
                            alt="${escapeHTML(
                                principal.titulo
                            )}">

                        <div class="hero-overlay">

                            <span class="hero-category">

                                ${escapeHTML(
                                    principal.categoria ||
                                    "Noticias"
                                )}

                            </span>

                            <h1>

                                ${escapeHTML(
                                    principal.titulo
                                )}

                            </h1>

                        </div>

                    </article>


                    <aside class="program-card">

                        <h2>
                            📺 Programación
                        </h2>

                        ${renderProgramacion(
                            programacion
                        )}

                    </aside>

                </div>

            </section>


            <!-- ÚLTIMAS NOTICIAS -->

            <section class="section">

                <div class="container">

                    <div class="section-title">

                        <h2>
                            Últimas noticias
                        </h2>

                    </div>


                    <div class="news-carousel">

                        <div class="carousel-track">

                            ${renderCarousel(
                                noticias
                            )}

                        </div>

                    </div>

                </div>

            </section>


            <!-- NOTICIAS -->

            <section class="section">

                <div class="container">

                    <div class="section-title">

                        <h2>
                            Noticias
                        </h2>

                    </div>


                    <div class="news-grid">

                        ${renderNewsGrid(
                            restantes
                        )}

                    </div>

                </div>

            </section>
        `;

    } catch (error) {

        showError(error.message);

    }

}


/* =====================================================
   CARRUSEL
===================================================== */

function renderCarousel(noticias) {

    return noticias
        .map(noticia => `

            <article
                class="carousel-card"
                onclick="location.hash='#/noticia/${noticia.id}'">

                <img
                    src="${escapeHTML(
                        imageOrDefault(
                            noticia.imagen_url
                        )
                    )}"
                    alt="${escapeHTML(
                        noticia.titulo
                    )}">

                <div class="carousel-body">

                    <span class="carousel-category">

                        ${escapeHTML(
                            noticia.categoria ||
                            "Noticias"
                        )}

                    </span>

                    <h3>

                        ${escapeHTML(
                            noticia.titulo
                        )}

                    </h3>

                </div>

            </article>

        `)
        .join("");

}


/* =====================================================
   GRID NOTICIAS
===================================================== */

function renderNewsGrid(noticias) {

    if (!noticias.length) {

        return `
            <div class="alert alert-success">

                No hay más noticias disponibles.

            </div>
        `;

    }

    return noticias
        .map(noticia => `

            <article
                class="news-card"
                onclick="location.hash='#/noticia/${noticia.id}'"
                style="cursor:pointer">

                <img
                    src="${escapeHTML(
                        imageOrDefault(
                            noticia.imagen_url
                        )
                    )}"
                    alt="${escapeHTML(
                        noticia.titulo
                    )}">

                <div class="news-card-body">

                    <span class="news-card-category">

                        ${escapeHTML(
                            noticia.categoria ||
                            "Noticias"
                        )}

                    </span>

                    <h3>

                        ${escapeHTML(
                            noticia.titulo
                        )}

                    </h3>

                    ${
                        noticia.resumen
                        ?
                        `<p>
                            ${escapeHTML(
                                noticia.resumen
                            )}
                        </p>`
                        :
                        ""
                    }

                </div>

            </article>

        `)
        .join("");

}


/* =====================================================
   NOTICIA INDIVIDUAL
===================================================== */

async function renderNoticia(id) {

    showLoading();

    const {
        data,
        error
    } = await supabaseClient
        .from("noticias")
        .select("*")
        .eq("id", id)
        .eq("publicada", true)
        .single();

    if (error || !data) {

        showError(
            "No encontramos esta noticia."
        );

        return;
    }


    app.innerHTML = `

        <article class="article">

            <div class="article-container">

                <div class="article-category">

                    ${escapeHTML(
                        data.categoria ||
                        "Noticias"
                    )}

                </div>


                <h1>

                    ${escapeHTML(
                        data.titulo
                    )}

                </h1>


                <div class="article-date">

                    Publicado el
                    ${formatDate(
                        data.fecha_publicacion
                    )}

                </div>


                <img
                    class="article-image"
                    src="${escapeHTML(
                        imageOrDefault(
                            data.imagen_url
                        )
                    )}"
                    alt="${escapeHTML(
                        data.titulo
                    )}">


                ${
                    data.resumen
                    ?
                    `<p class="article-content">
                        <strong>
                            ${escapeHTML(
                                data.resumen
                            )}
                        </strong>
                    </p>`
                    :
                    ""
                }


                <div class="article-content">

                    ${escapeHTML(
                        data.contenido ||
                        ""
                    )}

                </div>

            </div>

        </article>

    `;

}


/* =====================================================
   CATEGORÍA
===================================================== */

async function renderCategoria(categoria) {

    showLoading();

    const {
        data,
        error
    } = await supabaseClient
        .from("noticias")
        .select("*")
        .eq("publicada", true)
        .eq("categoria", categoria)
        .order(
            "fecha_publicacion",
            {
                ascending: false
            }
        );

    if (error) {

        showError(error.message);

        return;
    }


    app.innerHTML = `

        <section class="section">

            <div class="container">

                <div class="section-title">

                    <h2>
                        ${escapeHTML(
                            categoria
                        )}
                    </h2>

                </div>


                ${
                    data.length
                    ?
                    `<div class="news-grid">
                        ${renderNewsGrid(data)}
                    </div>`
                    :
                    `<div class="alert alert-success">
                        No hay noticias en esta categoría.
                    </div>`
                }

            </div>

        </section>

    `;

}


/* =====================================================
   PROGRAMACIÓN
===================================================== */

async function getProgramacion() {

    const {
        data,
        error
    } = await supabaseClient
        .from("programacion")
        .select("*")
        .eq("activo", true)
        .order("hora", {
            ascending: true
        })
        .limit(8);

    if (error) {

        console.warn(
            "Error programación:",
            error.message
        );

        return [];
    }

    return data || [];
}


function renderProgramacion(programas) {

    if (!programas.length) {

        return `
            <p style="color:#66717f">
                Próximamente encontrarás
                nuestra programación.
            </p>
        `;

    }


    return programas
        .map(programa => `

            <div class="program-item">

                <div class="program-time">

                    ${escapeHTML(
                        programa.hora
                    )}

                </div>

                <div class="program-name">

                    ${escapeHTML(
                        programa.programa
                    )}

                </div>

            </div>

        `)
        .join("");

}


/* =====================================================
   EN VIVO
===================================================== */

function renderLive() {

    app.innerHTML = `

        <section class="live-page">

            <div class="container">

                <div class="section-title">

                    <h2>
                        🔴 Gamarra TV En Vivo
                    </h2>

                </div>


                <div class="live-player">

                    <div>

                        <h2>
                            Gamarra TV
                        </h2>

                        <p>
                            Señal en vivo
                        </p>

                    </div>

                </div>

            </div>

        </section>

    `;

}


/* =====================================================
   LOGIN
===================================================== */

function renderLogin() {

    app.innerHTML = `

        <section class="auth-page">

            <div class="auth-box">

                <img
                    class="auth-logo"
                    src="https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png"
                    alt="Gamarra TV">


                <h1>
                    Iniciar sesión
                </h1>


                <div id="loginMessage"></div>


                <form id="loginForm">

                    <div class="form-group">

                        <label>
                            Correo electrónico
                        </label>

                        <input
                            id="loginEmail"
                            class="form-control"
                            type="email"
                            required
                            autocomplete="email">

                    </div>


                    <div class="form-group">

                        <label>
                            Contraseña
                        </label>

                        <input
                            id="loginPassword"
                            class="form-control"
                            type="password"
                            required
                            autocomplete="current-password">

                    </div>


                    <button
                        class="btn btn-primary"
                        type="submit"
                        style="width:100%">

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
            login
        );

}


async function login(event) {

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


    message.innerHTML = "";


    const {
        error
    } = await supabaseClient.auth
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


    location.hash = "#/admin";

}


/* =====================================================
   ADMIN
===================================================== */

async function renderAdmin() {

    const {
        data: {
            user
        }
    } = await supabaseClient.auth
        .getUser();


    if (!user) {

        location.hash = "#/login";

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

                        <p>
                            ${escapeHTML(
                                user.email
                            )}
                        </p>

                    </div>


                    <button
                        class="btn btn-danger"
                        id="logoutButton">

                        Cerrar sesión

                    </button>

                </div>


                <div class="admin-tabs">

                    <button
                        class="admin-tab active"
                        id="tabNoticias">

                        📰 Noticias

                    </button>

                    <button
                        class="admin-tab"
                        id="tabProgramacion">

                        📺 Programación

                    </button>

                </div>


                <div id="adminContent"></div>

            </div>

        </section>

    `;


    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            async () => {

                await supabaseClient.auth.signOut();

                location.hash = "#/";

            }
        );


    document
        .getElementById("tabNoticias")
        .addEventListener(
            "click",
            () => {

                activateTab("noticias");

            }
        );


    document
        .getElementById("tabProgramacion")
        .addEventListener(
            "click",
            () => {

                activateTab("programacion");

            }
        );


    await renderAdminNoticias();

}


function activateTab(tab) {

    const noticiasTab =
        document.getElementById(
            "tabNoticias"
        );

    const programacionTab =
        document.getElementById(
            "tabProgramacion"
        );


    noticiasTab.classList.remove(
        "active"
    );

    programacionTab.classList.remove(
        "active"
    );


    if (tab === "noticias") {

        noticiasTab.classList.add(
            "active"
        );

        renderAdminNoticias();

    } else {

        programacionTab.classList.add(
            "active"
        );

        renderAdminProgramacion();

    }

}


/* =====================================================
   ADMIN NOTICIAS
===================================================== */

async function renderAdminNoticias() {

    const content =
        document.getElementById(
            "adminContent"
        );


    content.innerHTML = `

        <div class="admin-panel">

            <h2>
                Publicar noticia
            </h2>


            <div id="newsAdminMessage"></div>


            <form id="newsForm">

                <div class="form-group">

                    <label>
                        Título
                    </label>

                    <input
                        id="newsTitulo"
                        class="form-control"
                        required>

                </div>


                <div class="form-group">

                    <label>
                        Categoría
                    </label>

                    <select
                        id="newsCategoria"
                        class="form-control"
                        required>

                        <option value="">
                            Selecciona una categoría
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
                        Resumen
                    </label>

                    <textarea
                        id="newsResumen"
                        class="form-control"></textarea>

                </div>


                <div class="form-group">

                    <label>
                        Contenido
                    </label>

                    <textarea
                        id="newsContenido"
                        class="form-control"
                        required></textarea>

                </div>


                <div class="form-group">

                    <label>
                        Imagen
                    </label>

                    <input
                        id="newsImagen"
                        class="form-control"
                        type="file"
                        accept="image/*">

                </div>


                <button
                    class="btn btn-primary"
                    type="submit">

                    📰 Publicar noticia

                </button>

            </form>

        </div>


        <div class="admin-panel">

            <h2>
                Noticias publicadas
            </h2>

            <div
                id="adminNewsList"
                class="admin-list">

                Cargando...

            </div>

        </div>

    `;


    document
        .getElementById("newsForm")
        .addEventListener(
            "submit",
            publishNews
        );


    await loadAdminNews();

}


/* =====================================================
   PUBLICAR NOTICIA
===================================================== */

async function publishNews(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "newsAdminMessage"
        );


    message.innerHTML = `
        <div class="alert alert-success">
            Publicando noticia...
        </div>
    `;


    const titulo =
        document.getElementById(
            "newsTitulo"
        ).value.trim();


    const categoria =
        document.getElementById(
            "newsCategoria"
        ).value;


    const resumen =
        document.getElementById(
            "newsResumen"
        ).value.trim();


    const contenido =
        document.getElementById(
            "newsContenido"
        ).value.trim();


    const file =
        document.getElementById(
            "newsImagen"
        ).files[0];


    let imagen_url = null;


    /* -------------------------------------------------
       SUBIR IMAGEN
    ------------------------------------------------- */

    if (file) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const filename =
            `${crypto.randomUUID()}.${extension}`;


        const {
            error: uploadError
        } = await supabaseClient
            .storage
            .from("noticias")
            .upload(
                filename,
                file,
                {
                    upsert: false
                }
            );


        if (uploadError) {

            message.innerHTML = `
                <div class="alert alert-error">
                    Error al subir la imagen:
                    ${escapeHTML(
                        uploadError.message
                    )}
                </div>
            `;

            return;
        }


        const {
            data: publicData
        } = supabaseClient
            .storage
            .from("noticias")
            .getPublicUrl(
                filename
            );


        imagen_url =
            publicData.publicUrl;

    }


    /* -------------------------------------------------
       GUARDAR NOTICIA
    ------------------------------------------------- */

    const {
        error
    } = await supabaseClient
        .from("noticias")
        .insert({
            titulo,
            resumen,
            contenido,
            categoria,
            imagen_url,
            publicada: true,
            fecha_publicacion: new Date().toISOString()
        });


    if (error) {

        console.error(error);

        message.innerHTML = `
            <div class="alert alert-error">

                No se pudo publicar la noticia:

                ${escapeHTML(
                    error.message
                )}

            </div>
        `;

        return;
    }


    message.innerHTML = `
        <div class="alert alert-success">

            ✅ Noticia publicada correctamente.

        </div>
    `;


    document
        .getElementById(
            "newsForm"
        )
        .reset();


    await loadAdminNews();

}


/* =====================================================
   LISTA ADMIN NOTICIAS
===================================================== */

async function loadAdminNews() {

    const list =
        document.getElementById(
            "adminNewsList"
        );


    if (!list) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("noticias")
        .select("*")
        .order(
            "fecha_publicacion",
            {
                ascending: false
            }
        );


    if (error) {

        list.innerHTML = `
            <div class="alert alert-error">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

        return;
    }


    if (!data.length) {

        list.innerHTML = `
            <div class="alert alert-success">
                No hay noticias todavía.
            </div>
        `;

        return;
    }


    list.innerHTML =
        data.map(noticia => `

            <div class="admin-item">

                <div class="admin-item-info">

                    <strong>
                        ${escapeHTML(
                            noticia.titulo
                        )}
                    </strong>

                    <small>

                        ${escapeHTML(
                            noticia.categoria ||
                            "Sin categoría"
                        )}

                        ·

                        ${formatDate(
                            noticia.fecha_publicacion
                        )}

                    </small>

                </div>


                <div class="admin-actions">

                    <button
                        class="btn btn-danger"
                        onclick="deleteNews('${noticia.id}')">

                        Eliminar

                    </button>

                </div>

            </div>

        `)
        .join("");

}


/* =====================================================
   ELIMINAR NOTICIA
===================================================== */

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
    } = await supabaseClient
        .from("noticias")
        .delete()
        .eq("id", id);


    if (error) {

        alert(
            "No se pudo eliminar: " +
            error.message
        );

        return;
    }


    await loadAdminNews();

}


/* =====================================================
   ADMIN PROGRAMACION
===================================================== */

async function renderAdminProgramacion() {

    const content =
        document.getElementById(
            "adminContent"
        );


    content.innerHTML = `

        <div class="admin-panel">

            <h2>
                Agregar programa
            </h2>


            <div id="programMessage"></div>


            <form id="programForm">

                <div class="form-group">

                    <label>
                        Día
                    </label>

                    <select
                        id="programDia"
                        class="form-control"
                        required>

                        <option value="">
                            Selecciona un día
                        </option>

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
                        Hora
                    </label>

                    <input
                        id="programHora"
                        class="form-control"
                        type="time"
                        required>

                </div>


                <div class="form-group">

                    <label>
                        Nombre del programa
                    </label>

                    <input
                        id="programNombre"
                        class="form-control"
                        required>

                </div>


                <div class="form-group">

                    <label>
                        Descripción
                    </label>

                    <textarea
                        id="programDescripcion"
                        class="form-control"></textarea>

                </div>


                <button
                    class="btn btn-primary"
                    type="submit">

                    📺 Guardar programa

                </button>

            </form>

        </div>


        <div class="admin-panel">

            <h2>
                Programación registrada
            </h2>

            <div
                id="adminProgramList"
                class="admin-list">

                Cargando...

            </div>

        </div>

    `;


    document
        .getElementById("programForm")
        .addEventListener(
            "submit",
            saveProgram
        );


    await loadAdminPrograms();

}


/* =====================================================
   GUARDAR PROGRAMA
===================================================== */

async function saveProgram(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "programMessage"
        );


    const dia =
        document.getElementById(
            "programDia"
        ).value;


    const hora =
        document.getElementById(
            "programHora"
        ).value;


    const programa =
        document.getElementById(
            "programNombre"
        ).value.trim();


    const descripcion =
        document.getElementById(
            "programDescripcion"
        ).value.trim();


    const {
        error
    } = await supabaseClient
        .from("programacion")
        .insert({
            dia,
            hora,
            programa,
            descripcion,
            activo: true
        });


    if (error) {

        console.error(error);

        message.innerHTML = `
            <div class="alert alert-error">

                No se pudo guardar:

                ${escapeHTML(
                    error.message
                )}

            </div>
        `;

        return;
    }


    message.innerHTML = `
        <div class="alert alert-success">

            ✅ Programa agregado correctamente.

        </div>
    `;


    document
        .getElementById(
            "programForm"
        )
        .reset();


    await loadAdminPrograms();

}


/* =====================================================
   LISTA PROGRAMACIÓN
===================================================== */

async function loadAdminPrograms() {

    const list =
        document.getElementById(
            "adminProgramList"
        );


    if (!list) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("programacion")
        .select("*")
        .order(
            "hora",
            {
                ascending: true
            }
        );


    if (error) {

        list.innerHTML = `
            <div class="alert alert-error">

                ${escapeHTML(
                    error.message
                )}

            </div>
        `;

        return;
    }


    if (!data.length) {

        list.innerHTML = `
            <div class="alert alert-success">

                No hay programas registrados.

            </div>
        `;

        return;
    }


    list.innerHTML =
        data.map(programa => `

            <div class="admin-item">

                <div class="admin-item-info">

                    <strong>

                        ${escapeHTML(
                            programa.hora
                        )}

                        ·

                        ${escapeHTML(
                            programa.programa
                        )}

                    </strong>

                    <small>

                        ${escapeHTML(
                            programa.dia
                        )}

                    </small>

                </div>


                <div class="admin-actions">

                    <button
                        class="btn btn-danger"
                        onclick="deleteProgram('${programa.id}')">

                        Eliminar

                    </button>

                </div>

            </div>

        `)
        .join("");

}


/* =====================================================
   ELIMINAR PROGRAMACIÓN
===================================================== */

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
    } = await supabaseClient
        .from("programacion")
        .delete()
        .eq("id", id);


    if (error) {

        alert(
            "No se pudo eliminar: " +
            error.message
        );

        return;
    }


    await loadAdminPrograms();

}


/* =====================================================
   ROUTER
===================================================== */

async function router() {

    const hash =
        location.hash || "#/";


    if (
        hash === "#/" ||
        hash === "#"
    ) {

        await renderHome();

        return;
    }


    if (
        hash === "#/login"
    ) {

        renderLogin();

        return;
    }


    if (
        hash === "#/admin"
    ) {

        await renderAdmin();

        return;
    }


    if (
        hash === "#/en-vivo"
    ) {

        renderLive();

        return;
    }


    if (
        hash.startsWith(
            "#/noticia/"
        )
    ) {

        const id =
            hash.split(
                "#/noticia/"
            )[1];


        await renderNoticia(id);

        return;
    }


    if (
        hash.startsWith(
            "#/categoria/"
        )
    ) {

        const categoria =
            decodeURIComponent(
                hash.split(
                    "#/categoria/"
                )[1]
            );


        await renderCategoria(
            categoria
        );

        return;
    }


    await renderHome();

}


/* =====================================================
   CAMBIO DE RUTA
===================================================== */

window.addEventListener(
    "hashchange",
    router
);


/* =====================================================
   INICIAR
===================================================== */

router();
