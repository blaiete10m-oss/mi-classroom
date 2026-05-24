const router  = require('express').Router();
const supabase = require('../supabase');

// ── POST /api/users/register ─────────────────────────────────
// Crea un usuario nuevo (lo llama la app de Figma tras el login)
router.post('/register', async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ error: 'Faltan campos: name, email, role' });

  const { data, error } = await supabase
    .from('users')
    .upsert({ name, email, role }, { onConflict: 'email', ignoreDuplicates: false })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ── POST /api/users/login ────────────────────────────────────
// "Login" simplificado: busca por email y devuelve el usuario
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Falta el campo email' });

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
});

// ── GET /api/users/:id ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
});

module.exports = router;