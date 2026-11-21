-- Gamarra TV: conexión del panel web con las tablas que consume la app Android.
-- Ejecutar en Supabase > SQL Editor > New query.
--
-- Este archivo crea vistas compatibles con los nombres de tabla que usa el panel web:
--   canales_tv    -> gtv_channels
--   emisoras_radio -> gtv_radios
-- Las vistas son actualizables: guardar/editar/eliminar desde la web modifica las tablas
-- gtv_channels y gtv_radios, que son las que consulta la aplicación.
--
-- Estructura esperada en las tablas base:
-- gtv_channels / gtv_radios: id, name, logo_url, stream_url, sort_order,
-- is_active, created_at.
--
-- Seguridad: las vistas usan security_invoker para respetar RLS de las tablas base.
-- Las tablas base deben permitir SELECT público de filas activas y escritura únicamente
-- a administradores autenticados. No se crean políticas abiertas en este script.

do $$
begin
  if to_regclass('public.gtv_channels') is null then
    raise exception 'No existe public.gtv_channels. Verifica el nombre de la tabla de canales.';
  end if;
  if to_regclass('public.gtv_radios') is null then
    raise exception 'No existe public.gtv_radios. Verifica el nombre de la tabla de radios.';
  end if;

  if to_regclass('public.canales_tv') is null then
    execute $view$
      create view public.canales_tv
      with (security_invoker = true)
      as
      select id, name as nombre, logo_url, stream_url,
             sort_order as orden, is_active as activo, created_at
      from public.gtv_channels
    $view$;
  elsif exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='canales_tv' and c.relkind='r'
  ) then
    raise notice 'Ya existe public.canales_tv como tabla. El panel seguirá usando esa tabla; migra sus datos o renómbrala para usar la vista gtv_channels.';
  end if;

  if to_regclass('public.emisoras_radio') is null then
    execute $view$
      create view public.emisoras_radio
      with (security_invoker = true)
      as
      select id, name as nombre, logo_url, stream_url,
             sort_order as orden, is_active as activo, created_at
      from public.gtv_radios
    $view$;
  elsif exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='emisoras_radio' and c.relkind='r'
  ) then
    raise notice 'Ya existe public.emisoras_radio como tabla. El panel seguirá usando esa tabla; migra sus datos o renómbrala para usar la vista gtv_radios.';
  end if;
end $$;

grant select, insert, update, delete on public.canales_tv to authenticated;
grant select, insert, update, delete on public.emisoras_radio to authenticated;
grant select on public.canales_tv to anon;
grant select on public.emisoras_radio to anon;

-- Comprobación rápida: estas consultas deben devolver los canales y radios actuales.
select id, nombre, logo_url, stream_url, activo from public.canales_tv order by orden, created_at;
select id, nombre, logo_url, stream_url, activo from public.emisoras_radio order by orden, created_at;
