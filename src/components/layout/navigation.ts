import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Landmark,
  LayoutDashboard,
  Layers,
  ListChecks,
  Settings,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/api';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAVIGATION: Record<Role, NavSection[]> = {
  STUDENT: [
    {
      items: [
        { label: 'Dashboard', to: '/student', icon: LayoutDashboard, end: true },
        { label: 'Course Registration', to: '/student/registration', icon: ClipboardList, end: true },
        { label: 'Registration Slip', to: '/student/registration/slip', icon: FileText },
        { label: 'Results', to: '/student/results', icon: GraduationCap },
        { label: 'My Profile', to: '/student/profile', icon: UserRound },
      ],
    },
  ],
  LECTURER: [
    {
      items: [
        { label: 'Dashboard', to: '/lecturer', icon: LayoutDashboard, end: true },
        { label: 'My Courses', to: '/lecturer/courses', icon: BookOpen },
        { label: 'My Profile', to: '/lecturer/profile', icon: UserRound },
      ],
    },
  ],
  DEPT_ADMIN: [
    { items: [{ label: 'Dashboard', to: '/department', icon: LayoutDashboard, end: true }] },
    {
      title: 'People',
      items: [
        { label: 'Students', to: '/department/students', icon: Users },
        { label: 'Lecturers', to: '/department/lecturers', icon: UserCog },
      ],
    },
    {
      title: 'Academics',
      items: [
        { label: 'Programmes & Levels', to: '/department/programs', icon: Layers },
        { label: 'Courses', to: '/department/courses', icon: BookOpen },
        { label: 'Course Allocation', to: '/department/allocations', icon: ListChecks },
        { label: 'Registrations', to: '/department/registrations', icon: ClipboardList },
        { label: 'Result Approvals', to: '/department/results', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Oversight',
      items: [
        { label: 'Reports', to: '/department/reports', icon: BarChart3 },
        { label: 'Activity Log', to: '/department/activity', icon: History },
        { label: 'My Profile', to: '/department/profile', icon: UserRound },
      ],
    },
  ],
  SUPER_ADMIN: [
    { items: [{ label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true }] },
    {
      title: 'Structure',
      items: [
        { label: 'Faculties', to: '/admin/faculties', icon: Landmark },
        { label: 'Departments', to: '/admin/departments', icon: Building2 },
        { label: 'Programmes', to: '/admin/programs', icon: Layers },
        { label: 'Sessions & Semesters', to: '/admin/calendar', icon: CalendarRange },
      ],
    },
    {
      title: 'Academics',
      items: [
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Courses', to: '/admin/courses', icon: BookOpen },
        { label: 'Course Allocation', to: '/admin/allocations', icon: ListChecks },
        { label: 'Registrations', to: '/admin/registrations', icon: ClipboardList },
        { label: 'Result Oversight', to: '/admin/results', icon: ClipboardCheck },
      ],
    },
    {
      title: 'Oversight',
      items: [
        { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
        { label: 'Audit Log', to: '/admin/audit', icon: History },
        { label: 'Settings', to: '/admin/settings', icon: Settings },
        { label: 'My Profile', to: '/admin/profile', icon: UserRound },
      ],
    },
  ],
};
