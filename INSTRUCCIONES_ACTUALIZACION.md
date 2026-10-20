# Actualización del panel Gamarra TV

## Qué se añadió
- **Canales de televisión:** crear, editar, eliminar, logo, URL de señal, orden y visibilidad.
- **Emisoras de radio:** crear, editar, eliminar, logo, URL de audio, orden y visibilidad.
- **Carrusel principal:** crear, editar, eliminar banners, enlaces, orden y visibilidad.
- Se mantienen las secciones existentes de noticias, programación, clientes y publicidad.

## Paso obligatorio: crear las tablas en Supabase
1. Abre el proyecto de Supabase que ya utiliza la web.
2. Entra en **SQL Editor** y crea una consulta nueva.
3. Abre `supabase_canales_radios_carrusel.sql`, copia todo su contenido y ejecútalo.
4. Espera el mensaje de ejecución correcta.

## Publicar la web
1. Descomprime este ZIP.
2. Sube los archivos actualizados al repositorio que conecta con Vercel, reemplazando los archivos existentes.
3. Espera a que Vercel termine el despliegue.
4. Entra a `https://gamarra-tv.vercel.app/#/login`, inicia sesión y abre el Panel.
5. Baja por el panel: las secciones **Canales de televisión**, **Emisoras de radio** y **Carrusel principal** aparecen debajo de las secciones actuales.

## Nota importante
Esta actualización incorpora los formularios y el almacenamiento CRUD en Supabase. La visualización automática de los canales/radios nuevos dentro de la app Android y el carrusel dinámico en la portada web requieren conectar esas pantallas públicas a las tablas nuevas; este ZIP no debe interpretarse como una app Android ya conectada a ellas.
