// ===== DATABASE.JS - SQLite Relacional - Innovare Barber Tech =====
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'innovare_barber.db');

let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeTables();
    seedData();
  }
  return db;
}

function initializeTables() {
  db.exec(`
    -- ===== USUARIOS (Clientes + Barbers + Admin) =====
    CREATE TABLE IF NOT EXISTS usuarios (
      id UUID PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      telefono VARCHAR(20),
      rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK(rol IN ('cliente', 'barbero', 'admin')),
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      activo BOOLEAN DEFAULT 1
    );

    -- ===== BARBEROS =====
    CREATE TABLE IF NOT EXISTS barberos (
      id UUID PRIMARY KEY,
      usuario_id UUID UNIQUE,
      nombre VARCHAR(100) NOT NULL,
      especialidad VARCHAR(100),
      rol_barberia VARCHAR(50),
      rating DECIMAL(2,1) DEFAULT 5.0,
      experiencia INT DEFAULT 0,
      activo BOOLEAN DEFAULT 1,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    -- ===== SERVICIOS =====
    CREATE TABLE IF NOT EXISTS servicios (
      id UUID PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      duracion_min INT NOT NULL,
      categoria VARCHAR(50),
      descripcion TEXT,
      activo BOOLEAN DEFAULT 1
    );

    -- ===== MEMBRESIAS =====
    CREATE TABLE IF NOT EXISTS membresias (
      id UUID PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      periodo VARCHAR(20) DEFAULT 'mensual',
      regla_uso TEXT,
      activo BOOLEAN DEFAULT 1
    );

    -- ===== MEMBRESIAS_CARACTERISTICAS =====
    CREATE TABLE IF NOT EXISTS membresias_caracteristicas (
      id UUID PRIMARY KEY,
      membresia_id UUID NOT NULL,
      caracteristica TEXT NOT NULL,
      FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE CASCADE
    );

    -- ===== CLIENTES_MEMBRESIAS =====
    CREATE TABLE IF NOT EXISTS clientes_membresias (
      id UUID PRIMARY KEY,
      cliente_id UUID NOT NULL,
      membresia_id UUID NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE,
      activa BOOLEAN DEFAULT 1,
      stripe_token VARCHAR(255),
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
      FOREIGN KEY (membresia_id) REFERENCES membresias(id)
    );

    -- ===== CITAS (Reservas) =====
    CREATE TABLE IF NOT EXISTS citas (
      id UUID PRIMARY KEY,
      cliente_id UUID NOT NULL,
      barbero_id UUID NOT NULL,
      servicio_id UUID NOT NULL,
      fecha DATE NOT NULL,
      hora TIME NOT NULL,
      estado VARCHAR(20) DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
      deposito_garantia DECIMAL(10,2) DEFAULT 0,
      metodo_pago VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
      FOREIGN KEY (barbero_id) REFERENCES barberos(id),
      FOREIGN KEY (servicio_id) REFERENCES servicios(id)
    );

    -- ===== PRODUCTOS (Retail) =====
    CREATE TABLE IF NOT EXISTS productos (
      id UUID PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      categoria VARCHAR(50),
      stock INT DEFAULT 0,
      descripcion TEXT,
      activo BOOLEAN DEFAULT 1
    );

    -- ===== VENTAS (Tabla del documento - tabla_ventas) =====
    CREATE TABLE IF NOT EXISTS ventas (
      id_venta UUID PRIMARY KEY,
      id_cliente UUID NOT NULL,
      id_barbero UUID,
      tipo_venta VARCHAR(20) NOT NULL CHECK(tipo_venta IN ('Servicio', 'Retail', 'Membresia', 'Consolidado')),
      monto_servicios DECIMAL(10,2) DEFAULT 0,
      monto_retail DECIMAL(10,2) DEFAULT 0,
      deposito_previo DECIMAL(10,2) DEFAULT 0,
      monto_total DECIMAL(10,2) NOT NULL,
      metodo_pago VARCHAR(30) NOT NULL,
      estado_pago VARCHAR(15) DEFAULT 'Completado' CHECK(estado_pago IN ('Completado', 'Pendiente', 'Reembolsado')),
      fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_cliente) REFERENCES usuarios(id),
      FOREIGN KEY (id_barbero) REFERENCES barberos(id)
    );

    -- ===== DETALLE_VENTAS (Productos en cada venta) =====
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id UUID PRIMARY KEY,
      venta_id UUID NOT NULL,
      producto_id UUID,
      cantidad INT DEFAULT 1,
      precio_unitario DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id_venta) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    );

    -- ===== COMISIONES =====
    CREATE TABLE IF NOT EXISTS comisiones (
      id UUID PRIMARY KEY,
      barbero_id UUID NOT NULL,
      venta_id UUID NOT NULL,
      porcentaje DECIMAL(5,2) DEFAULT 40.00,
      monto DECIMAL(10,2) NOT NULL,
      pagada BOOLEAN DEFAULT 0,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbero_id) REFERENCES barberos(id),
      FOREIGN KEY (venta_id) REFERENCES ventas(id_venta)
    );

    -- ===== DIAGNOSTICOS_3D (Escaneos capilares) =====
    CREATE TABLE IF NOT EXISTS diagnosticos_3d (
      id UUID PRIMARY KEY,
      cliente_id UUID NOT NULL,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      imagen_url TEXT,
      resultado_ia TEXT,
      zonas_analizadas INT DEFAULT 5,
      recomendaciones TEXT,
      FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
    );

    -- ===== INDEXES =====
    CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
    CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);
    CREATE INDEX IF NOT EXISTS idx_diagnosticos_cliente ON diagnosticos_3d(cliente_id);
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as c FROM usuarios').get();
  if (count.c > 0) return;

  console.log('🌱 Sembrando datos iniciales...');

  const adminId = uuidv4();
  const barber1Id = uuidv4();
  const barber2Id = uuidv4();
  const barber3Id = uuidv4();
  const barber4Id = uuidv4();
  const clienteId = uuidv4();

  const hash = bcrypt.hashSync('innovare2026', 10);

  // Usuarios
  const insertUser = db.prepare(`INSERT INTO usuarios (id, nombre, email, password_hash, telefono, rol) VALUES (?, ?, ?, ?, ?, ?)`);
  insertUser.run(adminId, 'Admin Barber', 'admin@innovarebarber.tech', hash, '2221175554', 'admin');
  insertUser.run(clienteId, 'Cliente Demo', 'cliente@demo.com', hash, '5551001000', 'cliente');
  insertUser.run(uuidv4(), 'Alex Martínez', 'alex@innovarebarber.tech', hash, '5551002001', 'barbero');
  insertUser.run(uuidv4(), 'Carlos Gómez', 'carlos@innovarebarber.tech', hash, '5551002002', 'barbero');
  insertUser.run(uuidv4(), 'Miguel Torres', 'miguel@innovarebarber.tech', hash, '5551002003', 'barbero');
  insertUser.run(uuidv4(), 'David Rojas', 'david@innovarebarber.tech', hash, '5551002004', 'barbero');

  // Barbers
  const insertBarber = db.prepare(`INSERT INTO barberos (id, usuario_id, nombre, especialidad, rol_barberia, rating, experiencia) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertBarber.run(barber1Id, null, 'Alex Martínez', 'Cortes Clásicos', 'Master Barber', 4.9, 8);
  insertBarber.run(barber2Id, null, 'Carlos Gómez', 'Barbas y Perfilados VIP', 'Barber Tech', 4.8, 6);
  insertBarber.run(barber3Id, null, 'Miguel Torres', 'Degradados Modernos / AR', 'Operador AR', 4.9, 5);
  insertBarber.run(barber4Id, null, 'David Rojas', 'Estilos Premium / Diagnóstico', 'Esp. Diagnóstico', 4.7, 10);

  // Services
  const insertService = db.prepare(`INSERT INTO servicios (id, nombre, precio, duracion_min, categoria, descripcion) VALUES (?, ?, ?, ?, ?, ?)`);
  insertService.run(uuidv4(), 'Corte & Estilo Técnico', 180, 45, 'corte', 'Desvanecidos degradados avanzados, curly fades y loose crops.');
  insertService.run(uuidv4(), 'Corte Degradado Premium (Fade)', 250, 50, 'corte', 'Degradado profesional con difuminado perfecto.');
  insertService.run(uuidv4(), 'Perfilado de Barba VIP', 150, 30, 'barba', 'Toalla caliente con vapor de ozono.');
  insertService.run(uuidv4(), 'Corte + Barba (Combo Técnico)', 280, 60, 'combo', 'Corte completo + perfilado de barba con vapor.');
  insertService.run(uuidv4(), 'Escáner Capilar 3D', 200, 15, 'diagnostico', 'Microscopía digital 50x en 5 zonas críticas.');
  insertService.run(uuidv4(), 'Simulación AR (Espejo Inteligente)', 100, 10, 'ar', 'Previsualiza cortes y colores en tiempo real.');
  insertService.run(uuidv4(), 'Afeitado Clásico con Navaja', 200, 35, 'afeitado', 'Navaja libre de máxima higiene.');
  insertService.run(uuidv4(), 'Lavado + Masaje + Ozono', 120, 20, 'extra', 'Vapor de ozono para apertura de poros.');

  // Memberships
  const memRegularId = uuidv4();
  const memVipId = uuidv4();
  const insertMem = db.prepare(`INSERT INTO membresias (id, nombre, precio, periodo, regla_uso) VALUES (?, ?, ?, ?, ?)`);
  insertMem.run(memRegularId, 'The Regular', 349, 'mensual', 'Uso o pérdida: sesiones no agendadas expiran sin reembolso.');
  insertMem.run(memVipId, 'VIP Tech', 599, 'mensual', 'Uso o pérdida: sesiones no agendadas expiran sin reembolso.');

  const insertFeature = db.prepare(`INSERT INTO membresias_caracteristicas (id, membresia_id, caracteristica) VALUES (?, ?, ?)`);
  insertFeature.run(uuidv4(), memRegularId, '1 corte técnico incluido al mes');
  insertFeature.run(uuidv4(), memRegularId, '1 perfilado de barba VIP incluido');
  insertFeature.run(uuidv4(), memRegularId, 'Prioridad de agendamiento (jueves a sábado)');
  insertFeature.run(uuidv4(), memRegularId, 'Muestra gratis de producto premium');
  insertFeature.run(uuidv4(), memRegularId, 'Cargo automático tokenizado vía Stripe');
  insertFeature.run(uuidv4(), memVipId, 'Servicios ilimitados de corte y estilizado');
  insertFeature.run(uuidv4(), memVipId, 'Tratamientos capilares avanzados con diagnóstico 3D');
  insertFeature.run(uuidv4(), memVipId, '15% descuento permanente en tienda retail');
  insertFeature.run(uuidv4(), memVipId, 'Acceso prioritario absoluto a agenda Master Barbers');
  insertFeature.run(uuidv4(), memVipId, 'Cargo automático tokenizado · Sin acumulación');

  // Products
  const insertProduct = db.prepare(`INSERT INTO productos (id, nombre, precio, categoria, stock, descripcion) VALUES (?, ?, ?, ?, ?, ?)`);
  insertProduct.run(uuidv4(), 'Pomada de Fijación Ligera', 180, 'Pomadas', 25, 'Fijación suave con acabado natural.');
  insertProduct.run(uuidv4(), 'Aceite para Barba con Péptidos', 240, 'Aceites', 15, 'Enriquecido con péptidos y probióticos.');
  insertProduct.run(uuidv4(), 'Sérum Capilar Premium', 280, 'Sueros', 12, 'Crecimiento saludable de la fibra capilar.');
  insertProduct.run(uuidv4(), 'Cera Modeladora Técnica', 200, 'Ceras', 18, 'Fijación fuerte con brillo natural.');
  insertProduct.run(uuidv4(), 'Tónico Capilar Refrescante', 190, 'Tónicos', 20, 'Con mentol y vitaminas esenciales.');
  insertProduct.run(uuidv4(), 'Peine Profesional Carbono', 150, 'Accesorios', 30, 'Fibra de carbono antiestática.');
  insertProduct.run(uuidv4(), 'Kit The Regular', 450, 'Kits', 8, 'Pomada + aceite + peine profesional.');
  insertProduct.run(uuidv4(), 'Toalla Caliente Premium', 60, 'Extras', 40, 'Toalla de algodón egipcio.');

  console.log('✅ Datos iniciales insertados correctamente.');
  console.log('   👤 Admin: admin@innovarebarber.tech / innovare2026');
  console.log('   👤 Cliente: cliente@demo.com / innovare2026');
}

module.exports = { getDatabase };