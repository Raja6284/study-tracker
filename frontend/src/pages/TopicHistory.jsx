import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TopicHistory() {
  const { topicId } = useParams();
  const { selectedStudentId } = useStudent();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get(`/reports/topic/${topicId}`, { params: { studentId: selectedStudentId } });
    setData(data);
  }, [topicId, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-ink/50">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <p className="text-sm text-ink/50">{data.subject}</p>
      <h1 className="font-serif text-2xl font-semibold text-mossdark mb-1">{data.topic}</h1>
      <p className="text-sm text-ink/60 mb-5">
        {data.firstStudied ? `First studied ${data.firstStudied} · Last studied ${data.lastStudied}` : 'No sessions recorded yet'}
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStat label="Total time" value={formatDuration(data.totalMinutes)} />
        <MiniStat label="Sessions" value={data.sessionCount} />
        <MiniStat label="Questions" value={data.questionsAttempted} sub={data.accuracy != null ? `${data.accuracy}% accuracy` : null} />
        <MiniStat label="Revisions" value={data.revisionSessions} />
      </div>

      <div className="card p-5">
        <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">Sessions on this topic</h2>
        {data.sessions.length === 0 ? (
          <p className="text-sm text-ink/50">No sessions recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink/50">
              <tr><th className="py-1">Date</th><th className="py-1">Activity</th><th className="py-1">Duration</th></tr>
            </thead>
            <tbody>
              {data.sessions.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-2">
                    <Link to={`/day/${s.date}`} className="text-moss underline">{s.date}</Link>
                  </td>
                  <td className="py-2 text-ink/70">{s.activityType.replace('_', ' ')}</td>
                  <td className="py-2 font-medium text-clay">{formatDuration(s.durationMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ink/50 mt-4">
        Use this to test him directly on {data.topic} — the record shows exactly what and when he studied, not how well he knows it.
      </p>
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
