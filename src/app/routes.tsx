import { createBrowserRouter, Navigate } from 'react-router-dom';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { StudentLoginPage } from '@/pages/student/LoginPage';
import { StudentHomePage } from '@/pages/student/HomePage';
import { RegistrationDetailPage } from '@/pages/student/RegistrationDetailPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminLoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { RegistrationsListPage } from '@/pages/admin/RegistrationsListPage';
import { RegistrationBuilderPage } from '@/pages/admin/RegistrationBuilderPage';
import { RegistrationMonitorPage } from '@/pages/admin/RegistrationMonitorPage';
import { StudentsPage } from '@/pages/admin/StudentsPage';
import { CsvImportPage } from '@/pages/admin/CsvImportPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <StudentLoginPage /> },
  {
    path: '/',
    element: <StudentLayout />,
    children: [
      { index: true, element: <StudentHomePage /> },
      { path: 'registration/:id', element: <RegistrationDetailPage /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'registrations', element: <RegistrationsListPage /> },
      { path: 'registrations/new', element: <RegistrationBuilderPage /> },
      { path: 'registrations/:id/edit', element: <RegistrationBuilderPage /> },
      { path: 'registrations/:id/monitor', element: <RegistrationMonitorPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'import', element: <CsvImportPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
