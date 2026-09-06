const express = require('express');
const prisma = require('../prismaClient');
const { requireAuth } = require('../middleware/auth');
const { summarizeSessions } = require('../utils/aggregate');
const { accuracy } = require('../utils/calc');

const router = express.Router();
router.use(requireAuth);

function studentIdForRequest(req) {
  return req.user.role === 'STUDENT' ? req.user.id : req.query.studentId;
}

const INCLUDE = { subject: true, topic: true, attachments: true };

// ---- Weekly report ------------------------------------------------------
// GET /api/reports/weekly?start=YYYY-MM-DD&studentId=...
// `start` is the first day of the 7-day window (inclusive).
router.get('/weekly', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });
  if (!req.query.start) return res.status(400).json({ error: 'start (YYYY-MM-DD) is required' });

  const start = new Date(`${req.query.start}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const sessions = await prisma.studySession.findMany({
    where: { studentId, date: { gte: start, lt: end } },
    include: INCLUDE,
  });

  const summary = summarizeSessions(sessions);
  res.json({
    rangeStart: start.toISOString().slice(0, 10),
    rangeEnd: new Date(end.getTime() - 86400000).toISOString().slice(0, 10),
    activeDaysOutOf: 7,
    ...summary,
  });
});

// ---- Monthly report -------------------------------------------------------
// GET /api/reports/monthly?month=YYYY-MM&studentId=...
router.get('/monthly', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });

  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month is required in YYYY-MM format' });
  }

  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const prevStart = new Date(start);
  prevStart.setMonth(prevStart.getMonth() - 1);
  const prevEnd = start;

  const [sessions, prevSessions] = await Promise.all([
    prisma.studySession.findMany({ where: { studentId, date: { gte: start, lt: end } }, include: INCLUDE }),
    prisma.studySession.findMany({ where: { studentId, date: { gte: prevStart, lt: prevEnd } }, include: INCLUDE }),
  ]);

  const summary = summarizeSessions(sessions);
  const prevSummary = summarizeSessions(prevSessions);
  const daysInMonth = Math.round((end - start) / 86400000);

  res.json({
    month,
    daysInMonth,
    ...summary,
    comparisonWithPreviousMonth: {
      previousMonthMinutes: prevSummary.totalMinutes,
      currentMonthMinutes: summary.totalMinutes,
      differenceMinutes: summary.totalMinutes - prevSummary.totalMinutes,
    },
  });
});

// ---- Subject history ------------------------------------------------------
// GET /api/reports/subject/:subjectId?studentId=...
router.get('/subject/:subjectId', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });

  const subject = await prisma.subject.findUnique({ where: { id: req.params.subjectId } });
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const sessions = await prisma.studySession.findMany({
    where: { studentId, subjectId: req.params.subjectId },
    include: INCLUDE,
    orderBy: { date: 'asc' },
  });

  const summary = summarizeSessions(sessions);
  const topics = Object.entries(summary.byTopic).map(([name, v]) => ({ name, ...v }));

  res.json({
    subject: subject.name,
    firstStudied: sessions[0]?.date.toISOString().slice(0, 10) || null,
    lastStudied: sessions[sessions.length - 1]?.date.toISOString().slice(0, 10) || null,
    ...summary,
    topics,
  });
});

// ---- Topic history --------------------------------------------------------
// GET /api/reports/topic/:topicId?studentId=...
router.get('/topic/:topicId', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });

  const topic = await prisma.topic.findUnique({ where: { id: req.params.topicId }, include: { subject: true } });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });

  const sessions = await prisma.studySession.findMany({
    where: { studentId, topicId: req.params.topicId },
    include: INCLUDE,
    orderBy: { date: 'asc' },
  });

  const summary = summarizeSessions(sessions);

  res.json({
    topic: topic.name,
    subject: topic.subject.name,
    firstStudied: sessions[0]?.date.toISOString().slice(0, 10) || null,
    lastStudied: sessions[sessions.length - 1]?.date.toISOString().slice(0, 10) || null,
    totalMinutes: summary.totalMinutes,
    sessionCount: summary.sessionCount,
    questionsAttempted: summary.questionsAttempted,
    questionsCorrect: summary.questionsCorrect,
    questionsIncorrect: summary.questionsIncorrect,
    accuracy: accuracy(summary.questionsCorrect, summary.questionsAttempted),
    revisionSessions: summary.revisionSessions,
    attachmentsCount: summary.attachmentsCount,
    sessions: sessions.map((s) => ({
      id: s.id,
      date: s.date.toISOString().slice(0, 10),
      activityType: s.activityType,
      durationMinutes: s.durationMinutes,
    })),
  });
});

module.exports = router;
