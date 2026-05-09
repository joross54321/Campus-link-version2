/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EnrollmentWizard from './pages/EnrollmentWizard';
import StudyLoad from './pages/StudyLoad';
import Grades from './pages/Grades';
import ProfessorPortal from './pages/ProfessorPortal';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorSections from './pages/ProfessorSections';
import ProfessorSectionCourses from './pages/ProfessorSectionCourses';
import AdminDashboard from './pages/AdminDashboard';
import Shell from './components/layout/Shell';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-brand-blue">
      <div className="h-12 w-12 animate-spin rounded-[1.25rem] border-4 border-brand-gold border-t-transparent shadow-2xl shadow-brand-gold/20"></div>
      <p className="mt-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] animate-pulse">Authenticating Identity</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function IndexRedirect() {
  const { profile } = useAuth();
  if (profile?.role === 'registrar') return <Navigate to="/admin" replace />;
  if (profile?.role === 'professor') return <Navigate to="/professor" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="enrollment" element={
              <ProtectedRoute allowedRoles={['student']}><EnrollmentWizard /></ProtectedRoute>
            } />
            <Route path="study-load" element={
              <ProtectedRoute allowedRoles={['student']}><StudyLoad /></ProtectedRoute>
            } />
            <Route path="grades" element={
              <ProtectedRoute allowedRoles={['student', 'registrar']}><Grades /></ProtectedRoute>
            } />
            <Route path="professor" element={
              <ProtectedRoute allowedRoles={['professor']}><ProfessorDashboard /></ProtectedRoute>
            } />
            <Route path="professor/sections" element={
              <ProtectedRoute allowedRoles={['professor']}><ProfessorSections /></ProtectedRoute>
            } />
            <Route path="professor/sections/:sectionName" element={
              <ProtectedRoute allowedRoles={['professor']}><ProfessorSectionCourses /></ProtectedRoute>
            } />
            <Route path="professor/management/:subjectId" element={
              <ProtectedRoute allowedRoles={['professor']}><ProfessorPortal /></ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['registrar']}><AdminDashboard /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
