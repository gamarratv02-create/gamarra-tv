# Duración individual de los banners de Gamarra TV

Esta actualización permite definir desde el panel administrativo cuánto tiempo permanece visible cada banner del carrusel principal.

## 1. Actualizar Supabase

Antes de publicar los archivos, entra a **Supabase → SQL Editor → New query**, copia el contenido completo de `ACTUALIZAR_DURACION_BANNERS.sql` y pulsa **Run**. Esto agrega la columna `duracion_segundos` sin borrar los banners existentes. Los banners que ya estaban guardados tendrán 6 segundos por defecto.

## 2. Publicar la web

Sube y reemplaza en GitHub los archivos de esta actualización. Vercel desplegará los cambios automáticamente.

## 3. Configurar cada banner

Entra al sitio, inicia sesión y abre el panel administrativo. En **Portada → Carrusel principal**, al crear o editar un banner encontrarás **Duración en pantalla**. Puedes escoger 3, 5, 6, 8, 10, 15, 20 o 30 segundos. Guarda el banner para aplicar el tiempo.

Cada banner tendrá su propio tiempo. Al terminar, el carrusel pasará automáticamente al siguiente; al pulsar un indicador, también se reinicia el conteo para el banner seleccionado.

**Importante:** ejecuta primero el SQL. Si publicas el código sin agregar la columna en Supabase, el guardado de los banners puede mostrar un error.
