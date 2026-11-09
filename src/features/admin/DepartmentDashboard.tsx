import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardCheck, ClipboardList, Layers, UserCog, Users } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, Badge, Button, Card, CardBody, CardHeader, ErrorState, PageHeader, ResultStatusBadge, Spinner, StatCard } from '@/components/ui';
import { api, type DataResponse } from '@/lib/api';
import type { ActivityItem, Semester } from '@/types/api';
import { ActivityFeed } from './ActivityFeed';

interface DeptDashboard {
  semester: Semester | null;
  department: { id: string; name: string; code: string; faculty: string | null } | null;
  counts: { students: number; lecturers: number; courses: number; programs: number; registrations: number };
  resultStatus: Record<string, number>;
  pendingApprovals: number;
  unallocatedCourses: { id: string; code: string; title: string; level: number }[];
  recentActivity: ActivityItem[];
}

export function DepartmentDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DataResponse<DeptDashboard>>('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title={`Department of ${data.department?.name ?? ''}`}
        description={`${data.department?.faculty ?? ''} · ${data.semester?.label ?? 'No active semester'}`}
      />
      <div className="space-y-6">
        {data.pendingApprovals > 0 && (
          <Alert tone="warning" title={`${data.pendingApprovals} result sheet(s) awaiting your approval`}>
            <Link to="/department/results?status=SUBMITTED" className="font-medium underline">
              Review submitted results
            </Link>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Active students" value={data.counts.students} icon={Users} />
          <StatCard label="Lecturers" value={data.counts.lecturers} icon={UserCog} tone="sky" />
          <StatCard label="Courses" value={data.counts.courses} icon={BookOpen} tone="emerald" />
          <StatCard label="Programmes" value={data.counts.programs} icon={Layers} tone="amber" />
          <StatCard label="Registrations" value={data.counts.registrations} hint="This semester" icon={ClipboardList} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader title="Result submissions" description="This semester" />
            <CardBody className="space-y-3">
              {(['SUBMITTED', 'REJECTED', 'DRAFT', 'APPROVED'] as const).map((s) => (
                <div key={s} className="flex items-center justify-between">
                  <ResultStatusBadge status={s} />
                  <span className="font-semibold">{data.resultStatus[s] ?? 0}</span>
                </div>
              ))}
              <Link to="/department/results">
                <Button variant="secondary" size="sm" className="mt-2 w-full" icon={<ClipboardCheck className="h-4 w-4" />}>
                  Result approvals
                </Button>
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Unallocated courses" description="Scheduled this semester without a lecturer" />
            <CardBody>
              {data.unallocatedCourses.length === 0 ? (
                <p className="text-sm text-slate-500">Every course has a lecturer. 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {data.unallocatedCourses.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span>
                        <strong>{c.code}</strong> <span className="text-slate-500">{c.title}</span>
                      </span>
                      <Badge tone="warning">{c.level}L</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/department/allocations" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
                Manage allocations →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <ActivityFeed items={data.recentActivity.slice(0, 6)} />
          </Card>
        </div>
      </div>
    </>
  );
}
