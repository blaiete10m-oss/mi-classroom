const router   = require('express').Router();
const supabase  = require('../supabase');
const { v4: uuid } = require('uuid');

// Genera código único tipo "FIS-3A01"
function genCode(name) {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix  = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

// ── GET /api/classes ─────────────────────────────────────────
// Profesor: todas sus clases con conteo de alumnos y tareas
// Estudiante: todas las clases en las que está inscrito
router.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];
  if (!userId || !role) return res.status(401).json({ error: 'Faltan headers x-user-id y x-user-role' });

  if (role === 'teacher') {
    // Clases creadas por el profesor + count de alumnos inscritos
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments(count),
        tasks(count)
      `)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    const result = data.map(c => ({
      ...c,
      student_count: c.enrollments[0]?.count ?? 0,
      task_count:    c.tasks[0]?.count ?? 0,
    }));
    return res.json(result);
  }

  // Estudiante: clases en las que está inscrito
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      class_id,
      classes(
        *,
        users!classes_teacher_id_fkey(name)
      )
    `)
    .eq('student_id', userId);

  if (error) return res.status(400).json({ error: error.message });

  const result = data.map(e => ({
    ...e.classes,
    teacher_name: e.classes.users?.name ?? 'Profesor',
  }));
  res.json(result);
});

// ── GET /api/classes/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('classes')
    .select(`*, users!classes_teacher_id_fkey(name, email)`)
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Clase no encontrada' });
  res.json(data);
});

// ── POST /api/classes ────────────────────────────────────────
// Solo profesores
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, section, room, color, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'El campo name es obligatorio' });

  const code = genCode(name);

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name,
      section: section || '',
      room:    room    || '',
      color:   color   || 'green',
      icon:    icon    || '📖',
      code,
      teacher_id: userId
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ── POST /api/classes/join ───────────────────────────────────
// Estudiante se une a una clase con código
router.post('/join', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Falta el código de clase' });

  // Buscar la clase por código
  const { data: classData, error: classErr } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (classErr || !classData) return res.status(404).json({ error: 'Código de clase no válido' });

  // Inscribir al alumno (upsert para no duplicar)
  const { error: enrollErr } = await supabase
    .from('enrollments')
    .upsert({ class_id: classData.id, student_id: userId }, { onConflict: 'class_id,student_id', ignoreDuplicates: true });

  if (enrollErr) return res.status(400).json({ error: enrollErr.message });

  res.json({ message: `Te uniste a "${classData.name}"`, class: classData });
});

// ── GET /api/classes/:id/students ───────────────────────────
// Profesor ve los alumnos de una clase
router.get('/:id/students', async (req, res) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      users!enrollments_student_id_fkey(id, name, email)
    `)
    .eq('class_id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data.map(e => e.users));
});

// ── DELETE /api/classes/:id ──────────────────────────────────
router.delete('/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', req.params.id)
    .eq('teacher_id', userId); // solo el dueño puede borrar

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Clase eliminada' });
});

module.exports = router;