require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: '*', // en producción cambia a tu dominio exacto
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-user-id','x-user-role']
}));

app.use(express.json());

// ── RUTAS ────────────────────────────────────────────────────
app.use('/api/users',         require('./routes/users'));
app.use('/api/classes',       require('./routes/classes'));
app.use('/api/tasks',         require('./routes/tasks'));
app.use('/api/submissions',   require('./routes/submissions'));
app.use('/api/announcements', require('./routes/announcements'));

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status: 'ok',
  app: 'EduClass API',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

// ── ERROR GLOBAL ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ EduClass API corriendo en puerto ${PORT}`));