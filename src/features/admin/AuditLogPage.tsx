import { useQuery } from '@tanstack/react-query';
import { ChevronDown, History } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Badge, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api, type Paginated } from '@/lib/api';
import { actionLabel, cn, formatDate, ROLE_LABELS } from '@/lib/utils';
import type { AuditLogItem, Role } from '@/types/api';

const ACTION_GROUPS = [
  { value: '', label: 'All actions' },
  { value: 'result.', label: 'Results' },
  { value: 'registration.', label: 'Registrations' },
  { value: 'user.', label: 'User management' },
  { value: 'auth.', label: 'Sign-ins' },
  { value: 'course.', label: 'Courses & allocation' },
  { value: 'calendar.', label: 'Sessions & semesters' },
  { value: 'faculty.', label: 'Faculties' },
  { value: 'department.', label: 'Departments' },
  { value: 'program.', label: 'Programmes' },
  { value: 'settings.', label: 'Settings' },
];

export function AuditLogPage() {
  const me = useCurrentUser();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const query = { page, action, from, to };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit', query],
    queryFn: () => api.get<Paginated<AuditLogItem>>('/audit-logs', query),
    placeholderData: (prev) => prev,
  });

  return (
    <>
      <PageHeader
        title={me.role === 'SUPER_ADMIN' ? 'Audit log' : 'Department activity log'}
        description="An append-only record of every significant action. Entries cannot be edited or deleted."
      />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-3">
          <Select aria-label="Action type" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            {ACTION_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
          <Input aria-label="From date" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <Input aria-label="To date" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={History} title="No matching activity" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>When</Th>
                  <Th>Action</Th>
                  <Th>Performed by</Th>
                  <Th>Record</Th>
                  <Th>IP address</Th>
                  <Th>
                    <span className="sr-only">Details</span>
                  </Th>
                </tr>
              </THead>
              <TBody>
                {data.data.map((log) => (
                  <Fragment key={log.id}>
                    <Tr>
                      <Td className="text-xs whitespace-nowrap text-slate-500">{formatDate(log.createdAt, true)}</Td>
                      <Td className="font-medium">{actionLabel(log.action)}</Td>
                      <Td>
                        {log.actor ? (
                          <>
                            {log.actor.fullName}
                            {log.actorRole && <p className="text-xs text-slate-500">{ROLE_LABELS[log.actorRole as Role] ?? log.actorRole}</p>}
                          </>
                        ) : (
                          <Badge>Anonymous</Badge>
                        )}
                      </Td>
                      <Td className="text-xs text-slate-500">
                        {log.entityType}
                        {typeof log.metadata?.courseCode === 'string' && <span className="ml-1 font-medium text-slate-700">{log.metadata.courseCode}</span>}
                      </Td>
                      <Td className="font-mono text-xs text-slate-500">{log.ipAddress ?? '—'}</Td>
                      <Td className="text-right">
                        {log.metadata && (
                          <button
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            aria-expanded={expanded === log.id}
                            aria-label="Toggle details"
                          >
                            <ChevronDown className={cn('h-4 w-4 transition', expanded === log.id && 'rotate-180')} />
                          </button>
                        )}
                      </Td>
                    </Tr>
                    {expanded === log.id && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-4 py-3">
                          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
