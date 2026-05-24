const router = require('express').Router();
const supabase = require('../supabase');

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ name, email, role }, { onConflict: 'email' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
});

// LOGIN (fake simple)
router.post('/login', async (req, res) => {
  const { email } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });

  res.json(data);
});

// GET BY ID
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'User not found' });

  res.json(data);
});

module.exports = router;
