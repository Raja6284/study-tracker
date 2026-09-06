const express = require('express');
const prisma = require('../prismaClient');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/me', (req, res) => res.json(req.user));

// Mentor needs to pick which student's data to view (there's normally just
// one, but this keeps it correct if a second student account is ever added).
router.get('/students', requireRole('MENTOR'), async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true },
  });
  res.json(students);
});

module.exports = router;
