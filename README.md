# Gamarra TV

Portal inicial de noticias y televisión para Gamarra TV.

## Incluye
- Portada de noticias
- Carrusel/hero de noticias destacadas
- Categorías: Gamarra, Judicial, Deportes, Región y más
- Páginas individuales de noticias
- Sección de señal en vivo preparada para M3U8/HLS
- Diseño responsive para celular y computador

## Próxima etapa
Conectar Supabase para:
- Panel `/admin`
- Inicio de sesión
- Crear, editar y eliminar noticias
- Subir imágenes
- Categorías y etiquetas
- Noticias destacadas
- Base de datos real

## Despliegue
Este proyecto funciona como sitio estático y puede desplegarse directamente en Vercel.

## Banners de eventos
- Los banners de eventos y anuncios se administran desde `#/admin`, en la sección **Eventos y publicidad**.
- Para publicar un evento, registra el título, la URL pública del afiche, un enlace opcional y los detalles de fecha/lugar.
- Los banners activos aparecen en la página de inicio, debajo del encabezado y antes de las noticias destacadas, la televisión en vivo y las demás secciones.
- Esta función reutiliza la tabla existente `publicidad` en Supabase; no requiere una tabla nueva. La tabla debe tener `titulo`, `imagen_url`, `enlace_url`, `descripcion`, `activo`, `orden` y `created_at`.
