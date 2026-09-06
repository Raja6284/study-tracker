import React, { createContext, useContext, useEffect, useState } from 'react';
import client from './client';
import { useAuth } from './auth.jsx';

// For the STUDENT role this always resolves to their own id.
// For the MENTOR role this lets them pick which student's records to view
// (there's normally just one student account, but this stays correct if a
// second one is ever added).
const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'STUDENT') {
      setSelectedStudentId(user.id);
      return;
    }
    client.get('/users/students').then(({ data }) => {
      setStudents(data);
      setSelectedStudentId((prev) => prev || data[0]?.id || null);
    });
  }, [user]);

  return (
    <StudentContext.Provider value={{ students, selectedStudentId, setSelectedStudentId }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
