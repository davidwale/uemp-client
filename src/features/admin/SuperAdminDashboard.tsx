import { useQuery } from '@tanstack/react-query';
import { BookOpen, Building2, ClipboardList, GraduationCap, Landmark, UserCog } from 'lucide-react';
import { Card, CardBody, CardHeader, ErrorState, PageHeader, ResultStatusBadge, Spinner, StatCard, Table, TBody, Td, Th, THead, Tr, UserStatusBadge } from '@/components/ui';
import { api, type DataResponse } from '@/lib/api';
import type { ActivityItem, Semester } from '@/types/api';
import { ActivityFeed } from './ActivityFeed';

interface SuperDashboard {
  semester: Semester | null;
  counts: { faculties: number; departments: number; programs: number; courses: number; registrations: number; allocations: number; resultSheets: number };
  users: { byRole: Record<string, number>; byStatus: Record<string, number> };
  resultStatus: Record<string, number>;
  departments: { id: string; code: string; name: string; students: number; lecturers: number; registrations: number; pendingApprovals: number; approvedSheets: number }[];
  recentActivity: ActivityItem[];
}

export function SuperAdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DataResponse<SuperDashboard>>('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader title="University overview" description={data.semester ? `${data.semester.label}${data.semester.registrationOpen ? ' · Registration open' : ''}` : 'No active semester'} />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Faculties" value={data.counts.faculties} icon={Landmark} />
          <StatCard label="Departments" value={data.counts.departments} icon={Building2} tone="sky" />
          <StatCard label="Students" value={data.users.byRole.STUDENT ?? 0} icon={GraduationCap} tone="emerald" />
          <StatCard label="Lecturers" value={data.users.byRole.LECTURER ?? 0} icon={UserCog} tone="amber" />
          <StatCard label="Active courses" value={data.counts.courses} icon={BookOpen} />
          <StatCard label="Registrations" value={data.counts.registrations} hint="This semester" icon={ClipboardList} tone="sky" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Departments" description="Current semester activity" />
            <Table>
              <THead>
                <tr>
                  <Th>Department</Th>
                  <Th className="text-right">Students</Th>
                  <Th className="text-right">Lecturers</Th>
                  <Th className="text-right">Registrations</Th>
                  <Th className="text-right">Pending approval</Th>
                  <Th className="text-right">Approved sheets</Th>
                </tr>
              </THead>
              <TBody>
                {data.departments.map((d) => (
                  <Tr key={d.id}>
                    <Td>
                      <span className="font-medium">{d.code}</span> <span className="text-slate-500">{d.name}</span>
                    </Td>
                    <Td className="text-right">{d.students}</Td>
                    <Td className="text-right">{d.lecturers}</Td>
                    <Td className="text-right">{d.registrations}</Td>
                    <Td className="text-right">
                      {d.pendingApprovals > 0 ? <span className="font-semibold text-amber-700">{d.pendingApprovals}</span> : 0}
                    </Td>
                    <Td className="text-right">{d.approvedSheets}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Result approvals" description="This semester" />
              <CardBody className="space-y-3">
                {(['SUBMITTED', 'REJECTED', 'DRAFT', 'APPROVED'] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <ResultStatusBadge status={s} />
                    <span className="font-semibold">{data.resultStatus[s] ?? 0}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Accounts" />
              <CardBody className="space-y-3">
                {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <UserStatusBadge status={s} />
                    <span className="font-semibold">{data.users.byStatus[s] ?? 0}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader title="Recent system activity" />
          <ActivityFeed items={data.recentActivity} />
        </Card>
      </div>
    </>
  );
}
