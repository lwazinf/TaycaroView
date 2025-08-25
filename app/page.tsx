'use client'
// In your main App component or _app.tsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NursingStudentManagement from './NursingStudentManagement';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ProtectedRoute requiredRoles={['instructor', 'admin', 'coordinator']}>
        <NursingStudentManagement />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;