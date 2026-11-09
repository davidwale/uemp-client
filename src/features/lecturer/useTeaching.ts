import { useQuery } from '@tanstack/react-query';
import { api, type DataResponse } from '@/lib/api';
import type { Semester, TeachingCourse } from '@/types/api';

export const useTeachingLoad = (semesterId = '') =>
  useQuery({
    queryKey: ['results', 'teaching', semesterId],
    queryFn: () =>
      api.get<DataResponse<{ semester: Semester; courses: TeachingCourse[] }>>('/results/teaching', { semesterId }).then((r) => r.data),
  });
