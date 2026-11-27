-- Ejecutar en Supabase > SQL Editor para habilitar duración por banner.
alter table public.carrusel_inicio add column if not exists duracion_segundos integer not null default 5;
alter table public.carrusel_inicio drop constraint if exists carrusel_inicio_duracion_segundos_check;
alter table public.carrusel_inicio add constraint carrusel_inicio_duracion_segundos_check check (duracion_segundos between 2 and 120);
