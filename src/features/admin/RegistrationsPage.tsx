import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Search } from 'lucide-react';
import { useState } from 'react';
import { Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { api, type Paginated } from '@/lib/api';
import { formatDate, levelLabel } from '@/lib/utils';
import type { RegistrationRow } from '@/types/api';
import { SemesterSelect } from '../shared/SemesterSelect';
import { useDepartments } from '../shared/queries';

export function RegistrationsPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const [page, setPage] = useState(1);
  const [semesterId, setSemesterId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { data: departments = [] } = useDepartments(isSuper);

  const query = { page, semesterId, departmentId, level, search: debounced };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['registrations', 'list', query],
    queryFn: () => api.get<Paginated<RegistrationRow>>('/registrations', query),
    placeholderData: (prev) => prev,
  });
  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Course registrations"
        description={isSuper ? 'Monitor registrations across the university.' : 'Registrations by students in your department.'}
      />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input aria-label="Search" placeholder="Student, matric no. or course…" className="pl-9" value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
          </div>
          <SemesterSelect value={semesterId} onChange={reset(setSemesterId)} label="" />
          {isSuper && (
            <Select aria-label="Department" value={departmentId} onChange={(e) => reset(setDepartmentId)(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label="Level" value={level} onChange={(e) => reset(setLevel)(e.target.value)}>
            <option value="">All levels</option>
            {[100, 200, 300, 400, 500].map((l) => (
              <option key={l} value={l}>
                {l} Level
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No registrations found" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Student</Th>
                  <Th>Matric no.</Th>
                  <Th>Level</Th>
                  <Th>Course</Th>
                  <Th className="text-right">Units</Th>
                  <Th>Registered</Th>
                </tr>
              </THead>
              <TBody>
                {data.data.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <p className="font-medium">{r.student.fullName}</p>
                      <p className="text-xs text-slate-500">{r.student.program}</p>
                    </Td>
                    <Td className="font-mono text-xs">{r.student.matricNumber}</Td>
                    <Td>{levelLabel(r.student.level)}</Td>
                    <Td>
                      <span className="font-medium">{r.course.code}</span> <span className="text-slate-500">{r.course.title}</span>
                    </Td>
                    <Td className="text-right">{r.course.units}</Td>
                    <Td className="text-xs text-slate-500">{formatDate(r.registeredAt, true)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
