// ===== SERVER.JS - Express API + PostgreSQL - Innovare Barber Tech =====
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'innovare_barber_tech_secret_2026';

// PostgreSQL Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'innovare_barber',
  user: process.env.DB_USER || 'innovare_user',
  password: process.env.DB_PASSWORD || 'innovare_pass_2026',
});

// Test DB connection and seed admin user
async function initDB() {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL');
    
    // Seed initial users (passwords will be hashed)
    const hash = await bcrypt.hash('innovare2026', 10);
    
    const users = [
      { nombre: 'Admin Barber', email: 'admin@innovarebarber.tech', rol: 'admin', telefono: '2221175554' },
      { nombre: 'Cliente Demo', email: 'cliente@demo.com', rol: 'cliente', telefono: '5551001000' }
    ];
    
    for (const u of users) {
      await client.query(
        `INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (email) DO NOTHING`,
        [u.nombre, u.email, hash, u.telefono, u.rol]
      );
    }
    
    client.release();
    console.log('✅ Usuarios iniciales listos');
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.log('   ¿Ejecutaste: docker compose up -d ?');
  }
}

initDB();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://innovare-barber-tech.vercel.app', 'https://*.vercel.app']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

// ===== AUTH =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'Acceso denegado' });
    next();
  };
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE', [email]);
    const user = result.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;
    if (!nombre || !email || !telefono || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    // Crear usuario
    await pool.query(
      `INSERT INTO usuarios (id, nombre, email, password_hash, telefono, rol, activo) 
       VALUES ($1, $2, $3, $4, $5, 'cliente', TRUE)`,
      [id, nombre, email, password_hash, telefono]
    );

    // Auto-login: generar token
    const token = jwt.sign(
      { id, email, nombre, rol: 'cliente' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userData = { id, nombre, email, telefono, rol: 'cliente' };
    res.status(201).json({ token, user: userData });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const result = await pool.query('SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = $1', [req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

// ===== BARBEROS =====
app.get('/api/barberos', async (req, res) => {
  const result = await pool.query('SELECT id, nombre, especialidad, rol_barberia, rating, experiencia FROM barberos WHERE activo = TRUE');
  res.json(result.rows);
});

// ===== SERVICIOS =====
app.get('/api/servicios', async (req, res) => {
  const result = await pool.query('SELECT * FROM servicios WHERE activo = TRUE');
  res.json(result.rows);
});

// ===== CITAS =====
app.post('/api/citas', authenticateToken, async (req, res) => {
  const { barbero_id, servicio_id, fecha, hora } = req.body;
  if (!barbero_id || !servicio_id || !fecha || !hora) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  
  const servResult = await pool.query('SELECT precio FROM servicios WHERE id = $1', [servicio_id]);
  if (servResult.rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
  
  const deposito = Math.min(parseFloat(servResult.rows[0].precio) * 0.3, 100);
  const id = uuidv4();
  
  await pool.query(
    `INSERT INTO citas (id, cliente_id, barbero_id, servicio_id, fecha, hora, estado, deposito_garantia)
     VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7)`,
    [id, req.user.id, barbero_id, servicio_id, fecha, hora, deposito]
  );
  
  res.json({ id, deposito, message: 'Cita creada' });
});

app.get('/api/citas', authenticateToken, async (req, res) => {
  let query;
  if (req.user.rol === 'admin') {
    query = `SELECT c.*, b.nombre as barbero_nombre, s.nombre as servicio_nombre, s.precio as servicio_precio
             FROM citas c JOIN barberos b ON c.barbero_id = b.id JOIN servicios s ON c.servicio_id = s.id
             ORDER BY c.fecha DESC, c.hora DESC`;
    const result = await pool.query(query);
    return res.json(result.rows);
  }
  query = `SELECT c.*, b.nombre as barbero_nombre, s.nombre as servicio_nombre, s.precio as servicio_precio
           FROM citas c JOIN barberos b ON c.barbero_id = b.id JOIN servicios s ON c.servicio_id = s.id
           WHERE c.cliente_id = $1 ORDER BY c.fecha DESC, c.hora DESC`;
  const result = await pool.query(query, [req.user.id]);
  res.json(result.rows);
});

// ===== DIAGNÓSTICOS 3D =====
app.post('/api/diagnosticos', authenticateToken, async (req, res) => {
  const { imagen_url, resultado_ia, zonas_analizadas, recomendaciones } = req.body;
  const id = uuidv4();
  await pool.query(
    `INSERT INTO diagnosticos_3d (id, cliente_id, imagen_url, resultado_ia, zonas_analizadas, recomendaciones)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, req.user.id, imagen_url, resultado_ia, zonas_analizadas || 5, recomendaciones]
  );
  res.json({ id, message: 'Diagnóstico guardado' });
});

app.get('/api/diagnosticos', authenticateToken, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM diagnosticos_3d WHERE cliente_id = $1 ORDER BY fecha DESC LIMIT 10',
    [req.user.id]
  );
  res.json(result.rows);
});

// ===== SMART MIRROR - IA Facial =====
app.post('/api/smart-mirror/analyze', async (req, res) => {
  const { imageData } = req.body;
  if (!imageData) return res.status(400).json({ error: 'Imagen requerida' });

  // IA facial simulada (en producción: Face++ / Azure Face API)
  const analysis = {
    success: true,
    timestamp: new Date().toISOString(),
    faceDetected: true,
    faceShape: ['Ovalado', 'Redondo', 'Cuadrado', 'Diamante', 'Corazón'][Math.floor(Math.random() * 5)],
    hairAnalysis: {
      density: ['Alta', 'Media', 'Baja'][Math.floor(Math.random() * 3)],
      texture: ['Lisa', 'Ondulada', 'Rizada', 'Crespa'][Math.floor(Math.random() * 4)],
      healthScore: Math.floor(Math.random() * 25) + 75,
      scalpCondition: ['Normal', 'Seca', 'Grasa', 'Mixta'][Math.floor(Math.random() * 4)]
    },
    recommendedStyles: [
      { name: 'Degradado Clásico', match: Math.floor(Math.random() * 15) + 85 },
      { name: 'Corte Texturizado', match: Math.floor(Math.random() * 15) + 80 },
      { name: 'Estilo Pompadour', match: Math.floor(Math.random() * 10) + 75 }
    ],
    recommendations: [
      'Shampoo con biotina para fortalecer folículo capilar',
      'Aceite de argán diariamente para hidratación profunda',
      'Evitar lavados diarios (balance natural de sebo)'
    ]
  };
  res.json(analysis);
});

// ===== STATS (Admin only) =====
app.get('/api/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  const total = await pool.query('SELECT COUNT(*) as c FROM citas');
  const pendientes = await pool.query("SELECT COUNT(*) as c FROM citas WHERE estado IN ('pendiente','confirmada')");
  const completadas = await pool.query("SELECT COUNT(*) as c FROM citas WHERE estado = 'completada'");
  const clientes = await pool.query("SELECT COUNT(*) as c FROM usuarios WHERE rol = 'cliente'");
  res.json({
    totalCitas: parseInt(total.rows[0].c),
    pendientes: parseInt(pendientes.rows[0].c),
    completadas: parseInt(completadas.rows[0].c),
    clientes: parseInt(clientes.rows[0].c)
  });
});

// ===== SERVE FRONTEND =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Exportar para Vercel (serverless)
module.exports = app;

// Solo escuchar en puerto si no está en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`💈 Innovare Barber Tech API corriendo en http://localhost:${PORT}`);
  });
}
