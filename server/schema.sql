-- ===== PostgreSQL Schema - Innovare Barber Tech =====
-- Ejecutado automáticamente por docker-compose al iniciar el contenedor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== USUARIOS =====
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK(rol IN ('cliente', 'barbero', 'admin')),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT TRUE
);

-- ===== BARBEROS =====
CREATE TABLE IF NOT EXISTS barberos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID UNIQUE REFERENCES usuarios(id),
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
  cliente_id UUID NOT NULL REFERENCES usuarios(id),
  barbero_id UUID NOT NULL REFERENCES barberos(id),
  servicio_id UUID NOT NULL REFERENCES servicios(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  deposito_garantia DECIMAL(10,2) DEFAULT 0,
  metodo_pago VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== PRODUCTOS =====
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(50),
  stock INT DEFAULT 0,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

-- ===== VENTAS (tabla_ventas del documento) =====
CREATE TABLE IF NOT EXISTS ventas (
  id_venta UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_cliente UUID NOT NULL REFERENCES usuarios(id),
  id_barbero UUID REFERENCES barberos(id),
  tipo_venta VARCHAR(20) NOT NULL CHECK(tipo_venta IN ('Servicio', 'Retail', 'Membresia', 'Consolidado')),
  monto_servicios DECIMAL(10,2) DEFAULT 0,
  monto_retail DECIMAL(10,2) DEFAULT 0,
  deposito_previo DECIMAL(10,2) DEFAULT 0,
  monto_total DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL,
  estado_pago VARCHAR(15) DEFAULT 'Completado' CHECK(estado_pago IN ('Completado', 'Pendiente', 'Reembolsado')),
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== DETALLE_VENTAS =====
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INT DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- ===== COMISIONES =====
CREATE TABLE IF NOT EXISTS comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbero_id UUID NOT NULL REFERENCES barberos(id),
  venta_id UUID NOT NULL REFERENCES ventas(id_venta),
  porcentaje DECIMAL(5,2) DEFAULT 40.00,
  monto DECIMAL(10,2) NOT NULL,
  pagada BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== DIAGNOSTICOS_3D =====
CREATE TABLE IF NOT EXISTS diagnosticos_3d (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES usuarios(id),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  imagen_url TEXT,
  resultado_ia TEXT,
  zonas_analizadas INT DEFAULT 5,
  recomendaciones TEXT
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_cliente ON diagnosticos_3d(cliente_id);