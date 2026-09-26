GAMARRA TV - VERCEL

IMPORTANTE: en app.js cambia SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL" por la Project URL de tu proyecto Supabase. La Publishable Key que enviaste ya está colocada.

Tablas esperadas:
noticias: id, titulo, slug, categoria, resumen, contenido, imagen_url, video_url, created_at
programacion: id, dia_semana INTEGER, hora_inicio, hora_fin, nombre, logo_url, created_at
clientes: id, nombre, logo_url, url, created_at

Días: DOM=0, LUN=1, MAR=2, MIE=3, JUE=4, VIE=5, SAB=6.

La señal OpenCaster está fija y no tiene recarga automática:
https://new.opencaster.com/player/embed?user=gamarratv

Para publicar desde el panel debes crear el usuario en Supabase Authentication y configurar RLS/permisos de las tablas.
