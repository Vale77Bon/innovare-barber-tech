-- ===== Seed Data - Innovare Barber Tech =====
-- Se ejecuta automáticamente al iniciar el contenedor PostgreSQL

-- Contraseña hasheada de "innovare2026" (bcrypt)
-- En producción usar un script JS para generar hashes, esto es para desarrollo
-- El server.js regenerará los hashes correctamente al iniciar

-- Insertar usuarios solo si no existen
INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'Admin Barber', 'admin@innovarebarber.tech', '$2a$10$dummy', '2221175554', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@innovarebarber.tech');

INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'Cliente Demo', 'cliente@demo.com', '$2a$10$dummy', '5551001000', 'cliente'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'cliente@demo.com');

INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'Alex Martínez', 'alex@innovarebarber.tech', '$2a$10$dummy', '5551002001', 'barbero'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'alex@innovarebarber.tech');

INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'Carlos Gómez', 'carlos@innovarebarber.tech', '$2a$10$dummy', '5551002002', 'barbero'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'carlos@innovarebarber.tech');

INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'Miguel Torres', 'miguel@innovarebarber.tech', '$2a$10$dummy', '5551002003', 'barbero'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'miguel@innovarebarber.tech');

INSERT INTO usuarios (nombre, email, password_hash, telefono, rol) 
SELECT 'David Rojas', 'david@innovarebarber.tech', '$2a$10$dummy', '5551002004', 'barbero'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'david@innovarebarber.tech');

-- Barbers
INSERT INTO barberos (nombre, especialidad, rol_barberia, rating, experiencia)
SELECT 'Alex Martínez', 'Cortes Clásicos', 'Master Barber', 4.9, 8
WHERE NOT EXISTS (SELECT 1 FROM barberos WHERE nombre = 'Alex Martínez');

INSERT INTO barberos (nombre, especialidad, rol_barberia, rating, experiencia)
SELECT 'Carlos Gómez', 'Barbas y Perfilados VIP', 'Barber Tech', 4.8, 6
WHERE NOT EXISTS (SELECT 1 FROM barberos WHERE nombre = 'Carlos Gómez');

INSERT INTO barberos (nombre, especialidad, rol_barberia, rating, experiencia)
SELECT 'Miguel Torres', 'Degradados Modernos / AR', 'Operador AR', 4.9, 5
WHERE NOT EXISTS (SELECT 1 FROM barberos WHERE nombre = 'Miguel Torres');

INSERT INTO barberos (nombre, especialidad, rol_barberia, rating, experiencia)
SELECT 'David Rojas', 'Estilos Premium / Diagnóstico', 'Esp. Diagnóstico', 4.7, 10
WHERE NOT EXISTS (SELECT 1 FROM barberos WHERE nombre = 'David Rojas');

-- Services
INSERT INTO servicios (nombre, precio, duracion_min, categoria, descripcion) VALUES
('Corte & Estilo Técnico', 180, 45, 'corte', 'Desvanecidos degradados avanzados, curly fades y loose crops.'),
('Corte Degradado Premium (Fade)', 250, 50, 'corte', 'Degradado profesional con difuminado perfecto.'),
('Perfilado de Barba VIP', 150, 30, 'barba', 'Toalla caliente con vapor de ozono.'),
('Corte + Barba (Combo Técnico)', 280, 60, 'combo', 'Corte completo + perfilado de barba con vapor.'),
('Escáner Capilar 3D', 200, 15, 'diagnostico', 'Microscopía digital 50x en 5 zonas críticas.'),
('Simulación AR (Espejo Inteligente)', 100, 10, 'ar', 'Previsualiza cortes y colores en tiempo real.'),
('Afeitado Clásico con Navaja', 200, 35, 'afeitado', 'Navaja libre de máxima higiene.'),
('Lavado + Masaje + Ozono', 120, 20, 'extra', 'Vapor de ozono para apertura de poros.')
ON CONFLICT DO NOTHING;

-- Memberships
INSERT INTO membresias (nombre, precio, periodo, regla_uso) VALUES
('The Regular', 349, 'mensual', 'Uso o pérdida: sesiones no agendadas expiran sin reembolso.'),
('VIP Tech', 599, 'mensual', 'Uso o pérdida: sesiones no agendadas expiran sin reembolso.')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO productos (nombre, precio, categoria, stock, descripcion) VALUES
('Pomada de Fijación Ligera', 180, 'Pomadas', 25, 'Fijación suave con acabado natural.'),
('Aceite para Barba con Péptidos', 240, 'Aceites', 15, 'Enriquecido con péptidos y probióticos.'),
('Sérum Capilar Premium', 280, 'Sueros', 12, 'Crecimiento saludable de la fibra capilar.'),
('Cera Modeladora Técnica', 200, 'Ceras', 18, 'Fijación fuerte con brillo natural.'),
('Tónico Capilar Refrescante', 190, 'Tónicos', 20, 'Con mentol y vitaminas esenciales.'),
('Peine Profesional Carbono', 150, 'Accesorios', 30, 'Fibra de carbono antiestática.'),
('Kit The Regular', 450, 'Kits', 8, 'Pomada + aceite + peine profesional.'),
('Toalla Caliente Premium', 60, 'Extras', 40, 'Toalla de algodón egipcio.')
ON CONFLICT DO NOTHING;