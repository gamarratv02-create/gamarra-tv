-- Gamarra TV: sección Eventos GTV con galerías organizadas por barrios.
-- Ejecutar una sola vez en Supabase > SQL Editor.
create table if not exists public.eventos_gtv (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  slug text not null unique,
  descripcion text,
  portada_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eventos_gtv_barrios (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos_gtv(id) on delete cascade,
  nombre text not null,
  slug text not null,
  descripcion text,
  portada_url text,
  fotos text[] not null default '{}',
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(evento_id, slug)
);

create index if not exists eventos_gtv_activo_idx on public.eventos_gtv(activo, created_at desc);
create index if not exists eventos_gtv_barrios_evento_idx on public.eventos_gtv_barrios(evento_id, activo, orden);

alter table public.eventos_gtv enable row level security;
alter table public.eventos_gtv_barrios enable row level security;

drop policy if exists "Public can view active GTV events" on public.eventos_gtv;
create policy "Public can view active GTV events" on public.eventos_gtv for select to anon, authenticated using (activo = true);
drop policy if exists "Authenticated users manage GTV events" on public.eventos_gtv;
create policy "Authenticated users manage GTV events" on public.eventos_gtv for all to authenticated using (true) with check (true);

drop policy if exists "Public can view active GTV event galleries" on public.eventos_gtv_barrios;
create policy "Public can view active GTV event galleries" on public.eventos_gtv_barrios for select to anon, authenticated using (activo = true);
drop policy if exists "Authenticated users manage GTV event galleries" on public.eventos_gtv_barrios;
create policy "Authenticated users manage GTV event galleries" on public.eventos_gtv_barrios for all to authenticated using (true) with check (true);

-- Las fotografías se guardan en el bucket público existente "noticias", dentro de la carpeta eventos/.
-- No se crean claves nuevas ni se desactiva RLS.
