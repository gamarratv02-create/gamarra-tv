# Actualización Gamarra TV

## Cambios incluidos
- Del 27 de noviembre al 31 de diciembre de 2026 se muestra el logo navideño indicado y el texto “FELIZ NAVIDAD Y PRÓSPERO AÑO NUEVO”. Desde el 1 de enero de 2027 vuelve automáticamente el logo original.
- Se retiraron los adornos, partículas y emojis decorativos de la temporada. Solo queda el logo navideño y el mensaje.
- Los banners activos de `carrusel_inicio` aparecen en la parte superior de la portada, antes de los temas del día. Se muestran en carrusel automático cada 6 segundos y tienen indicadores para cambiar manualmente.
- En cada noticia aparece el botón “Compartir por WhatsApp”, que comparte el titular y el enlace limpio de la noticia.
- La ruta `/noticia/slug` abre la noticia en la web. El endpoint `api/noticia.js` existente entrega a WhatsApp y otras redes los metadatos Open Graph de la noticia, incluido el titular y la imagen de portada.

## Publicación
1. Reemplaza los archivos del proyecto con los incluidos en este ZIP.
2. Sube los cambios al repositorio GitHub conectado a Vercel.
3. Espera el despliegue.
4. Comprueba que existan banners activos en la tabla `carrusel_inicio` de Supabase.

No se requiere una nueva tabla ni ejecutar SQL para estos cambios.

## Duración individual de los banners

También se incluye `ACTUALIZAR_DURACION_BANNERS.sql` e `INSTRUCCIONES_DURACION_BANNERS.md`. Ejecuta el SQL en Supabase antes de publicar para habilitar el tiempo individual de cada banner desde el panel administrativo.
