-- ============================================================
-- INNOVARE BARBER TECH - Supabase Schema
-- Ejecutar en SQL Editor de Supabase (supabase.com/dashboard)
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== USUARIOS =====
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK(rol IN ('cliente','barbero','admin')),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE
);

-- ===== BARBEROS =====
CREATE TABLE IF NOT EXISTS barberos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  nombre VARCHAR(100) NOT NULL,
  especialidad VARCHAR(100),
  rol_barberia VARCHAR(50),
  rating DECIMAL(2,1) DEFAULT 5.0,
  experiencia INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE
);

-- ===== SERVICIOS =====
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  duracion_min INT NOT NULL,
  categoria VARCHAR(50),
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

-- ===== MEMBRESIAS =====
CREATE TABLE IF NOT EXISTS membresias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  periodo VARCHAR(20) DEFAULT 'mensual',
  regla_uso TEXT,
  activo BOOLEAN DEFAULT TRUE
);

-- ===== MEMBRESIAS_CARACTERISTICAS =====
CREATE TABLE IF NOT EXISTS membresias_caracteristicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membresia_id UUID NOT NULL REFERENCES membresias(id) ON DELETE CASCADE,
  caracteristica TEXT NOT NULL
);

-- ===== CITAS =====
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES usuarios(id),
  barbero_id UUID REFERENCES barberos(id),
  servicio_id UUID REFERENCES servicios(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK(estado IN ('pendiente','confirmada','completada','cancelada')),
  deposito_garantia DECIMAL(10,2) DEFAULT 0,
  precio_total DECIMAL(10,2) DEFAULT 0,
  pendiente DECIMAL(10,2) DEFAULT 0,
  metodo_pago VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===== DIAGNOSTICOS_3D =====
CREATE TABLE IF NOT EXISTS diagnosticos_3d (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES usuarios(id),
  forma_rostro VARCHAR(50),
  densidad_capilar VARCHAR(30),
  textura VARCHAR(30),
  salud_score INT,
  estilos_recomendados JSONB,
  recomendaciones JSONB,
  fecha TIMESTAMP DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_barberos_activos ON barberos(activo);

-- ===== ROW LEVEL SECURITY (RLS) =====
-- Desactivar RLS para pruebas (en producción activar con auth)
ALTER TABLE citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos_3d DISABLE ROW LEVEL SECURITY;
ALTER TABLE barberos DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;

-- ===== CREAR USUARIOS DE PRUEBA =====
-- Ejecuta esto en Authentication > Users > Add User en Supabase Dashboard
-- O usa SQL Editor con:
-- SELECT * FROM auth.users;

-- También puedes usar la API de Auth de Supabase:
-- POST https://TU_PROYECTO.supabase.co/auth/v1/signup
-- Body: { "email": "admin@innovarebarber.tech", "password": "innovare2026", "data": { "nombre": "Admin Barber", "rol": "admin" } }

-- ===== SEED DATA (opcional) =====
INSERT INTO barberos (nombre, especialidad, rol_barberia, rating, experiencia) VALUES
  ('Alex Martínez', 'Cortes Clásicos', 'Master Barber', 4.9, 8),
  ('Carlos Gómez', 'Barbas VIP', 'Barber Tech', 4.8, 6),
  ('Miguel Torres', 'Degradados Modernos', 'Operador AR', 4.9, 5),
  ('David Rojas', 'Estilos Premium', 'Esp. Diagnóstico', 4.7, 10)
ON CONFLICT DO NOTHING;

INSERT INTO servicios (nombre, precio, duracion_min, categoria) VALUES
  ('Corte & Estilo Técnico Premium', 450, 45, 'corte'),
  ('Corte Degradado Luxury Fade', 550, 50, 'corte'),
  ('Perfilado de Barba VIP', 350, 30, 'barba'),
  ('Corte + Barba (Combo Ejecutivo)', 680, 60, 'combo'),
  ('Escáner Capilar 3D + IA', 400, 15, 'diagnostico'),
  ('Simulación AR (Espejo Inteligente)', 250, 10, 'ar'),
  ('Afeitado Clásico con Navaja', 380, 35, 'afeitado'),
  ('Lavado + Masaje + Ozono VIP', 280, 20, 'extra')
ON CONFLICT DO NOTHING;

INSERT INTO membresias (nombre, precio, periodo, regla_uso) VALUES
  ('The Regular', 349, 'mensual', 'Uso o pérdida: sesiones no agendadas expiran.'),
  ('VIP Tech', 599, 'mensual', '15% descuento en servicios. Sin acumulación.')
ON CONFLICT DO NOTHING;