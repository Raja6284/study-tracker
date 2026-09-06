require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./prismaClient');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subjectRoutes = require('./routes/subjects');
const sessionRoutes = require('./routes/sessions');
const calendarRoutes = require('./routes/calendar');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors('*'));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/keep-alive', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Study tracker API listening on port ${PORT}`));
