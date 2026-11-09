import { useQuery } from '@tanstack/react-query';
import { api, type DataResponse } from '@/lib/api';
import type { AcademicSettings, Department, Faculty, Program, Semester } from '@/types/api';

/** Reference data used by filters and forms across the app. */

export const useSemesters = () =>
  useQuery({
    queryKey: ['calendar', 'semesters'],
    queryFn: () => api.get<DataResponse<Semester[]>>('/calendar/semesters').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

export const useFaculties = (enabled = true) =>
  useQuery({
    queryKey: ['faculties'],
    queryFn: () => api.get<DataResponse<Faculty[]>>('/organisation/faculties').then((r) => r.data),
    enabled,
  });

export const useDepartments = (enabled = true) =>
  useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<DataResponse<Department[]>>('/organisation/departments').then((r) => r.data),
    enabled,
  });

export const usePrograms = (departmentId?: string) =>
  useQuery({
    queryKey: ['programs', departmentId ?? 'all'],
    queryFn: () => api.get<DataResponse<Program[]>>('/organisation/programs', { departmentId }).then((r) => r.data),
  });

export const useAcademicSettings = () =>
  useQuery({
    queryKey: ['settings', 'academic'],
    queryFn: () => api.get<DataResponse<AcademicSettings>>('/settings/academic').then((r) => r.data),
    staleTime: 10 * 60_000,
  });
