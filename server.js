require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-user-id','x-user-role']
}));

app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EduClass API',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
