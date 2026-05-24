-- ═══════════════════════════════════════════════════════════
--  EDUCLASS — Schema completo para Supabase
--  Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════

-- Limpiar tablas si ya existen (orden inverso por FK)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─── USUARIOS ───────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_color TEXT DEFAULT '#1a472a',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLASES ─────────────────────────────────────────────────
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  section     TEXT,
  room        TEXT,
  color       TEXT DEFAULT 'green',
  icon        TEXT DEFAULT '📖',
  code        TEXT UNIQUE NOT NULL,       -- código para unirse (ej. FIS-3A01)
  teacher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INSCRIPCIONES (alumno ↔ clase) ─────────────────────────
CREATE TABLE enrollments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- ─── ANUNCIOS ───────────────────────────────────────────────
CREATE TABLE announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TAREAS ─────────────────────────────────────────────────
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  points      INTEGER DEFAULT 100,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ENTREGAS ───────────────────────────────────────────────
CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer      TEXT,
  grade       NUMERIC(4,1),              -- ej. 9.5
  feedback    TEXT,                       -- comentario del profesor
  status      TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at   TIMESTAMPTZ,
  UNIQUE(task_id, student_id)
);

-- ═══════════════════════════════════════════════════════════
--  DATOS DE DEMO (opcional, para probar sin registrarse)
-- ═══════════════════════════════════════════════════════════

-- Usuarios demo
INSERT INTO users (id, name, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Prof. Martínez', 'profesor@demo.com', 'teacher'),
  ('00000000-0000-0000-0000-000000000002', 'Ana García',     'ana@demo.com',      'student'),
  ('00000000-0000-0000-0000-000000000003', 'Luis Torres',    'luis@demo.com',     'student'),
  ('00000000-0000-0000-0000-000000000004', 'María López',    'maria@demo.com',    'student');

-- Clases demo
INSERT INTO classes (id, name, section, room, color, icon, code, teacher_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Física Moderna',     '3°A', 'Lab. 204', 'green',  '⚛️',  'FIS-3A01', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Historia Universal',  '2°C', 'Aula 7',   'orange', '🏛️', 'HIS-2C01', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Matemáticas 3°B',    '3°B', 'Aula 12',  'blue',   '📐',  'MAT-3B01', '00000000-0000-0000-0000-000000000001');

-- Inscripciones demo
INSERT INTO enrollments (class_id, student_id) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004');

-- Tareas demo
INSERT INTO tasks (id, class_id, teacher_id, title, description, due_date, points, status) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Ejercicios cap. 5', 'Resuelve los ejercicios 1 al 20 del capítulo 5. Muestra el procedimiento completo.', '2026-05-25', 100, 'active'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Ensayo Rev. Industrial', 'Escribe un ensayo de 3 páginas sobre las causas de la Revolución Industrial.', '2026-05-20', 80, 'active');

-- Anuncio demo
INSERT INTO announcements (class_id, author_id, title, body) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Examen parcial el viernes', 'Recordatorio: el examen parcial es el próximo viernes. Repasen álgebra lineal y cálculo diferencial.');

-- Entrega demo (Ana ya entregó)
INSERT INTO submissions (task_id, student_id, answer, grade, feedback, status, graded_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   'Adjunto mis respuestas a los ejercicios 1-20.', 9.5, 'Excelente trabajo, muy detallado.', 'graded', NOW());