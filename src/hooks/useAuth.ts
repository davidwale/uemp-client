import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type DataResponse } from '@/lib/api';
import { ME_QUERY_KEY } from '@/lib/queryClient';
import type { CurrentUser, Role } from '@/types/api';

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  DEPT_ADMIN: '/department',
  SUPER_ADMIN: '/admin',
};

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      try {
        return (await api.get<DataResponse<CurrentUser>>('/auth/me')).data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** For components rendered inside the authenticated shell, where the user is guaranteed. */
export function useCurrentUser(): CurrentUser {
  const { data } = useMe();
  if (!data) throw new Error('useCurrentUser must be used inside an authenticated route');
  return data;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<DataResponse<CurrentUser>>('/auth/login', input).then((r) => r.data),
    onSuccess: (user) => {
      qc.clear();
      qc.setQueryData(ME_QUERY_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(ME_QUERY_KEY, null);
    },
  });
}

/** Admin pages are shared by Department and Super Admins; links are built from the role's base path. */
export function useBasePath() {
  return ROLE_HOME[useCurrentUser().role];
}
