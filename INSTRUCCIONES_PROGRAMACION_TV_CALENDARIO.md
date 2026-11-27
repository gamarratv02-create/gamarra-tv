# Programación de programas de TV por calendario

Esta actualización conserva la parrilla semanal existente (lunes a domingo) y agrega programación especial por fecha.

## Cómo funciona

- La parrilla semanal continúa funcionando como hasta ahora.
- En el panel administrativo, entra a **Programación** y baja a **Calendario de programación por fecha**.
- Selecciona una fecha futura en el calendario y registra el nombre del programa o transmisión especial, hora de inicio, hora de finalización, descripción e imagen opcional.
- Puedes editar o eliminar cada programación especial.
- La programación especial aparece automáticamente en la señal/programación pública cuando llega esa fecha.
- Solo reemplaza los programas semanales durante las horas que ocupa; los demás espacios de la parrilla semanal se conservan.
- El sistema evita guardar dos programaciones especiales que se crucen en la misma fecha.

## Ejemplo

Para el 26 de diciembre de 2026, registra el programa especial de 3:00 p. m. a 9:00 p. m. desde ahora. Al llegar el 26 de diciembre, ese bloque aparecerá automáticamente en la programación de Gamarra TV y reemplazará los espacios habituales que coincidan con ese horario. No tienes que entrar a programarlo ese día.

## Instalación

1. En Supabase, abre **SQL Editor**.
2. Ejecuta `PROGRAMACION_CALENDARIO.sql` (es seguro volverlo a ejecutar; crea la tabla si todavía no existe y actualiza sus políticas).
3. Sube el contenido de la carpeta `gamarra-tv-main` a tu repositorio GitHub, reemplazando los archivos correspondientes.
4. Espera el despliegue de Vercel y prueba desde el panel administrativo.

La tabla utilizada es `public.programacion_eventos`. No se modifican ni se eliminan los registros de `public.programacion`.
