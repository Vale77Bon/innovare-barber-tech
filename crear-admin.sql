-- ===== CREAR USUARIO ADMIN EN SUPABASE =====
-- Sigue estos pasos:

-- PASO 1: Crear usuario en Supabase Auth
-- Ve a: https://supabase.com/dashboard
-- 1. Abre tu proyecto
-- 2. Ve a Authentication → Users
-- 3. Haz clic en "Add User"
-- 4. Ingresa:
--    Email: admin@innovarebarber.tech
--    Password: innovare2026
--    Marca "Auto-confirm user"
-- 5. Haz clic en "Create User"
-- 6. Copia el UUID del usuario creado (ej: 123e4567-e89b-12d3-a456-426614174000)

-- PASO 2: Ejecuta este SQL en SQL Editor con el UUID del usuario:
-- Reemplaza 'UUID-DEL-USUARIO' con el UUID que copiaste

INSERT INTO usuarios (id, nombre, email, telefono, rol, activo) VALUES
  ('UUID-DEL-USUARIO', 'Admin Barber', 'admin@innovarebarber.tech', '2221175554', 'admin', true)
ON CONFLICT (id) DO UPDATE SET
  nombre = 'Admin Barber',
  email = 'admin@innovarebarber.tech',
  telefono = '2221175554',
  rol = 'admin',
  activo = true;

-- PASO 3: Verifica que el usuario tenga el rol en user_metadata
-- Ve a Authentication → Users
-- Haz clic en el usuario admin@innovarebarber.tech
-- En "User Metadata" debería tener: {"nombre": "Admin Barber", "rol": "admin"}
-- Si no lo tiene, edítalo manualmente

-- ===== ALTERNATIVA: Crear usuario desde código =====
-- Si prefieres crear el admin desde el login, usa estas credenciales:
-- Email: admin@innovarebarber.tech
-- Password: innovare2026
-- Luego actualiza el rol manualmente en la tabla usuarios