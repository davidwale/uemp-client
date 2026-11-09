import type { ComponentType } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import type { Role } from '@/types/api';
import { HomeRedirect, RequireRole } from './guards';
import { NotFound } from './NotFound';
import { RouteError } from './RouteError';

/**
 * Every page is code-split: a student never downloads the admin screens and
 * vice versa. React Router resolves the chunk before rendering the route.
 */
type LazyPage = () => Promise<{ Component: ComponentType }>;
const pages = {
  AllocationsPage: () => import('@/features/admin/AllocationsPage').then((m) => ({ Component: m.AllocationsPage })),
  AuditLogPage: () => import('@/features/admin/AuditLogPage').then((m) => ({ Component: m.AuditLogPage })),
  CalendarPage: () => import('@/features/admin/CalendarPage').then((m) => ({ Component: m.CalendarPage })),
  CoursesPage: () => import('@/features/admin/CoursesPage').then((m) => ({ Component: m.CoursesPage })),
  DepartmentDashboard: () => import('@/features/admin/DepartmentDashboard').then((m) => ({ Component: m.DepartmentDashboard })),
  DepartmentsPage: () => import('@/features/admin/DepartmentsPage').then((m) => ({ Component: m.DepartmentsPage })),
  FacultiesPage: () => import('@/features/admin/FacultiesPage').then((m) => ({ Component: m.FacultiesPage })),
  ProgramsPage: () => import('@/features/admin/ProgramsPage').then((m) => ({ Component: m.ProgramsPage })),
  RegistrationsPage: () => import('@/features/admin/RegistrationsPage').then((m) => ({ Component: m.RegistrationsPage })),
  ReportsPage: () => import('@/features/admin/ReportsPage').then((m) => ({ Component: m.ReportsPage })),
  ResultApprovalsPage: () => import('@/features/admin/ResultApprovalsPage').then((m) => ({ Component: m.ResultApprovalsPage })),
  SettingsPage: () => import('@/features/admin/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
  SheetReviewPage: () => import('@/features/admin/SheetReviewPage').then((m) => ({ Component: m.SheetReviewPage })),
  SuperAdminDashboard: () => import('@/features/admin/SuperAdminDashboard').then((m) => ({ Component: m.SuperAdminDashboard })),
  UsersPage: () => import('@/features/admin/UsersPage').then((m) => ({ Component: m.UsersPage })),
  LoginPage: () => import('@/features/auth/LoginPage').then((m) => ({ Component: m.LoginPage })),
  CourseResultsPage: () => import('@/features/lecturer/CourseResultsPage').then((m) => ({ Component: m.CourseResultsPage })),
  LecturerDashboard: () => import('@/features/lecturer/LecturerDashboard').then((m) => ({ Component: m.LecturerDashboard })),
  MyCoursesPage: () => import('@/features/lecturer/MyCoursesPage').then((m) => ({ Component: m.MyCoursesPage })),
  ProfilePage: () => import('@/features/shared/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
  CourseRegistrationPage: () => import('@/features/student/CourseRegistrationPage').then((m) => ({ Component: m.CourseRegistrationPage })),
  RegistrationSlipPage: () => import('@/features/student/RegistrationSlipPage').then((m) => ({ Component: m.RegistrationSlipPage })),
  ResultsPage: () => import('@/features/student/ResultsPage').then((m) => ({ Component: m.ResultsPage })),
  StudentDashboard: () => import('@/features/student/StudentDashboard').then((m) => ({ Component: m.StudentDashboard })),
} satisfies Record<string, LazyPage>;

const area = (roles: Role[]) => (
  <RequireRole roles={roles}>
    <AppShell />
  </RequireRole>
);

/** Pages shared by Department Admins and the Super Admin; the API scopes the data. */
const sharedAdminRoutes = [
  { path: 'programs', lazy: pages.ProgramsPage },
  { path: 'courses', lazy: pages.CoursesPage },
  { path: 'allocations', lazy: pages.AllocationsPage },
  { path: 'registrations', lazy: pages.RegistrationsPage },
  { path: 'results', lazy: pages.ResultApprovalsPage },
  { path: 'results/:sheetId', lazy: pages.SheetReviewPage },
  { path: 'reports', lazy: pages.ReportsPage },
  { path: 'profile', lazy: pages.ProfilePage },
];

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      { path: '/login', lazy: pages.LoginPage },
      {
        path: '/student',
        element: area(['STUDENT']),
        children: [
          { index: true, lazy: pages.StudentDashboard },
          { path: 'registration', lazy: pages.CourseRegistrationPage },
          { path: 'registration/slip', lazy: pages.RegistrationSlipPage },
          { path: 'results', lazy: pages.ResultsPage },
          { path: 'profile', lazy: pages.ProfilePage },
        ],
      },
      {
        path: '/lecturer',
        element: area(['LECTURER']),
        children: [
          { index: true, lazy: pages.LecturerDashboard },
          { path: 'courses', lazy: pages.MyCoursesPage },
          { path: 'courses/:courseId/:semesterId', lazy: pages.CourseResultsPage },
          { path: 'profile', lazy: pages.ProfilePage },
        ],
      },
      {
        path: '/department',
        element: area(['DEPT_ADMIN']),
        children: [
          { index: true, lazy: pages.DepartmentDashboard },
          { path: 'students', lazy: () => import('@/features/admin/UsersPage').then((m) => ({ Component: () => <m.UsersPage key="students" role="STUDENT" /> })) },
          { path: 'lecturers', lazy: () => import('@/features/admin/UsersPage').then((m) => ({ Component: () => <m.UsersPage key="lecturers" role="LECTURER" /> })) },
          { path: 'activity', lazy: pages.AuditLogPage },
          ...sharedAdminRoutes,
        ],
      },
      {
        path: '/admin',
        element: area(['SUPER_ADMIN']),
        children: [
          { index: true, lazy: pages.SuperAdminDashboard },
          { path: 'faculties', lazy: pages.FacultiesPage },
          { path: 'departments', lazy: pages.DepartmentsPage },
          { path: 'calendar', lazy: pages.CalendarPage },
          { path: 'users', lazy: pages.UsersPage },
          { path: 'audit', lazy: pages.AuditLogPage },
          { path: 'settings', lazy: pages.SettingsPage },
          ...sharedAdminRoutes,
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
