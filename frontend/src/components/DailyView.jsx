import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import SessionCard from './SessionCard';
import { useAuth } from '../api/auth.jsx';
import { useStudent } from '../api/studentContext.jsx';

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateHeading(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DailyView({ date, onDateChange }) {
  const { user } = useAuth();
  const { selectedStudentId } = useStudent();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    const { data } = await client.get('/sessions', { params: { date, studentId: selectedStudentId } });
    setSessions(data);
    setLoading(false);
  }, [date, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const canEdit = user.role === 'STUDENT';

  async function handleDelete(session) {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    await client.delete(`/sessions/${session.id}`);
    load();
  }

  function handleEdit(session) {
    navigate(`/log?edit=${session.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => onDateChange(shiftDate(date, -1))} className="btn-secondary !py-1 !px-2 text-sm">‹</button>
          <h2 className="font-serif text-xl font-semibold text-mossdark min-w-[220px] text-center">
            {formatDateHeading(date)}
          </h2>
          <button onClick={() => onDateChange(shiftDate(date, 1))} className="btn-secondary !py-1 !px-2 text-sm">›</button>
        </div>
        {date !== new Date().toISOString().slice(0, 10) && (
          <button onClick={() => onDateChange(new Date().toISOString().slice(0, 10))} className="text-sm text-moss underline">
            Jump to today
          </button>
        )}
      </div>

      <div className="flex gap-6 mb-5">
        <div>
          <div className="text-xs text-ink/50 font-medium uppercase tracking-wide">Total Study Time</div>
          <div className="font-serif text-2xl font-semibold text-clay">{formatDuration(totalMinutes)}</div>
        </div>
        <div>
          <div className="text-xs text-ink/50 font-medium uppercase tracking-wide">Sessions</div>
          <div className="font-serif text-2xl font-semibold text-mossdark">{sessions.length}</div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink/50">No sessions recorded for this day.</p>
      ) : (
        <div className="grid gap-3">
          {sessions
            .slice()
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .map((s) => (
              <SessionCard key={s.id} session={s} canEdit={canEdit} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
        </div>
      )}
    </div>
  );
}
