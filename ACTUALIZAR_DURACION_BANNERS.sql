-- Gamarra TV: duración individual para cada banner del carrusel principal.
-- Ejecutar una sola vez en Supabase > SQL Editor > New query.
ALTER TABLE public.carrusel_inicio
ADD COLUMN IF NOT EXISTS duracion_segundos integer NOT NULL DEFAULT 6;

-- Normaliza valores existentes o inválidos.
UPDATE public.carrusel_inicio
SET duracion_segundos = 6
WHERE duracion_segundos IS NULL OR duracion_segundos < 1;
