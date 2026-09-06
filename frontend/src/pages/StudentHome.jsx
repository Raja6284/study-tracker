import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import DailyView from '../components/DailyView.jsx';
import { useStudent } from '../api/studentContext.jsx';

export default function StudentHome() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [todayCount, setTodayCount] = useState(null);
  const { selectedStudentId } = useStudent();
  const today = new Date().toISOString().slice(0, 10);

  const checkToday = useCallback(async () => {
    if (!selectedStudentId) return;
    const { data } = await client.get('/sessions', { params: { date: today, studentId: selectedStudentId } });
    setTodayCount(data.length);
  }, [selectedStudentId, today]);

  useEffect(() => { checkToday(); }, [checkToday, date]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-mossdark">Today's study log</h1>
          {todayCount !== null && (
            <span className={`text-sm font-medium ${todayCount > 0 ? 'text-moss' : 'text-clay'}`}>
              {todayCount > 0 ? 'Complete' : 'Incomplete'} · {todayCount} session{todayCount === 1 ? '' : 's'} logged today
            </span>
          )}
        </div>
        <Link to="/log" className="btn-primary">+ Add Study Session</Link>
      </div>

      <DailyView date={date} onDateChange={setDate} />
    </div>
  );
}
