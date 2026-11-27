-- Gamarra TV: calendario para programar eventos y transmisiones en fechas futuras.
-- Ejecutar una sola vez en Supabase > SQL Editor.
create table if not exists public.programacion_eventos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  titulo text not null,
  hora_inicio time without time zone not null,
  hora_fin time without time zone not null,
  descripcion text,
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programacion_eventos_horario_valido check (hora_fin > hora_inicio)
);

create index if not exists programacion_eventos_fecha_hora_idx
  on public.programacion_eventos (fecha, hora_inicio);

alter table public.programacion_eventos enable row level security;

drop policy if exists "Public can view active scheduled events" on public.programacion_eventos;
create policy "Public can view active scheduled events"
  on public.programacion_eventos for select to anon, authenticated
  using (activo = true);

drop policy if exists "Authenticated users manage scheduled events" on public.programacion_eventos;
create policy "Authenticated users manage scheduled events"
  on public.programacion_eventos for all to authenticated
  using (true) with check (true);
