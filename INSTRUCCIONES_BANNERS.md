# Banners automáticos de Gamarra TV

1. En Supabase abre SQL Editor y ejecuta `ACTUALIZAR_DURACION_BANNERS.sql`.
2. Publica los archivos actualizados del ZIP en el repositorio conectado a Vercel.
3. Entra a `https://gamarra-tv.vercel.app/#/admin`.
4. En **Carrusel principal**, agrega una imagen, título y enlace opcional.
5. Define la duración en pantalla entre 2 y 120 segundos y guarda.

Los banners activos aparecen en la portada y rotan automáticamente. Cada banner utiliza su propia duración. También hay controles manuales y puntos indicadores. La tabla utilizada es `public.carrusel_inicio`.
