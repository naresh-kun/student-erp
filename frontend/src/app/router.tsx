import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_DEFAULT_ROUTES } from './navigation';
import { LoadingState } from '@/components/ui/States';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RoleRoute } from '@/layouts/RoleRoute';

// Shared Pages
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Student Pages
import {
  StudentDashboardPage,
  StudentProfilePage,
  StudentAttendancePage,
  StudentMarksPage,
  StudentTimetablePage,
  StudentCalendarPage,
} from '@/pages/student';

// Parent Pages
import {
  ParentDashboardPage,
  ParentChildrenPage,
  ParentAttendancePage,
  ParentMarksPage,
  ParentTimetablePage,
  ParentCalendarPage,
} from '@/pages/parent';

// Faculty Pages
import {
  FacultyDashboardPage,
  FacultyClassesPage,
  FacultyAttendancePage,
  FacultyMarksPage,
  FacultyTimetablePage,
} from '@/pages/faculty';

// Admin Pages
import {
  AdminDashboardPage,
  AdminStudentsPage,
  AdminParentsPage,
  AdminFacultyPage,
  AdminClassesPage,
  AdminSubjectsPage,
  AdminAttendancePage,
  AdminMarksPage,
  AdminTimetablePage,
  AdminCalendarPage,
  AdminAllocationPage,
} from '@/pages/admin';

// Principal Pages
import {
  PrincipalDashboardPage,
  PrincipalAcademicsPage,
  PrincipalAttendancePage,
  PrincipalFacultyPage,
  PrincipalReportsPage,
} from '@/pages/principal';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Initializing Student ERP..." />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_DEFAULT_ROUTES[user.role]} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  // 1. Root Entry Redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // 2. Authentication Shell
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },

  // 3. Student Domain
  {
    element: <RoleRoute allowedRoles={['Student']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/student/dashboard', element: <StudentDashboardPage /> },
          { path: '/student/profile', element: <StudentProfilePage /> },
          { path: '/student/attendance', element: <StudentAttendancePage /> },
          { path: '/student/marks', element: <StudentMarksPage /> },
          { path: '/student/timetable', element: <StudentTimetablePage /> },
          { path: '/student/calendar', element: <StudentCalendarPage /> },
        ],
      },
    ],
  },

  // 4. Parent Domain
  {
    element: <RoleRoute allowedRoles={['Parent']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/parent/dashboard', element: <ParentDashboardPage /> },
          { path: '/parent/children', element: <ParentChildrenPage /> },
          { path: '/parent/attendance', element: <ParentAttendancePage /> },
          { path: '/parent/marks', element: <ParentMarksPage /> },
          { path: '/parent/timetable', element: <ParentTimetablePage /> },
          { path: '/parent/calendar', element: <ParentCalendarPage /> },
        ],
      },
    ],
  },

  // 5. Faculty Domain
  {
    element: <RoleRoute allowedRoles={['Faculty']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/faculty/dashboard', element: <FacultyDashboardPage /> },
          { path: '/faculty/classes', element: <FacultyClassesPage /> },
          { path: '/faculty/attendance', element: <FacultyAttendancePage /> },
          { path: '/faculty/marks', element: <FacultyMarksPage /> },
          { path: '/faculty/timetable', element: <FacultyTimetablePage /> },
        ],
      },
    ],
  },

  // 6. Admin Domain
  {
    element: <RoleRoute allowedRoles={['Admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/students', element: <AdminStudentsPage /> },
          { path: '/admin/parents', element: <AdminParentsPage /> },
          { path: '/admin/faculty', element: <AdminFacultyPage /> },
          { path: '/admin/classes', element: <AdminClassesPage /> },
          { path: '/admin/subjects', element: <AdminSubjectsPage /> },
          { path: '/admin/attendance', element: <AdminAttendancePage /> },
          { path: '/admin/marks', element: <AdminMarksPage /> },
          { path: '/admin/timetable', element: <AdminTimetablePage /> },
          { path: '/admin/calendar', element: <AdminCalendarPage /> },
          { path: '/admin/allocation', element: <AdminAllocationPage /> },
        ],
      },
    ],
  },

  // 7. Principal Domain
  {
    element: <RoleRoute allowedRoles={['Principal']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/principal/dashboard', element: <PrincipalDashboardPage /> },
          { path: '/principal/academics', element: <PrincipalAcademicsPage /> },
          { path: '/principal/attendance', element: <PrincipalAttendancePage /> },
          { path: '/principal/faculty', element: <PrincipalFacultyPage /> },
          { path: '/principal/reports', element: <PrincipalReportsPage /> },
        ],
      },
    ],
  },

  // 8. 404 Catch-All
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
