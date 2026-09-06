import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

const ACTIVITY_LABELS = {
  SELF_STUDY: 'Self Study', LECTURE: 'Lecture', NOTE_MAKING: 'Note Making',
  QUESTION_PRACTICE: 'Question Practice', REVISION: 'Revision', READING: 'Reading', OTHER: 'Other',
};

function formatDuration(mins) {
  const h = Math.floor(Math.abs(mins || 0) / 60);
  const m = Math.abs(mins || 0) % 60;
  const sign = mins < 0 ? '-' : '';
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
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

export default function MonthlyReport() {
  const { selectedStudentId } = useStudent();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get('/reports/monthly', { params: { month, studentId: selectedStudentId } });
    setReport(data);
  }, [month, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  function shiftMonth(delta) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(d.toISOString().slice(0, 7));
  }

  if (!report) return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-ink/50">Loading…</div>;

  const subjectEntries = Object.entries(report.bySubject).sort((a, b) => b[1] - a[1]);
  const activityEntries = Object.entries(report.byActivityType)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => [ACTIVITY_LABELS[k] || k, v]);
  const diff = report.comparisonWithPreviousMonth.differenceMinutes;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-semibold text-mossdark">Monthly summary</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="btn-secondary !py-1 !px-2 text-sm">‹</button>
          <span className="text-sm text-ink/60">{new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => shiftMonth(1)} className="btn-secondary !py-1 !px-2 text-sm">›</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <MiniStat label="Total" value={formatDuration(report.totalMinutes)} />
        <MiniStat label="Active days" value={`${report.activeDaysCount}/${report.daysInMonth}`} />
        <MiniStat label="Sessions" value={report.sessionCount} />
        <MiniStat label="Questions" value={report.questionsAttempted} sub={report.accuracy != null ? `${report.accuracy}% accuracy` : null} />
      </div>

      <div className="card p-5 mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-ink/50 uppercase tracking-wide">vs. previous month</div>
          <div className="text-sm text-ink/70 mt-1">
            {formatDuration(report.comparisonWithPreviousMonth.previousMonthMinutes)} → {formatDuration(report.comparisonWithPreviousMonth.currentMonthMinutes)}
          </div>
        </div>
        <div className={`font-serif text-2xl font-semibold ${diff >= 0 ? 'text-moss' : 'text-clay'}`}>
          {diff >= 0 ? '+' : ''}{formatDuration(diff)}
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
        <div className="card p-4"><span className="block text-xs text-ink/50 uppercase mb-1">Files uploaded</span>{report.attachmentsCount}</div>
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
