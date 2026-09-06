const express = require('express');
const prisma = require('../prismaClient');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload, cloudinary, uploadFilesToCloudinary } = require('../middleware/upload');
const { minutesBetween } = require('../utils/calc');
const { ACTIVITY_TYPES, VALID_VALUES } = require('../utils/activityTypes');

const router = express.Router();
router.use(requireAuth);

router.get('/activity-types', (req, res) => res.json(ACTIVITY_TYPES));

// Every student is only ever looking at / editing their own data. The
// mentor is read-only and can view any student's data (there's one student
// in this app, but this keeps the door open for more).
function studentIdForRequest(req) {
  return req.user.role === 'STUDENT' ? req.user.id : req.query.studentId;
}

const SESSION_INCLUDE = {
  subject: true,
  topic: true,
  attachments: true,
};

// ---- Create a session (student only) --------------------------------
router.post('/', requireRole('STUDENT'), upload.array('attachments', 10), async (req, res) => {
  try {
    const {
      date, startTime, endTime, subjectId, topicId, activityType,
      description, questionsAttempted, questionsCorrect, questionsIncorrect, notes,
    } = req.body;

    if (!date || !startTime || !endTime || !subjectId || !topicId || !activityType) {
      return res.status(400).json({ error: 'date, startTime, endTime, subjectId, topicId, activityType are required' });
    }
    if (!VALID_VALUES.includes(activityType)) {
      return res.status(400).json({ error: `activityType must be one of ${VALID_VALUES.join(', ')}` });
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }
    const durationMinutes = minutesBetween(start, end);
    const attachmentData = await uploadFilesToCloudinary(req.files);

    const session = await prisma.studySession.create({
      data: {
        studentId: req.user.id,
        date: new Date(date),
        startTime: start,
        endTime: end,
        durationMinutes,
        subjectId,
        topicId,
        activityType,
        description: description || null,
        questionsAttempted: questionsAttempted ? parseInt(questionsAttempted, 10) : null,
        questionsCorrect: questionsCorrect ? parseInt(questionsCorrect, 10) : null,
        questionsIncorrect: questionsIncorrect ? parseInt(questionsIncorrect, 10) : null,
        notes: notes || null,
        attachments: { create: attachmentData },
      },
      include: SESSION_INCLUDE,
    });

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create study session' });
  }
});

// ---- Edit a session (student only, own sessions) ---------------------
router.put('/:id', requireRole('STUDENT'), upload.array('attachments', 10), async (req, res) => {
  try {
    const existing = await prisma.studySession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.studentId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const {
      date, startTime, endTime, subjectId, topicId, activityType,
      description, questionsAttempted, questionsCorrect, questionsIncorrect, notes,
    } = req.body;

    const data = {};
    let start = existing.startTime;
    let end = existing.endTime;
    const effDate = date || existing.date.toISOString().slice(0, 10);

    if (startTime) start = new Date(`${effDate}T${startTime}`);
    if (endTime) end = new Date(`${effDate}T${endTime}`);
    if (date) data.date = new Date(date);
    if (startTime || endTime || date) {
      if (end <= start) return res.status(400).json({ error: 'endTime must be after startTime' });
      data.startTime = start;
      data.endTime = end;
      data.durationMinutes = minutesBetween(start, end);
    }
    if (subjectId) data.subjectId = subjectId;
    if (topicId) data.topicId = topicId;
    if (activityType) {
      if (!VALID_VALUES.includes(activityType)) {
        return res.status(400).json({ error: `activityType must be one of ${VALID_VALUES.join(', ')}` });
      }
      data.activityType = activityType;
    }
    if (description !== undefined) data.description = description || null;
    if (questionsAttempted !== undefined) data.questionsAttempted = questionsAttempted ? parseInt(questionsAttempted, 10) : null;
    if (questionsCorrect !== undefined) data.questionsCorrect = questionsCorrect ? parseInt(questionsCorrect, 10) : null;
    if (questionsIncorrect !== undefined) data.questionsIncorrect = questionsIncorrect ? parseInt(questionsIncorrect, 10) : null;
    if (notes !== undefined) data.notes = notes || null;

    if (req.files && req.files.length) {
      const attachmentData = await uploadFilesToCloudinary(req.files);
      data.attachments = { create: attachmentData };
    }

    const session = await prisma.studySession.update({
      where: { id: req.params.id },
      data,
      include: SESSION_INCLUDE,
    });

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update study session' });
  }
});

// ---- Delete a session (student only, own) ----------------------------
router.delete('/:id', requireRole('STUDENT'), async (req, res) => {
  const existing = await prisma.studySession.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.studentId !== req.user.id) {
    return res.status(404).json({ error: 'Session not found' });
  }
  // Best-effort cleanup of Cloudinary assets so storage doesn't accumulate orphans.
  const attachments = await prisma.attachment.findMany({ where: { studySessionId: existing.id } });
  await Promise.all(
    attachments.map((a) => cloudinary.uploader.destroy(a.cloudinaryPublicId, { resource_type: a.resourceType }).catch(() => {}))
  );
  await prisma.studySession.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Remove a single attachment from a session ------------------------
router.delete('/:id/attachments/:attachmentId', requireRole('STUDENT'), async (req, res) => {
  const session = await prisma.studySession.findUnique({ where: { id: req.params.id } });
  if (!session || session.studentId !== req.user.id) return res.status(404).json({ error: 'Session not found' });
  const attachment = await prisma.attachment.findUnique({ where: { id: req.params.attachmentId } });
  if (!attachment || attachment.studySessionId !== session.id) return res.status(404).json({ error: 'Attachment not found' });

  await cloudinary.uploader.destroy(attachment.cloudinaryPublicId, { resource_type: attachment.resourceType }).catch(() => {});
  await prisma.attachment.delete({ where: { id: attachment.id } });
  res.status(204).end();
});

// ---- Get one session --------------------------------------------------
router.get('/:id', async (req, res) => {
  const session = await prisma.studySession.findUnique({ where: { id: req.params.id }, include: SESSION_INCLUDE });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (req.user.role === 'STUDENT' && session.studentId !== req.user.id) {
    return res.status(403).json({ error: 'Not your session' });
  }
  res.json(session);
});

// ---- List / filter sessions --------------------------------------------
// Backs the daily dashboard, history table, and subject/topic drill-down.
// Query params: date, dateFrom, dateTo, subjectId, topicId, activityType, studentId (mentor only)
router.get('/', async (req, res) => {
  const studentId = studentIdForRequest(req);
  if (!studentId) return res.status(400).json({ error: 'studentId is required for mentor queries' });

  const { date, dateFrom, dateTo, subjectId, topicId, activityType } = req.query;
  const where = { studentId };

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.date = { gte: d, lt: next };
  } else if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }
  if (subjectId) where.subjectId = subjectId;
  if (topicId) where.topicId = topicId;
  if (activityType) where.activityType = activityType;

  const sessions = await prisma.studySession.findMany({
    where,
    include: SESSION_INCLUDE,
    orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
  });

  res.json(sessions);
});

module.exports = router;
