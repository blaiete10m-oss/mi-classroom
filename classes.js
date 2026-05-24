const router = require('express').Router();
const supabase = require('../supabase');

function genCode(name) {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

// GET CLASSES
router.get('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!userId || !role) {
    return res.status(401).json({ error: 'Missing auth headers' });
  }

  // TEACHER
  if (role === 'teacher') {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments:enrollments(count),
        tasks:tasks(count)
      `)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    return res.json(data.map(c => ({
      ...c,
      student_count: c.enrollments?.[0]?.count ?? 0,
      task_count: c.tasks?.[0]?.count ?? 0
    })));
  }

  // STUDENT
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      class_id,
      classes(*, users:users!classes_teacher_id_fkey(name))
    `)
    .eq('student_id', userId);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data.map(e => ({
    ...e.classes,
    teacher_name: e.classes.users?.name || 'Teacher'
  })));
});

// CREATE CLASS
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { name, section, room, color, icon } = req.body;

  if (!name) return res.status(400).json({ error: 'Missing name' });

  const code = genCode(name);

  const { data, error } = await supabase
    .from('classes')
    .insert({
      name,
      section,
      room,
      color,
      icon,
      code,
      teacher_id: userId
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json(data);
});

// JOIN CLASS
router.post('/join', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { code } = req.body;

  const { data: classData, error } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !classData) {
    return res.status(404).json({ error: 'Invalid class code' });
  }

  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert({
      class_id: classData.id,
      student_id: userId
    }, {
      onConflict: 'class_id,student_id'
    });

  if (enrollError) return res.status(400).json({ error: enrollError.message });

  res.json({ message: 'Joined class', class: classData });
});

// DELETE CLASS
router.delete('/:id', async (req, res) => {
  const userId = req.headers['x-user-id'];

  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', req.params.id)
    .eq('teacher_id', userId);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: 'Class deleted' });
});

module.exports = router;
