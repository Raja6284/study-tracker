import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

const ACTIVITY_LABELS = {
  SELF_STUDY: 'Self Study', LECTURE: 'Lecture', NOTE_MAKING: 'Note Making',
  QUESTION_PRACTICE: 'Question Practice', REVISION: 'Revision', READING: 'Reading', OTHER: 'Other',
};

function formatDuration(mins) {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function lastMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function BreakdownBar({ entries, total }) {
  return (
    <div className="space-y-2">
      {entries.map(([name, mins]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-sm w-36 truncate">{name}</span>
          <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
            <div className="h-2 bg-moss" style={{ width: `${total ? Math.min(100, (mins / total) * 100) : 0}%` }} />
          </div>
          <span className="text-sm text-ink/60 w-16 text-right">{formatDuration(mins)}</span>
        </div>
      ))}
    </div>
  );
}

export default function WeeklyReport() {
  const { selectedStudentId } = useStudent();
  const [start, setStart] = useState(lastMonday());
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get('/reports/weekly', { params: { start, studentId: selectedStudentId } });
    setReport(data);
  }, [start, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  function shiftWeek(delta) {
    const d = new Date(`${start}T00:00:00`);
    d.setDate(d.getDate() + delta * 7);
    setStart(d.toISOString().slice(0, 10));
  }

  if (!report) return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-ink/50">Loading…</div>;

  const subjectEntries = Object.entries(report.bySubject).sort((a, b) => b[1] - a[1]);
  const activityEntries = Object.entries(report.byActivityType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => [ACTIVITY_LABELS[k] || k, v]);
  const dailyEntries = Object.entries(report.byDate).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDaily = Math.max(1, ...dailyEntries.map(([, v]) => v));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-semibold text-mossdark">Weekly summary</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-1)} className="btn-secondary !py-1 !px-2 text-sm">‹ Prev</button>
          <span className="text-sm text-ink/60">{report.rangeStart} – {report.rangeEnd}</span>
          <button onClick={() => shiftWeek(1)} className="btn-secondary !py-1 !px-2 text-sm">Next ›</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MiniStat label="Total" value={formatDuration(report.totalMinutes)} />
        <MiniStat label="Active days" value={`${report.activeDaysCount}/7`} />
        <MiniStat label="Sessions" value={report.sessionCount} />
        <MiniStat label="Questions" value={report.questionsAttempted} sub={report.accuracy != null ? `${report.accuracy}% accuracy` : null} />
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">Daily totals</h2>
        <div className="flex items-end gap-2 h-28">
          {dailyEntries.map(([date, mins]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-moss rounded-t-md" style={{ height: `${(mins / maxDaily) * 100}%`, minHeight: mins ? 4 : 0 }} />
              <span className="text-[10px] text-ink/50">{new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">By subject</h2>
          {subjectEntries.length ? <BreakdownBar entries={subjectEntries} total={report.totalMinutes} /> : <p className="text-sm text-ink/50">No sessions.</p>}
        </div>
        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">By activity type</h2>
          {activityEntries.length ? <BreakdownBar entries={activityEntries} total={report.totalMinutes} /> : <p className="text-sm text-ink/50">No sessions.</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-ink/70">
        <div className="card p-4"><span className="block text-xs text-ink/50 uppercase mb-1">Revision sessions</span>{report.revisionSessions}</div>
        <div className="card p-4"><span className="block text-xs text-ink/50 uppercase mb-1">Attachments uploaded</span>{report.attachmentsCount}</div>
        <div className="card p-4"><span className="block text-xs text-ink/50 uppercase mb-1">Correct / Incorrect</span>{report.questionsCorrect} / {report.questionsIncorrect}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xs text-ink/50 uppercase tracking-wide">{label}</div>
      <div className="font-serif text-xl font-semibold text-clay">{value}</div>
      {sub && <div className="text-[11px] text-ink/50">{sub}</div>}
    </div>
  );
}
