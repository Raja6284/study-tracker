const express = require('express');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function studentIdForRequest(req) {
  return req.user.role === 'STUDENT' ? req.user.id : req.query.studentId;
}

// Simple 3-level intensity so the calendar stays "not overly complicated":
// none / some / high, based on total minutes studied that day.
function levelFor(totalMinutes) {
  if (totalMinutes <= 0) return 'none';
  if (totalMinutes < 120) return 'some';
  return 'high';
}

// GET /api/calendar?month=2026-09&studentId=...
router.get('/', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });

  const month = req.query.month; // "YYYY-MM"
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month is required in YYYY-MM format' });
  }

  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const sessions = await prisma.studySession.findMany({
    where: { studentId, date: { gte: start, lt: end } },
    select: { date: true, durationMinutes: true },
  });

  const byDay = {};
  for (const s of sessions) {
    const key = s.date.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { totalMinutes: 0, sessionCount: 0 };
    byDay[key].totalMinutes += s.durationMinutes;
    byDay[key].sessionCount += 1;
  }

  const days = Object.entries(byDay).map(([date, v]) => ({
    date,
    totalMinutes: v.totalMinutes,
    sessionCount: v.sessionCount,
    level: levelFor(v.totalMinutes),
  }));

  res.json({ month, days });
});

module.exports = router;
