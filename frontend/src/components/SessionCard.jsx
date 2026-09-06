import React from 'react';

const ACTIVITY_LABELS = {
  SELF_STUDY: 'Self Study',
  LECTURE: 'Lecture',
  NOTE_MAKING: 'Note Making',
  QUESTION_PRACTICE: 'Question Practice',
  REVISION: 'Revision',
  READING: 'Reading',
  OTHER: 'Other',
};

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function SessionCard({ session, onEdit, onDelete, canEdit }) {
  const hasQuestions = session.questionsAttempted != null && session.questionsAttempted > 0;

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-ink/50 font-medium">
            {formatTime(session.startTime)} – {formatTime(session.endTime)}
          </div>
          <div className="font-serif text-lg font-semibold text-mossdark">{session.subject?.name}</div>
          <div className="text-sm text-ink/80">{session.topic?.name}</div>
        </div>
        <div className="text-right">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-line/60 text-ink/70 font-medium">
            {ACTIVITY_LABELS[session.activityType] || session.activityType}
          </span>
          <div className="text-sm font-semibold text-clay mt-1">{formatDuration(session.durationMinutes)}</div>
        </div>
      </div>

      {session.description && <p className="text-sm text-ink/80">{session.description}</p>}

      {hasQuestions && (
        <div className="text-sm bg-paper rounded-md px-3 py-2 border border-line flex gap-4">
          <span>{session.questionsAttempted} questions</span>
          <span className="text-moss font-medium">{session.questionsCorrect ?? 0} correct</span>
          <span className="text-clay font-medium">{session.questionsIncorrect ?? 0} incorrect</span>
        </div>
      )}

      {session.notes && <p className="text-xs text-ink/60 italic">{session.notes}</p>}

      {session.attachments?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {session.attachments.map((a) => (
            <a
              key={a.id}
              href={a.secureUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-2 py-1 rounded-md bg-mossdark/5 text-mossdark border border-line hover:bg-mossdark/10"
            >
              📎 {a.originalFilename || 'attachment'}
            </a>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onEdit(session)} className="text-xs text-moss underline">Edit</button>
          <button onClick={() => onDelete(session)} className="text-xs text-clay underline">Delete</button>
        </div>
      )}
    </div>
  );
}
