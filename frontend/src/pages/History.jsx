import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

const ACTIVITY_LABELS = {
  SELF_STUDY: 'Self Study', LECTURE: 'Lecture', NOTE_MAKING: 'Note Making',
  QUESTION_PRACTICE: 'Question Practice', REVISION: 'Revision', READING: 'Reading', OTHER: 'Other',
};

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function History() {
  const { selectedStudentId } = useStudent();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', subjectId: '', topicId: '', activityType: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { client.get('/subjects').then(({ data }) => setSubjects(data)); }, []);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    const params = { studentId: selectedStudentId };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const { data } = await client.get('/sessions', { params });
    setSessions(data);
    setLoading(false);
  }, [filters, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const selectedSubject = subjects.find((s) => s.id === filters.subjectId);
  const topics = selectedSubject?.topics || [];

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, ...(key === 'subjectId' ? { topicId: '' } : {}) }));
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-semibold text-mossdark mb-4">Study history</h1>

      <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="field-label">From</label>
          <input type="date" className="input" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
        </div>
        <div>
          <label className="field-label">To</label>
          <input type="date" className="input" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Subject</label>
          <select className="input" value={filters.subjectId} onChange={(e) => updateFilter('subjectId', e.target.value)}>
            <option value="">All</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Topic</label>
          <select className="input" value={filters.topicId} onChange={(e) => updateFilter('topicId', e.target.value)} disabled={!filters.subjectId}>
            <option value="">All</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Activity</label>
          <select className="input" value={filters.activityType} onChange={(e) => updateFilter('activityType', e.target.value)}>
            <option value="">All</option>
            {Object.entries(ACTIVITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-ink/60 mb-3">{sessions.length} sessions · {formatDuration(totalMinutes)} total</p>

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-line text-left text-ink/50 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Questions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-3 py-2">
                    <Link to={`/day/${s.date.slice(0, 10)}`} className="text-moss underline">
                      {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/subject/${s.subjectId}`} className="text-mossdark font-medium">{s.subject?.name}</Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/topic/${s.topicId}`} className="text-ink/80">{s.topic?.name}</Link>
                  </td>
                  <td className="px-3 py-2 text-ink/70">{ACTIVITY_LABELS[s.activityType]}</td>
                  <td className="px-3 py-2 font-medium text-clay">{formatDuration(s.durationMinutes)}</td>
                  <td className="px-3 py-2 text-ink/60">
                    {s.questionsAttempted ? `${s.questionsAttempted} (${s.questionsCorrect ?? 0}✓ / ${s.questionsIncorrect ?? 0}✗)` : '—'}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-ink/40">No sessions match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
