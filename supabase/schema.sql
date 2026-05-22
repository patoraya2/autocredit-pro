-- ============================================================
-- AUTOCREDIT PRO - Esquema de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- BANCOS
-- ============================================================
create table if not exists bancos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  codigo text not null unique,
  color text default '#3B82F6',
  activo boolean default true,
  created_at timestamptz default now()
);

insert into bancos (nombre, codigo, color) values
  ('Scotiabank', 'SCOTIA', '#EC1C24'),
  ('BBVA', 'BBVA', '#004481'),
  ('Banorte', 'BANORTE', '#E8251F')
on conflict (codigo) do nothing;

-- ============================================================
-- CLIENTES
-- ============================================================
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  apellido_paterno text not null,
  apellido_materno text,
  curp text,
  rfc text,
  fecha_nacimiento date,
  telefono text,
  telefono_alternativo text,
  email text,
  estado_civil text,
  domicilio text,
  colonia text,
  ciudad text,
  estado text,
  cp text,
  ocupacion text,
  empresa text,
  ingreso_mensual numeric(12,2),
  antiguedad_laboral text,
  tipo_empleado text, -- asalariado, independiente, empresario
  notas text,
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- UNIDADES (INVENTARIO DE VEHÍCULOS)
-- ============================================================
create table if not exists unidades (
  id uuid primary key default uuid_generate_v4(),
  marca text not null,
  modelo text not null,
  anio integer not null,
  version text,
  color text,
  numero_serie text unique,
  numero_motor text,
  placas text,
  precio numeric(12,2) not null,
  precio_lista numeric(12,2),
  tipo text default 'nuevo', -- nuevo, seminuevo
  transmision text, -- automatica, manual
  combustible text default 'gasolina',
  kilometraje integer default 0,
  estatus text default 'disponible', -- disponible, apartada, vendida, en_proceso
  imagen_url text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SOLICITUDES DE CRÉDITO
-- ============================================================
create table if not exists solicitudes (
  id uuid primary key default uuid_generate_v4(),
  folio text unique not null,
  cliente_id uuid not null references clientes(id),
  unidad_id uuid not null references unidades(id),
  banco_id uuid not null references bancos(id),

  -- Condiciones del crédito
  precio_venta numeric(12,2) not null,
  enganche numeric(12,2) not null default 0,
  monto_financiar numeric(12,2) generated always as (precio_venta - enganche) stored,
  plazo_meses integer not null default 48,
  tasa_anual numeric(5,2),
  pago_mensual numeric(12,2),

  -- Estado
  estatus text default 'nueva',
  -- nueva → preparando → enviada → en_revision → aprobada → rechazada → fondeada → cancelada

  -- Seguimiento
  fecha_envio timestamptz,
  fecha_respuesta timestamptz,
  fecha_fondeo timestamptz,
  numero_credito text,
  observaciones text,

  -- PDF
  pdf_url text,
  pdf_generado boolean default false,

  -- Comisión
  comision numeric(12,2),
  comision_pagada boolean default false,
  fecha_pago_comision date,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- HISTORIAL DE ESTADOS DE SOLICITUD
-- ============================================================
create table if not exists solicitud_historial (
  id uuid primary key default uuid_generate_v4(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  estatus_anterior text,
  estatus_nuevo text not null,
  nota text,
  created_at timestamptz default now()
);

-- ============================================================
-- DOCUMENTOS POR SOLICITUD
-- ============================================================
create table if not exists solicitud_documentos (
  id uuid primary key default uuid_generate_v4(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  tipo text not null, -- ine, comprobante_domicilio, comprobante_ingresos, etc.
  nombre_archivo text not null,
  url text not null,
  subido_en timestamptz default now()
);

-- ============================================================
-- FUNCIÓN: Generar folio automático
-- ============================================================
create or replace function generar_folio()
returns trigger as $$
declare
  año text;
  secuencia integer;
  nuevo_folio text;
begin
  año := to_char(now(), 'YY');
  select coalesce(max(cast(substring(folio from 4) as integer)), 0) + 1
    into secuencia
    from solicitudes
    where folio like 'AC' || año || '%';
  nuevo_folio := 'AC' || año || lpad(secuencia::text, 4, '0');
  new.folio := nuevo_folio;
  return new;
end;
$$ language plpgsql;

create trigger trigger_generar_folio
  before insert on solicitudes
  for each row
  when (new.folio is null or new.folio = '')
  execute function generar_folio();

-- ============================================================
-- FUNCIÓN: Registrar historial al cambiar estatus
-- ============================================================
create or replace function registrar_historial_solicitud()
returns trigger as $$
begin
  if old.estatus is distinct from new.estatus then
    insert into solicitud_historial (solicitud_id, estatus_anterior, estatus_nuevo)
    values (new.id, old.estatus, new.estatus);
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_historial_solicitud
  before update on solicitudes
  for each row
  execute function registrar_historial_solicitud();

-- ============================================================
-- FUNCIÓN: updated_at automático en clientes y unidades
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_clientes_updated_at
  before update on clientes
  for each row execute function set_updated_at();

create trigger trigger_unidades_updated_at
  before update on unidades
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Todos los usuarios autenticados pueden ver/editar todo
-- (puedes afinar esto después por rol)
-- ============================================================
alter table bancos enable row level security;
alter table clientes enable row level security;
alter table unidades enable row level security;
alter table solicitudes enable row level security;
alter table solicitud_historial enable row level security;
alter table solicitud_documentos enable row level security;

create policy "Authenticated users full access - bancos"
  on bancos for all to authenticated using (true) with check (true);

create policy "Authenticated users full access - clientes"
  on clientes for all to authenticated using (true) with check (true);

create policy "Authenticated users full access - unidades"
  on unidades for all to authenticated using (true) with check (true);

create policy "Authenticated users full access - solicitudes"
  on solicitudes for all to authenticated using (true) with check (true);

create policy "Authenticated users full access - historial"
  on solicitud_historial for all to authenticated using (true) with check (true);

create policy "Authenticated users full access - documentos"
  on solicitud_documentos for all to authenticated using (true) with check (true);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista completa de solicitudes
create or replace view solicitudes_completas as
select
  s.id,
  s.folio,
  s.estatus,
  s.precio_venta,
  s.enganche,
  s.monto_financiar,
  s.plazo_meses,
  s.pago_mensual,
  s.comision,
  s.comision_pagada,
  s.fecha_envio,
  s.fecha_respuesta,
  s.fecha_fondeo,
  s.created_at,
  -- Cliente
  c.id as cliente_id,
  c.nombre || ' ' || c.apellido_paterno || coalesce(' ' || c.apellido_materno, '') as cliente_nombre,
  c.telefono as cliente_telefono,
  c.email as cliente_email,
  -- Unidad
  u.id as unidad_id,
  u.marca || ' ' || u.modelo || ' ' || u.anio::text as unidad_descripcion,
  u.numero_serie,
  u.precio as unidad_precio,
  -- Banco
  b.id as banco_id,
  b.nombre as banco_nombre,
  b.codigo as banco_codigo,
  b.color as banco_color
from solicitudes s
join clientes c on c.id = s.cliente_id
join unidades u on u.id = s.unidad_id
join bancos b on b.id = s.banco_id;

-- ============================================================
-- FIN DEL ESQUEMA
-- ============================================================
