import { useQuery } from '@tanstack/react-query';
import { BookOpen, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, StatCard, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, type DataResponse } from '@/lib/api';
import { formatNumber, levelLabel } from '@/lib/utils';
import type { RegistrationSlip, Semester } from '@/types/api';

interface StudentDashboardData {
  semester: Semester | null;
  registeredCourses: number;
  registeredUnits: number;
  registrations: RegistrationSlip['registrations'];
  cgpa: number;
  classOfDegree: string | null;
  lastGpa: number | null;
  lastGpaSemester: string | null;
  completedUnits: number;
  gpaTrend: { label: string; gpa: number; cgpa: number }[];
}

export function StudentDashboard() {
  const user = useCurrentUser();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DataResponse<StudentDashboardData>>('/dashboard').then((r) => r.data),
  });

  const profile = user.studentProfile;

  return (
    <>
      <PageHeader title={`Welcome, ${user.firstName}`} description={`${user.department?.name ?? ''} · ${profile?.program?.name ?? ''} · ${levelLabel(profile?.level)} · ${profile?.matricNumber ?? ''}`} />
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          {data.semester?.registrationOpen && data.registeredCourses === 0 && (
            <Alert tone="warning" title="You have not registered any courses this semester">
              Registration for {data.semester.label} is open.{' '}
              <Link to="/student/registration" className="font-medium underline">
                Register now
              </Link>
              .
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registered courses" value={data.registeredCourses} hint={data.semester?.label} icon={BookOpen} />
            <StatCard label="Registered units" value={data.registeredUnits} hint="This semester" icon={ClipboardList} tone="sky" />
            <StatCard
              label="Cumulative GPA"
              value={data.completedUnits ? formatNumber(data.cgpa) : '—'}
              hint={data.classOfDegree ?? 'No approved results yet'}
              icon={GraduationCap}
              tone="emerald"
            />
            <StatCard
              label="Last semester GPA"
              value={data.lastGpa !== null ? formatNumber(data.lastGpa) : '—'}
              hint={data.lastGpaSemester ?? undefined}
              icon={TrendingUp}
              tone="amber"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Registered courses"
                description={data.semester?.label}
                actions={
                  <Link to="/student/registration">
                    <Button variant="secondary" size="sm">
                      Manage registration
                    </Button>
                  </Link>
                }
              />
              {data.registrations.length === 0 ? (
                <EmptyState icon={BookOpen} title="No courses registered yet" />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Title</Th>
                      <Th className="text-right">Units</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {data.registrations.map((r) => (
                      <Tr key={r.id}>
                        <Td className="font-medium">{r.course.code}</Td>
                        <Td>{r.course.title}</Td>
                        <Td className="text-right">{r.course.units}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>

            <Card>
              <CardHeader title="GPA history" description="Approved results only" />
              <CardBody>
                {data.gpaTrend.length === 0 ? (
                  <p className="text-sm text-slate-500">Your GPA will appear here once results are approved.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.gpaTrend.map((t) => (
                      <li key={t.label}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{t.label}</span>
                          <span className="font-medium text-slate-900">{formatNumber(t.gpa)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${(t.gpa / 5) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Link to="/student/results" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
                  View full results →
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
