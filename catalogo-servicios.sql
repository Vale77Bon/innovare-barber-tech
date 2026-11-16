-- YA SE APLICÓ EN SUPABASE EL 16-NOV-2026. NO LO VUELVAS A CORRER:
-- duplicaría los 21 servicios. Se guarda solo como registro.
-- =====================================================================
-- Catálogo de servicios de Saulo & Amor Salón
-- Pegar en Supabase > SQL Editor y ejecutar una sola vez.
--
-- 1) Los servicios de barbería NO se borran (las citas anteriores los
--    usan), solo se desactivan. La página de reservas únicamente muestra
--    los servicios con activo = true.
-- 2) Precios propuestos en MXN con IVA, tomando como referencia estéticas
--    de Puebla. "Desde" significa que el precio final depende del largo.
-- =====================================================================

begin;

update public.servicios set activo = false where activo is true;

insert into public.servicios (nombre, precio, duracion_min, categoria, descripcion, activo) values
  -- Cabello
  ('Corte de dama',              250,  45, 'Cabello',      'Lavado, corte y secado.', true),
  ('Corte de caballero',         160,  30, 'Cabello',      'Corte con máquina y tijera.', true),
  ('Corte infantil',             140,  30, 'Cabello',      'Niñas y niños hasta 12 años.', true),
  ('Brushing',                   220,  40, 'Cabello',      'Lavado y secado con cepillo, liso u ondulado.', true),
  ('Peinado para evento',        450,  60, 'Cabello',      'Recogido, semirrecogido u ondas.', true),
  -- Color
  ('Retoque de raíz',            480,  90, 'Color',        'Tinte en raíz de hasta 3 cm.', true),
  ('Tinte completo',             650, 120, 'Color',        'Color de raíz a puntas; incluye diagnóstico capilar.', true),
  ('Baño de color o matiz',      420,  60, 'Color',        'Refresca el tono o neutraliza amarillos.', true),
  ('Mechas o luces',            1100, 180, 'Color',        'Desde; el precio final depende del largo.', true),
  ('Balayage',                  1600, 240, 'Color',        'Desde; aclarado degradado a mano alzada.', true),
  ('Decoloración',               850, 150, 'Color',        'Por sesión; requiere diagnóstico capilar previo.', true),
  -- Tratamientos
  ('Diagnóstico capilar',        100,  20, 'Tratamientos', 'Revisión de fibra y cuero cabelludo con ficha técnica.', true),
  ('Tratamiento hidratante',     400,  40, 'Tratamientos', 'Mascarilla y vapor para cabello seco.', true),
  ('Reconstrucción capilar',     650,  60, 'Tratamientos', 'Para cabello dañado por tinte, decoloración o plancha.', true),
  ('Botox capilar',             1100, 150, 'Tratamientos', 'Desde; nutrición profunda y control del frizz.', true),
  ('Keratina',                  1400, 180, 'Tratamientos', 'Desde; alaciado progresivo, el precio depende del largo.', true),
  -- Uñas
  ('Manicure tradicional',       170,  40, 'Uñas',         'Limado, cutícula y esmalte tradicional.', true),
  ('Manicure en gel',            300,  60, 'Uñas',         'Limado, cutícula y esmalte en gel.', true),
  ('Pedicure spa',               320,  60, 'Uñas',         'Exfoliación, hidratación y esmalte.', true),
  ('Uñas acrílicas',             420,  90, 'Uñas',         'Aplicación con diseño sencillo.', true),
  ('Retoque de acrílico',        320,  75, 'Uñas',         'Relleno de crecimiento.', true);

commit;
