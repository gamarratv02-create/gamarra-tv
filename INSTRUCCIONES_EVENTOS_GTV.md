# Actualización: Eventos GTV

Esta actualización agrega una sección pública de galerías fotográficas organizadas por evento y por barrio/sector.

## 1. Supabase (paso obligatorio)
1. Abre el proyecto Supabase de Gamarra TV.
2. Entra en **SQL Editor** > **New query**.
3. Abre `eventos_gtv.sql`, copia todo su contenido y ejecútalo.
4. La actualización reutiliza el bucket público existente `noticias` y guarda las imágenes en la carpeta `eventos/`. No compartas claves secretas.

## 2. GitHub y Vercel
1. Descomprime este ZIP.
2. Sube los archivos del proyecto, conservando la carpeta `api` y `vercel.json`.
3. Haz commit y espera a que Vercel termine el despliegue.

## 3. Publicar un evento
1. En Gamarra TV entra en **Iniciar sesión** y luego al panel.
2. Busca **Eventos GTV y galerías por barrios**.
3. Crea el evento, por ejemplo `La Ruta del Dulce`; puedes subir una portada desde tu computador.
4. En **Agregar barrio o subgrupo fotográfico**, selecciona el evento, escribe el nombre del barrio, una descripción y selecciona varias fotos desde tu computador. También se pueden pegar URLs públicas, una por línea.
5. Guarda. Repite el paso para cada barrio o sector.

## 4. Direcciones públicas
- Listado: `#/eventos`
- Evento: `#/eventos/la-ruta-del-dulce`
- Barrio: `#/eventos/la-ruta-del-dulce/nombre-del-barrio`

Los slugs se generan automáticamente desde los nombres si se dejan vacíos. Los eventos y galerías publicados aparecen en la web; los datos existentes de noticias, programación y Gamarra Decide 2027 se conservan.

**Nota de almacenamiento:** las subidas usan el bucket público `noticias` existente. Si Supabase rechaza una subida, revisa que el bucket esté marcado como público y que exista una política de INSERT para usuarios autenticados en `storage.objects` para ese bucket. No cambies ni desactives RLS.
