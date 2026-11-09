import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListChecks, UserMinus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, PageHeader, ResultStatusBadge, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, type DataResponse, type Paginated } from '@/lib/api';
import { errorMessage, levelLabel } from '@/lib/utils';
import type { Allocation, Course, User } from '@/types/api';
import { useDepartments, useSemesters } from '../shared/queries';

interface RegistrationReportRow {
  courseId: string;
  registered: number;
  resultStatus: string | null;
}

export function AllocationsPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const { data: semesters = [] } = useSemesters();
  const { data: departments = [] } = useDepartments(isSuper);
  const [semesterId, setSemesterId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const semester = semesters.find((s) => (semesterId ? s.id === semesterId : s.isCurrent));
  const effectiveDept = isSuper ? departmentId : me.department?.id;

  const courses = useQuery({
    queryKey: ['courses', 'for-allocation', semester?.type, effectiveDept],
    queryFn: () => api.get<Paginated<Course>>('/courses', { semesterType: semester!.type, departmentId: effectiveDept, pageSize: 200 }),
    enabled: !!semester,
  });
  const allocations = useQuery({
    queryKey: ['allocations', semester?.id, effectiveDept],
    queryFn: () => api.get<DataResponse<Allocation[]>>('/allocations', { semesterId: semester!.id, departmentId: effectiveDept }).then((r) => r.data),
    enabled: !!semester,
  });
  const lecturers = useQuery({
    queryKey: ['users', 'lecturers', effectiveDept],
    queryFn: () => api.get<Paginated<User>>('/users', { role: 'LECTURER', status: 'ACTIVE', departmentId: effectiveDept, pageSize: 100 }),
  });
  const registrations = useQuery({
    queryKey: ['reports', 'registrations', semester?.id, effectiveDept],
    queryFn: () =>
      api.get<DataResponse<{ rows: RegistrationReportRow[] }>>('/reports/registrations', { semesterId: semester!.id, departmentId: effectiveDept }).then((r) => r.data.rows),
    enabled: !!semester,
  });

  const allocationByCourse = useMemo(() => new Map((allocations.data ?? []).map((a) => [a.course.id, a])), [allocations.data]);
  const regByCourse = useMemo(() => new Map((registrations.data ?? []).map((r) => [r.courseId, r])), [registrations.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['allocations'] });
    qc.invalidateQueries({ queryKey: ['reports'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const allocate = useMutation({
    mutationFn: (v: { courseId: string; lecturerId: string }) => api.post('/allocations', { ...v, semesterId: semester!.id }),
    onSuccess: () => {
      toast.success('Lecturer assigned');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const unallocate = useMutation({
    mutationFn: (id: string) => api.delete(`/allocations/${id}`),
    onSuccess: () => {
      toast.success('Allocation removed');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const loading = courses.isLoading || allocations.isLoading || lecturers.isLoading;
  const err = courses.error || allocations.error || lecturers.error;
  const activeCourses = (courses.data?.data ?? []).filter((c) => c.isActive);
  const unassigned = activeCourses.filter((c) => !allocationByCourse.has(c.id)).length;

  return (
    <>
      <PageHeader
        title="Course allocation"
        description="Assign a responsible lecturer to each course for the semester."
        actions={
          <>
            {isSuper && (
              <Select aria-label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} containerClassName="w-56">
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
            <Select aria-label="Semester" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} containerClassName="w-64">
              <option value="">Current semester</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </>
        }
      />
      {unassigned > 0 && (
        <Alert tone="warning" className="mb-4">
          {unassigned} course(s) scheduled for {semester?.label} have no lecturer yet.
        </Alert>
      )}
      <Card>
        {loading ? (
          <Spinner />
        ) : err ? (
          <ErrorState error={err} />
        ) : activeCourses.length === 0 ? (
          <EmptyState icon={ListChecks} title="No courses scheduled" description={`No active ${semester?.type.toLowerCase()}-semester courses found.`} />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Course</Th>
                <Th>Level</Th>
                <Th className="text-right">Registered</Th>
                <Th>Results</Th>
                <Th className="w-72">Lecturer</Th>
                <Th>
                  <span className="sr-only">Remove</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {activeCourses.map((c) => {
                const allocation = allocationByCourse.get(c.id);
                const reg = regByCourse.get(c.id);
                const candidates = (lecturers.data?.data ?? []).filter((l) => l.department?.id === c.department?.id);
                const locked = reg?.resultStatus === 'SUBMITTED' || reg?.resultStatus === 'APPROVED';
                return (
                  <Tr key={c.id}>
                    <Td>
                      <span className="font-medium">{c.code}</span>
                      <p className="text-xs text-slate-500">{c.title}</p>
                    </Td>
                    <Td>{levelLabel(c.level)}</Td>
                    <Td className="text-right">{reg?.registered ?? 0}</Td>
                    <Td>{reg?.resultStatus ? <ResultStatusBadge status={reg.resultStatus} /> : <Badge>—</Badge>}</Td>
                    <Td>
                      <Select
                        aria-label={`Lecturer for ${c.code}`}
                        value={allocation?.lecturer.id ?? ''}
                        disabled={locked || allocate.isPending}
                        onChange={(e) => e.target.value && allocate.mutate({ courseId: c.id, lecturerId: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {candidates.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.lecturerProfile?.title ? `${l.lecturerProfile.title} ` : ''}
                            {l.fullName}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td className="text-right">
                      {allocation && !reg?.resultStatus && (
                        <Button size="icon" variant="ghost" aria-label={`Remove lecturer from ${c.code}`} onClick={() => unallocate.mutate(allocation.id)}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
