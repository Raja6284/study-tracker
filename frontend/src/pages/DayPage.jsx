import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DailyView from '../components/DailyView.jsx';

export default function DayPage() {
  const { date } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <DailyView date={date} onDateChange={(d) => navigate(`/day/${d}`)} />
    </div>
  );
}
