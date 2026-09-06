import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

function formatDuration(mins) {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function todayIso() { return new Date().toISOString().slice(0, 10); }
function monthIso() { return new Date().toISOString().slice(0, 7); }
function weekStartIso() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
}

export default function MentorDashboard() {
  const { students, selectedStudentId, setSelectedStudentId } = useStudent();
  const [today, setToday] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const [todaySessions, week, month] = await Promise.all([
      client.get('/sessions', { params: { date: todayIso(), studentId: selectedStudentId } }),
      client.get('/reports/weekly', { params: { start: weekStartIso(), studentId: selectedStudentId } }),
      client.get('/reports/monthly', { params: { month: monthIso(), studentId: selectedStudentId } }),
    ]);
    setToday(todaySessions.data);
    setWeekly(week.data);
    setMonthly(month.data);
  }, [selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const todayMinutes = (today || []).reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-mossdark">Mentor overview</h1>
        {students.length > 1 && (
          <select className="input !w-auto" value={selectedStudentId || ''} onChange={(e) => setSelectedStudentId(e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Today" value={formatDuration(todayMinutes)} sub={`${(today || []).length} sessions`} link="/" />
        <StatCard label="Last 7 days" value={weekly ? formatDuration(weekly.totalMinutes) : '—'} sub={weekly ? `${weekly.sessionCount} sessions · ${weekly.activeDaysCount}/7 active days` : ''} link="/weekly" />
        <StatCard label="This month" value={monthly ? formatDuration(monthly.totalMinutes) : '—'} sub={monthly ? `${monthly.sessionCount} sessions` : ''} link="/monthly" />
      </div>

      {weekly && (
        <div className="card p-5 mb-4">
          <h2 className="font-serif text-lg font-semibold text-mossdark mb-3">Subject time — last 7 days</h2>
          {Object.keys(weekly.bySubject).length === 0 ? (
            <p className="text-sm text-ink/50">No sessions in the last 7 days.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(weekly.bySubject).sort((a, b) => b[1] - a[1]).map(([name, mins]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm w-32 truncate">{name}</span>
                  <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-2 bg-moss" style={{ width: `${Math.min(100, (mins / weekly.totalMinutes) * 100)}%` }} />
                  </div>
                  <span className="text-sm text-ink/60 w-16 text-right">{formatDuration(mins)}</span>
                </div>
              ))}
            </div>
          )}
          {weekly.questionsAttempted > 0 && (
            <p className="text-sm text-ink/60 mt-3">
              {weekly.questionsAttempted} questions attempted · {weekly.accuracy}% accuracy
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link to="/calendar" className="btn-secondary">Open calendar</Link>
        <Link to="/history" className="btn-secondary">Full history</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, link }) {
  return (
    <Link to={link} className="card p-4 block hover:border-moss transition-colors">
      <div className="text-xs text-ink/50 font-medium uppercase tracking-wide">{label}</div>
      <div className="font-serif text-2xl font-semibold text-clay">{value}</div>
      {sub && <div className="text-xs text-ink/50 mt-0.5">{sub}</div>}
    </Link>
  );
}
