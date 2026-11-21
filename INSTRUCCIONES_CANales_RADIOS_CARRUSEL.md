# Activar canales, emisoras y carrusel en la web

Esta versión corrige dos omisiones del ZIP anterior: la portada no pintaba los registros administrados y el SQL usaba un nombre de tabla de radio distinto al que utiliza el panel.

## Pasos
1. En Supabase abre SQL Editor y ejecuta `supabase_canales_radios_carrusel.sql`.
2. Publica en Vercel el contenido de esta carpeta, sustituyendo los archivos anteriores del mismo proyecto.
3. Entra al panel administrativo e inicia sesión.
4. Agrega canales en **Canales de televisión**, radios en **Emisoras de radio** y banners en **Carrusel principal**.
5. Marca **Mostrar** / **Mostrar en carrusel** y guarda. Los registros activos aparecen en la portada después de recargarla.

## Tablas que usa esta versión
- `canales_tv`
- `emisoras_radio`
- `carrusel_inicio`

Los logos e imágenes se introducen como URLs públicas. Los canales se muestran con un enlace de reproducción; las radios se muestran con un reproductor de audio HTML. La compatibilidad de cada URL de streaming depende del formato que entregue el proveedor.

Nota: este ZIP actualiza la web. No modifica ni recompila el APK Android.
