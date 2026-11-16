-- YA SE APLICÓ EN SUPABASE EL 16-NOV-2026. Se guarda solo como registro.
-- =====================================================================
-- Saulo & Amor Salón - Seguridad de la base de datos (RLS)
--
-- Hoy cualquiera con la llave pública del sitio puede leer, cambiar o
-- borrar todas las citas, pedidos, suscripciones y diagnósticos, y leer
-- el correo y teléfono de todos los usuarios. Con esto cada cliente solo
-- ve lo suyo y el administrador ve todo.
-- =====================================================================

-- ---------- 0. ¿El usuario que hace la consulta es administrador? ----------
create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios
    where id = (select auth.uid()) and rol = 'admin'
  );
$$;

-- ---------- 1. Usuarios ----------
-- La cuenta admin@innovarebarber.tech existe en Auth pero no tenía fila en
-- "usuarios"; se crea con rol admin. También se crean las filas que les
-- faltan a otros usuarios registrados (como clientes).
insert into public.usuarios (id, nombre, email, telefono, rol, activo)
select a.id,
       coalesce(a.raw_user_meta_data->>'nombre', split_part(a.email, '@', 1)),
       a.email,
       a.raw_user_meta_data->>'telefono',
       case when a.email = 'admin@innovarebarber.tech' then 'admin' else 'cliente' end,
       a.email_confirmed_at is not null
from auth.users a
where not exists (select 1 from public.usuarios u where u.id = a.id)
  and not exists (select 1 from public.usuarios u where lower(u.email) = lower(a.email));

drop policy if exists "Permitir selects a todos" on public.usuarios;
drop policy if exists "Permitir updates a todos" on public.usuarios;
drop policy if exists "Permitir inserts a todos" on public.usuarios;

create policy usuarios_ver on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

-- El registro sigue funcionando, pero nadie puede darse de alta como admin.
create policy usuarios_registrar on public.usuarios
  for insert to anon, authenticated
  with check (coalesce(rol, 'cliente') = 'cliente');

create policy usuarios_editar on public.usuarios
  for update to authenticated
  using (id = (select auth.uid()) or public.es_admin())
  with check (id = (select auth.uid()) or public.es_admin());

-- Desde el sitio solo se pueden cambiar estas columnas (el rol no).
revoke update on public.usuarios from anon, authenticated;
grant update (nombre, telefono, activo) on public.usuarios to authenticated;

-- ---------- 2. Citas ----------
alter table public.citas enable row level security;
drop policy if exists citas_cliente on public.citas;

create policy citas_ver on public.citas
  for select to authenticated
  using (cliente_id = (select auth.uid()) or public.es_admin());

create policy citas_crear on public.citas
  for insert to authenticated
  with check (cliente_id = (select auth.uid()));

create policy citas_editar on public.citas
  for update to authenticated
  using (cliente_id = (select auth.uid()) or public.es_admin())
  with check (cliente_id = (select auth.uid()) or public.es_admin());

-- Reagendar o cancelar solo cambia fecha, hora y estado.
revoke update on public.citas from anon, authenticated;
grant update (fecha, hora, estado) on public.citas to authenticated;

-- Dos citas activas no pueden tener el mismo estilista, día y hora.
create unique index if not exists citas_sin_empalme
  on public.citas (barbero_id, fecha, hora)
  where estado <> 'cancelada';

-- Horarios ocupados para la página de reservas, sin datos del cliente.
create or replace function public.horarios_ocupados(p_desde date default current_date)
returns table (fecha date, hora time, barbero_id uuid, estado varchar)
language sql stable security definer set search_path = ''
as $$
  select c.fecha, c.hora, c.barbero_id, c.estado
  from public.citas c
  where c.fecha >= p_desde and c.estado <> 'cancelada';
$$;
grant execute on function public.horarios_ocupados(date) to anon, authenticated;

-- ---------- 3. Pedidos ----------
alter table public.pedidos enable row level security;

create policy pedidos_ver on public.pedidos
  for select to authenticated
  using (cliente_id = (select auth.uid()) or public.es_admin());

-- Se puede comprar sin cuenta (cliente_id vacío) o con la propia cuenta.
create policy pedidos_crear on public.pedidos
  for insert to anon, authenticated
  with check (cliente_id is null or cliente_id = (select auth.uid()));

create policy pedidos_editar_admin on public.pedidos
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

revoke update on public.pedidos from anon, authenticated;
grant update (estado) on public.pedidos to authenticated;

-- ---------- 4. Suscripciones ----------
alter table public.suscripciones enable row level security;

create policy suscripciones_ver on public.suscripciones
  for select to authenticated
  using (cliente_id = (select auth.uid()) or public.es_admin());

create policy suscripciones_crear on public.suscripciones
  for insert to authenticated
  with check (cliente_id = (select auth.uid()));

-- ---------- 5. Diagnósticos ----------
alter table public.diagnosticos_3d enable row level security;
drop policy if exists diagnosticos_cliente on public.diagnosticos_3d;

create policy diagnosticos_ver on public.diagnosticos_3d
  for select to authenticated
  using (cliente_id = (select auth.uid()) or public.es_admin());

create policy diagnosticos_crear on public.diagnosticos_3d
  for insert to authenticated
  with check (cliente_id = (select auth.uid()));

-- ---------- 6. Membresías (tenía RLS sin reglas: nadie podía leerla) ----------
create policy membresias_lectura on public.membresias
  for select to anon, authenticated
  using (activo);
