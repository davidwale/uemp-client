import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, PageHeader, ResultStatusBadge, Select, Spinner, StatCard, Table, TBody, Td, Th, THead, Tr, UserStatusBadge } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, apiUrl, type DataResponse } from '@/lib/api';
import { cn, formatNumber, levelLabel } from '@/lib/utils';
import { SemesterSelect } from '../shared/SemesterSelect';
import { useDepartments, usePrograms } from '../shared/queries';

type Tab = 'registrations' | 'performance' | 'students';

interface RegistrationReport {
  rows: { courseId: string; code: string; title: string; units: number; level: number; department: string; lecturer: string | null; registered: number; resultStatus: string | null }[];
  totals: { courses: number; registrations: number; unallocated: number };
}
interface PerformanceReport {
  rows: { code: string; title: string; units: number; department: string; students: number; average: number | null; highest: number | null; lowest: number | null; passRate: number | null; distribution: Record<string, number> }[];
  totals: { courses: number; results: number; average: number | null; passRate: number | null };
}
interface StudentRow {
  matricNumber: string;
  lastName: string;
  firstName: string;
  email: string;
  level: number;
  program: string;
  department: string;
  status: string;
  entryYear: number;
}

export function ReportsPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<Tab>('registrations');
  const [semesterId, setSemesterId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [level, setLevel] = useState('');
  const { data: departments = [] } = useDepartments(isSuper);
  const { data: programs = [] } = usePrograms(isSuper ? departmentId || undefined : me.department?.id);

  const filters = tab === 'students' ? { departmentId, programId, level } : { departmentId, semesterId };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', tab, filters],
    queryFn: () => api.get<DataResponse<unknown>>(`/reports/${tab}`, filters).then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title="Reports"
        description="Student lists, course registration reports and academic performance summaries."
        actions={
          <a href={apiUrl(`/reports/${tab}`, { ...filters, format: 'csv' })}>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
              Export CSV
            </Button>
          </a>
        }
      />
      <Card className="mb-6">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3" role="tablist">
          {(
            [
              ['registrations', 'Course registrations'],
              ['performance', 'Academic performance'],
              ['students', 'Student list'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                '-mb-px border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap',
                tab === value ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isSuper && (
            <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          {tab === 'students' ? (
            <>
              <Select label="Programme" value={programId} onChange={(e) => setProgramId(e.target.value)}>
                <option value="">All programmes</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">All levels</option>
                {[100, 200, 300, 400, 500].map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <SemesterSelect value={semesterId} onChange={setSemesterId} />
          )}
        </CardBody>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : tab === 'registrations' ? (
        <RegistrationsReport data={data as RegistrationReport} />
      ) : tab === 'performance' ? (
        <PerformanceReportView data={data as PerformanceReport} />
      ) : (
        <StudentsReport rows={data as StudentRow[]} />
      )}
    </>
  );
}

function RegistrationsReport({ data }: { data: RegistrationReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Courses offered" value={data.totals.courses} />
        <StatCard label="Total registrations" value={data.totals.registrations} tone="sky" />
        <StatCard label="Without lecturer" value={data.totals.unallocated} tone={data.totals.unallocated ? 'amber' : 'emerald'} />
      </div>
      <Card>
        {data.rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="No courses for this semester" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Course</Th>
                <Th>Dept</Th>
                <Th>Level</Th>
                <Th>Lecturer</Th>
                <Th className="text-right">Registered</Th>
                <Th>Results</Th>
              </tr>
            </THead>
            <TBody>
              {data.rows.map((r) => (
                <Tr key={r.courseId}>
                  <Td>
                    <span className="font-medium">{r.code}</span> <span className="text-slate-500">{r.title}</span>
                  </Td>
                  <Td>{r.department}</Td>
                  <Td>{levelLabel(r.level)}</Td>
                  <Td className="text-sm">{r.lecturer ?? <Badge tone="warning">Unassigned</Badge>}</Td>
                  <Td className="text-right font-medium">{r.registered}</Td>
                  <Td>
                    <ResultStatusBadge status={r.resultStatus ?? 'NOT_STARTED'} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function PerformanceReportView({ data }: { data: PerformanceReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Courses with approved results" value={data.totals.courses} />
        <StatCard label="Results" value={data.totals.results} tone="sky" />
        <StatCard label="Average score" value={formatNumber(data.totals.average)} tone="emerald" />
        <StatCard label="Pass rate" value={data.totals.passRate === null ? '—' : `${data.totals.passRate}%`} tone="amber" />
      </div>
      <Card>
        {data.rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="No approved results yet" description="Only approved results are included in performance reports." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Course</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Average</Th>
                <Th className="text-right">High / Low</Th>
                <Th className="text-right">Pass rate</Th>
                <Th>Grade distribution</Th>
              </tr>
            </THead>
            <TBody>
              {data.rows.map((r) => (
                <Tr key={r.code}>
                  <Td>
                    <span className="font-medium">{r.code}</span> <span className="text-slate-500">{r.title}</span>
                  </Td>
                  <Td className="text-right">{r.students}</Td>
                  <Td className="text-right font-medium">{formatNumber(r.average)}</Td>
                  <Td className="text-right text-slate-600">
                    {r.highest} / {r.lowest}
                  </Td>
                  <Td className="text-right">{r.passRate}%</Td>
                  <Td>
                    <div className="flex h-3 w-48 overflow-hidden rounded-full bg-slate-100" title={Object.entries(r.distribution).map(([g, n]) => `${g}: ${n}`).join('  ')}>
                      {Object.entries(r.distribution).map(([g, n]) =>
                        n ? (
                          <div
                            key={g}
                            style={{ width: `${(n / r.students) * 100}%` }}
                            className={cn({ A: 'bg-emerald-500', B: 'bg-brand-500', C: 'bg-sky-400', D: 'bg-amber-400', E: 'bg-orange-400', F: 'bg-red-500' }[g])}
                          />
                        ) : null,
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {Object.entries(r.distribution)
                        .filter(([, n]) => n)
                        .map(([g, n]) => `${g}:${n}`)
                        .join(' · ')}
                    </p>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function StudentsReport({ rows }: { rows: StudentRow[] }) {
  return (
    <Card>
      {rows.length === 0 ? (
        <EmptyState title="No students match these filters" />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Matric no.</Th>
              <Th>Name</Th>
              <Th>Programme</Th>
              <Th>Level</Th>
              <Th>Entry</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((s) => (
              <Tr key={s.matricNumber}>
                <Td className="font-mono text-xs">{s.matricNumber}</Td>
                <Td>
                  {s.lastName}, {s.firstName}
                  <p className="text-xs text-slate-500">{s.email}</p>
                </Td>
                <Td className="text-sm">{s.program}</Td>
                <Td>{levelLabel(s.level)}</Td>
                <Td>{s.entryYear}</Td>
                <Td>
                  <UserStatusBadge status={s.status} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
