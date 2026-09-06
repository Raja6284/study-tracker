const express = require('express');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// List subjects with their topics (used to populate the session form dropdowns)
router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    include: { topics: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  res.json(subjects);
});

// Either role can add a subject/topic on the fly while logging a session,
// so the student never has to stop and go find an admin screen first.
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const subject = await prisma.subject.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: 'Could not create subject' });
  }
});

router.post('/:subjectId/topics', async (req, res) => {
  const { subjectId } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const topic = await prisma.topic.upsert({
      where: { subjectId_name: { subjectId, name: name.trim() } },
      update: {},
      create: { subjectId, name: name.trim() },
    });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ error: 'Could not create topic (check subjectId)' });
  }
});

module.exports = router;
