import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../api/auth.jsx';

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-moss text-white' : 'text-ink/70 hover:bg-line/60'}`;

export default function Nav() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const studentLinks = [
    { to: '/', label: 'Today' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/history', label: 'History' },
  ];
  const mentorLinks = [
    { to: '/', label: 'Overview' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/history', label: 'History' },
    { to: '/weekly', label: 'Weekly' },
    { to: '/monthly', label: 'Monthly' },
  ];
  const links = user.role === 'STUDENT' ? studentLinks : mentorLinks;

  return (
    <header className="border-b border-line bg-paper/95 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-serif text-lg font-semibold text-mossdark">Study Log</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink/60">{user.name} · {user.role === 'STUDENT' ? 'Student' : 'Mentor'}</span>
          <button onClick={logout} className="btn-secondary !py-1 !px-3 text-xs">Log out</button>
        </div>
      </div>
    </header>
  );
}
