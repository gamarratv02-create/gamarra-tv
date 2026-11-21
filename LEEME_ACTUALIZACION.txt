# Gamarra TV — actualización del panel de canales y radios

## Qué contiene
- Conserva el sitio web y el diseño del ZIP original.
- El panel administrativo ya incluye formularios para agregar, editar y eliminar canales de TV y emisoras online.
- El panel ahora muestra un error explícito si Supabase no permite leer las tablas, en lugar de aparentar que no hay registros.
- Incluye un SQL de compatibilidad para que el panel web (`canales_tv`, `emisoras_radio`) escriba en las tablas base que consulta la app (`gtv_channels`, `gtv_radios`).

## Paso 1 — Ejecutar SQL en Supabase
1. Abre el mismo proyecto Supabase que utiliza Gamarra TV.
2. Ve a **SQL Editor → New query**.
3. Abre `supabase_canales_radios_carrusel.sql` desde este ZIP.
4. Copia y ejecuta el contenido.
5. El script asume que `gtv_channels` y `gtv_radios` tienen las columnas `id`, `name`, `logo_url`, `stream_url`, `sort_order`, `is_active` y `created_at`.

**Importante:** si Supabase muestra que falta una columna o que las tablas tienen otros nombres, detente y envíame una captura del error y de la estructura de `gtv_channels` y `gtv_radios`. No ejecutes SQL alternativo a ciegas. Si ya existen tablas antiguas llamadas `canales_tv` o `emisoras_radio`, el script no las reemplaza; mostrará un aviso y esas tablas deberán migrarse con cuidado.

Las vistas heredan las políticas RLS de las tablas base. Asegúrate de que la lectura pública esté limitada a registros activos y que solo los administradores autorizados puedan escribir. No habilites escritura para todos los usuarios autenticados.

## Paso 2 — Publicar la web
1. Descomprime el ZIP.
2. Reemplaza los archivos del repositorio conectado a Vercel por los archivos de `gamarra-tv-main`.
3. Haz commit/push y espera a que Vercel termine el despliegue.
4. Abre `https://gamarra-tv.vercel.app/#/login`, inicia sesión y entra al panel.
5. Baja hasta **Canales de televisión** y **Emisoras de radio**.

## Paso 3 — Probar
1. Agrega un canal con nombre, URL pública del logo y URL de streaming.
2. Marca **Mostrar canal** y guarda.
3. Comprueba que el registro aparece en la lista del panel y en `gtv_channels` de Supabase.
4. Repite con una emisora y verifica `gtv_radios`.
5. Abre o reinicia la app Android para comprobar que lea los nuevos registros.

## Alcance y limitaciones
- Este ZIP actualiza el sitio web; no contiene un APK Android compilado.
- La aparición dentro de Android depende de que la app consulte `gtv_channels` y `gtv_radios` y use los mismos nombres de columnas y filtros de activos.
- Los logos se introducen mediante URL pública; este formulario no sube archivos directamente a Storage.
- No he podido probar la conexión con tu proyecto Supabase real desde aquí. La prueba final debe hacerse en tu proyecto.
