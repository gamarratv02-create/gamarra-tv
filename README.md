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

## Administración de canales, radio y banners

El panel autenticado incluye ahora formularios CRUD para `tv_channels`, `radio_stations` y `tv_banners`. Las imágenes pueden cargarse al bucket público `gtv-media`. Las políticas de Supabase deben permitir la operación solo a administradores. La aplicación Android aún debe conectarse a estas tablas por separado para consumir los cambios publicados sin recompilar.
