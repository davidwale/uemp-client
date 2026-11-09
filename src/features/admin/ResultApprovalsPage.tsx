import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Eye } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, Card, EmptyState, ErrorState, PageHeader, ResultStatusBadge, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useBasePath, useCurrentUser } from '@/hooks/useAuth';
import { api, type DataResponse } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { SheetListItem } from '@/types/api';
import { SemesterSelect } from '../shared/SemesterSelect';
import { useDepartments } from '../shared/queries';

const TABS = [
  { value: 'SUBMITTED', label: 'Awaiting approval' },
  { value: 'REJECTED', label: 'Returned' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DRAFT', label: 'In progress' },
  { value: '', label: 'All' },
];

export function ResultApprovalsPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const base = useBasePath();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'SUBMITTED';
  const semesterId = params.get('semesterId') ?? '';
  const departmentId = params.get('departmentId') ?? '';
  const { data: departments = [] } = useDepartments(isSuper);

  const setParam = (key: string, value: string) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key === 'status' && !value) next.set('status', '');
      return next;
    });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', 'sheets', status, semesterId, departmentId],
    queryFn: () => api.get<DataResponse<SheetListItem[]>>('/results/sheets', { status, semesterId, departmentId }).then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title={isSuper ? 'Result oversight' : 'Result approvals'}
        description={
          isSuper
            ? 'Monitor departmental result approvals across the university. Approval is performed by each department.'
            : 'Review results submitted by lecturers in your department.'
        }
        actions={
          <>
            {isSuper && (
              <Select aria-label="Department" value={departmentId} onChange={(e) => setParam('departmentId', e.target.value)} containerClassName="w-56">
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
            <SemesterSelect value={semesterId} onChange={(v) => setParam('semesterId', v)} label="" className="w-64" />
          </>
        }
      />
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={status === t.value}
              onClick={() => setParam('status', t.value)}
              className={cn(
                '-mb-px border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap',
                status === t.value ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Nothing here" description="No result sheets match this filter." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Course</Th>
                {isSuper && <Th>Dept</Th>}
                <Th>Semester</Th>
                <Th>Lecturer</Th>
                <Th className="text-right">Students</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th>
                  <span className="sr-only">Action</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {data.map((s) => (
                <Tr key={s.id} className="cursor-pointer" onClick={() => navigate(`${base}/results/${s.id}`)}>
                  <Td>
                    <Link to={`${base}/results/${s.id}`} className="font-medium text-brand-800 hover:underline" onClick={(e) => e.stopPropagation()}>
                      {s.course.code}
                    </Link>
                    <p className="text-xs text-slate-500">{s.course.title}</p>
                  </Td>
                  {isSuper && <Td>{s.course.department?.code}</Td>}
                  <Td className="text-sm">{s.semester.label}</Td>
                  <Td className="text-sm">{s.lecturer?.fullName}</Td>
                  <Td className="text-right">{s.entries}</Td>
                  <Td>
                    <ResultStatusBadge status={s.status} />
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDate(s.submittedAt ?? s.updatedAt, true)}</Td>
                  <Td className="text-right">
                    {/* Department admins act on submitted sheets; everything else is read-only viewing. */}
                    {!isSuper && s.status === 'SUBMITTED' ? (
                      <Button size="sm" tabIndex={-1}>
                        Review
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" tabIndex={-1} icon={<Eye className="h-4 w-4" />}>
                        View
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
