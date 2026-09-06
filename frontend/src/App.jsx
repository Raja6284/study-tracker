import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './api/auth.jsx';
import Nav from './components/Nav.jsx';

import Login from './pages/Login.jsx';
import StudentHome from './pages/StudentHome.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import AddSession from './pages/AddSession.jsx';
import Calendar from './pages/Calendar.jsx';
import DayPage from './pages/DayPage.jsx';
import History from './pages/History.jsx';
import WeeklyReport from './pages/WeeklyReport.jsx';
import MonthlyReport from './pages/MonthlyReport.jsx';
import SubjectHistory from './pages/SubjectHistory.jsx';
import TopicHistory from './pages/TopicHistory.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return user.role === 'STUDENT' ? <StudentHome /> : <MentorDashboard />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Nav />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<Protected><Home /></Protected>} />
        <Route path="/log" element={<Protected><AddSession /></Protected>} />
        <Route path="/calendar" element={<Protected><Calendar /></Protected>} />
        <Route path="/day/:date" element={<Protected><DayPage /></Protected>} />
        <Route path="/history" element={<Protected><History /></Protected>} />
        <Route path="/weekly" element={<Protected><WeeklyReport /></Protected>} />
        <Route path="/monthly" element={<Protected><MonthlyReport /></Protected>} />
        <Route path="/subject/:subjectId" element={<Protected><SubjectHistory /></Protected>} />
        <Route path="/topic/:topicId" element={<Protected><TopicHistory /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
