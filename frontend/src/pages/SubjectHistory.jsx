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

export default function SubjectHistory() {
  const { subjectId } = useParams();
  const { selectedStudentId } = useStudent();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get(`/reports/subject/${subjectId}`, { params: { studentId: selectedStudentId } });
    setData(data);
  }, [subjectId, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-ink/50">Loading…</div>;

  const topics = Object.entries(data.byTopic).sort((a, b) => b[1].minutes - a[1].minutes);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-semibold text-mossdark mb-1">{data.subject}</h1>
      <p className="text-sm text-ink/60 mb-5">
        {data.firstStudied ? `First studied ${data.firstStudied} · Last studied ${data.lastStudied}` : 'No sessions recorded yet'}
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <MiniStat label="Total time" value={formatDuration(data.totalMinutes)} />
        <MiniStat label="Sessions" value={data.sessionCount} />
        <MiniStat label="Questions" value={data.questionsAttempted} sub={data.accuracy != null ? `${data.accuracy}% accuracy` : null} />
        <MiniStat label="Attachments" value={data.attachmentsCount} />
      </div>

      <div className="card p-5">
        <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">Topics studied</h2>
        {topics.length === 0 ? (
          <p className="text-sm text-ink/50">No topics recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink/50">
              <tr><th className="py-1">Topic</th><th className="py-1">Sessions</th><th className="py-1">Time</th></tr>
            </thead>
            <tbody>
              {topics.map(([name, v]) => (
                <tr key={name} className="border-t border-line">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-ink/60">{v.sessions}</td>
                  <td className="py-2 font-medium text-clay">{formatDuration(v.minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Link to="/history" className="text-sm text-moss underline mt-4 inline-block">Back to history</Link>
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
