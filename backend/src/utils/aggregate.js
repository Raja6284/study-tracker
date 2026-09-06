const { accuracy } = require('./calc');

// Turns a flat list of sessions (with subject/topic included) into the
// descriptive breakdowns used by weekly/monthly reports and subject/topic
// history. Purely arithmetic — no judgments, no recommendations.
function summarizeSessions(sessions) {
  const summary = {
    totalMinutes: 0,
    sessionCount: sessions.length,
    activeDays: new Set(),
    questionsAttempted: 0,
    questionsCorrect: 0,
    questionsIncorrect: 0,
    attachmentsCount: 0,
    revisionSessions: 0,
    bySubject: {},
    byActivityType: {},
    byTopic: {},
    byDate: {},
  };

  for (const s of sessions) {
    summary.totalMinutes += s.durationMinutes;
    summary.activeDays.add(s.date.toISOString().slice(0, 10));
    summary.questionsAttempted += s.questionsAttempted || 0;
    summary.questionsCorrect += s.questionsCorrect || 0;
    summary.questionsIncorrect += s.questionsIncorrect || 0;
    summary.attachmentsCount += (s.attachments || []).length;
    if (s.activityType === 'REVISION') summary.revisionSessions += 1;

    const subjName = s.subject?.name || 'Unknown';
    summary.bySubject[subjName] = (summary.bySubject[subjName] || 0) + s.durationMinutes;

    summary.byActivityType[s.activityType] = (summary.byActivityType[s.activityType] || 0) + s.durationMinutes;

    const topicName = s.topic?.name || 'Unknown';
    if (!summary.byTopic[topicName]) summary.byTopic[topicName] = { minutes: 0, sessions: 0 };
    summary.byTopic[topicName].minutes += s.durationMinutes;
    summary.byTopic[topicName].sessions += 1;

    const dateKey = s.date.toISOString().slice(0, 10);
    summary.byDate[dateKey] = (summary.byDate[dateKey] || 0) + s.durationMinutes;
  }

  return {
    totalMinutes: summary.totalMinutes,
    sessionCount: summary.sessionCount,
    activeDaysCount: summary.activeDays.size,
    questionsAttempted: summary.questionsAttempted,
    questionsCorrect: summary.questionsCorrect,
    questionsIncorrect: summary.questionsIncorrect,
    accuracy: accuracy(summary.questionsCorrect, summary.questionsAttempted),
    attachmentsCount: summary.attachmentsCount,
    revisionSessions: summary.revisionSessions,
    bySubject: summary.bySubject,
    byActivityType: summary.byActivityType,
    byTopic: summary.byTopic,
    byDate: summary.byDate,
  };
}

module.exports = { summarizeSessions };
