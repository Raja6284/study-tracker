import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useStudent } from '../api/studentContext.jsx';

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const LEVEL_CLASS = {
  none: 'bg-white border-line text-ink/30',
  some: 'bg-moss/20 border-moss/30 text-ink',
  high: 'bg-moss border-moss text-white',
};

export default function Calendar() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState({});
  const { selectedStudentId } = useStudent();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get('/calendar', { params: { month, studentId: selectedStudentId } });
    const map = {};
    data.days.forEach((d) => { map[d.date] = d; });
    setDays(map);
  }, [month, selectedStudentId]);

  useEffect(() => { load(); }, [load]);

  const [year, mo] = month.split('-').map(Number);
  const firstDay = new Date(year, mo - 1, 1);
  const daysInMonth = new Date(year, mo, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function shiftMonth(delta) {
    const d = new Date(year, mo - 1 + delta, 1);
    setMonth(d.toISOString().slice(0, 7));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="btn-secondary !py-1 !px-2 text-sm">‹</button>
          <h1 className="font-serif text-2xl font-semibold text-mossdark min-w-[200px] text-center">
            {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h1>
          <button onClick={() => shiftMonth(1)} className="btn-secondary !py-1 !px-2 text-sm">›</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink/50">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border border-line bg-white inline-block" />No entry</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-moss/20 inline-block" />Some study</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-moss inline-block" />2h+</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-medium text-ink/50 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${month}-${String(day).padStart(2, '0')}`;
          const info = days[dateStr];
          const level = info?.level || 'none';
          return (
            <button
              key={dateStr}
              onClick={() => navigate(`/day/${dateStr}`)}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 text-sm font-medium ${LEVEL_CLASS[level]}`}
            >
              <span>{day}</span>
              {info && <span className="text-[10px] opacity-80">{formatDuration(info.totalMinutes)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
