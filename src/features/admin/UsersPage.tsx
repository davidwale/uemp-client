import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Spinner,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  UserStatusBadge,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { api, type Paginated } from '@/lib/api';
import { errorMessage, formatDate, levelLabel, ROLE_LABELS } from '@/lib/utils';
import type { Role, User, UserStatus } from '@/types/api';
import { useDepartments, usePrograms } from '../shared/queries';
import { UserFormModal } from './UserFormModal';

interface Props {
  /** Restricts the page to one role (Department Admin "Students" / "Lecturers" pages). */
  role?: Extract<Role, 'STUDENT' | 'LECTURER'>;
}

export function UsersPage({ role }: Props) {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(role ?? '');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programId, setProgramId] = useState('');
  const [level, setLevel] = useState('');
  const debouncedSearch = useDebounce(search);

  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const { data: departments = [] } = useDepartments(isSuper);
  const { data: programs = [] } = usePrograms(isSuper ? departmentId || undefined : me.department?.id);

  const query = {
    page,
    pageSize: 20,
    search: debouncedSearch,
    role: roleFilter,
    status,
    departmentId,
    programId,
    level,
  };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', query],
    queryFn: () => api.get<Paginated<User>>('/users', query),
    placeholderData: (prev) => prev,
  });

  const showStudentCols = roleFilter === 'STUDENT';
  const title = role === 'STUDENT' ? 'Students' : role === 'LECTURER' ? 'Lecturers' : 'Users';
  const allowedRoles: Role[] = role ? [role] : isSuper ? ['STUDENT', 'LECTURER', 'DEPT_ADMIN', 'SUPER_ADMIN'] : ['STUDENT', 'LECTURER'];
  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={title}
        description={isSuper ? 'All accounts across the university.' : `Accounts in the ${me.department?.name} department.`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New {role ? ROLE_LABELS[role].toLowerCase() : 'user'}
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              aria-label="Search"
              placeholder="Search name, email, matric or staff number…"
              className="pl-9"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
            />
          </div>
          {!role && (
            <Select aria-label="Role" value={roleFilter} onChange={(e) => resetPage(setRoleFilter)(e.target.value)}>
              <option value="">All roles</option>
              {allowedRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          )}
          {isSuper && (
            <Select aria-label="Department" value={departmentId} onChange={(e) => resetPage(setDepartmentId)(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label="Status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          {showStudentCols && (
            <>
              <Select aria-label="Programme" value={programId} onChange={(e) => resetPage(setProgramId)(e.target.value)}>
                <option value="">All programmes</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select aria-label="Level" value={level} onChange={(e) => resetPage(setLevel)(e.target.value)}>
                <option value="">All levels</option>
                {[100, 200, 300, 400, 500].map((l) => (
                  <option key={l} value={l}>
                    {l} Level
                  </option>
                ))}
              </Select>
            </>
          )}
        </div>

        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={Users} title="No accounts found" description="Try adjusting your filters." />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Name</Th>
                  {showStudentCols ? (
                    <>
                      <Th>Matric no.</Th>
                      <Th>Programme</Th>
                      <Th>Level</Th>
                    </>
                  ) : (
                    <>
                      <Th>Role</Th>
                      <Th>Department</Th>
                    </>
                  )}
                  <Th>Status</Th>
                  <Th>Last sign-in</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {data.data.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <p className="font-medium text-slate-900">
                        {u.lecturerProfile?.title ? `${u.lecturerProfile.title} ` : ''}
                        {u.fullName}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </Td>
                    {showStudentCols ? (
                      <>
                        <Td className="font-mono text-xs">{u.studentProfile?.matricNumber}</Td>
                        <Td className="text-slate-600">{u.studentProfile?.program?.code}</Td>
                        <Td>{levelLabel(u.studentProfile?.level)}</Td>
                      </>
                    ) : (
                      <>
                        <Td>
                          <Badge tone={u.role === 'SUPER_ADMIN' ? 'brand' : 'neutral'}>{ROLE_LABELS[u.role]}</Badge>
                          {u.studentProfile && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{u.studentProfile.matricNumber}</p>}
                          {u.lecturerProfile && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{u.lecturerProfile.staffNumber}</p>}
                        </Td>
                        <Td className="text-slate-600">{u.department?.code ?? '—'}</Td>
                      </>
                    )}
                    <Td>
                      <UserStatusBadge status={u.status} />
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(u.lastLoginAt, true)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Edit" aria-label={`Edit ${u.fullName}`} onClick={() => setEditing(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Reset password" aria-label={`Reset password for ${u.fullName}`} onClick={() => setResetTarget(u)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {isSuper && u.id !== me.id && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setStatusTarget(u)}>
                              Status
                            </Button>
                            {u.role !== 'STUDENT' && (
                              <Button size="icon" variant="ghost" title="Change role" aria-label={`Change role for ${u.fullName}`} onClick={() => setRoleTarget(u)}>
                                <ShieldCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
          </>
        )}
      </Card>

      <UserFormModal
        open={creating || !!editing}
        user={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        defaultRole={role ?? ((roleFilter || 'STUDENT') as Role)}
        allowedRoles={allowedRoles}
      />
      <StatusModal user={statusTarget} onClose={() => setStatusTarget(null)} onDone={() => qc.invalidateQueries({ queryKey: ['users'] })} />
      <RoleModal user={roleTarget} onClose={() => setRoleTarget(null)} onDone={() => qc.invalidateQueries({ queryKey: ['users'] })} />
      <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
    </>
  );
}

function StatusModal({ user, onClose, onDone }: { user: User | null; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (user) {
      setStatus(user.status);
      setReason('');
    }
  }, [user]);
  const mutation = useMutation({
    mutationFn: () => api.patch(`/users/${user!.id}/status`, { status, reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Account status updated');
      onDone();
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Account status — ${user?.fullName ?? ''}`}
      description="Deactivating or suspending signs the user out of every device immediately."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={status === 'ACTIVE' ? 'primary' : 'danger'} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Update status
          </Button>
        </>
      }
    >
      <div className="space-y-4" key={user?.id}>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive (deactivated)</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Input label="Reason (recorded in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}

function RoleModal({ user, onClose, onDone }: { user: User | null; onClose: () => void; onDone: () => void }) {
  const { data: departments = [] } = useDepartments(!!user);
  const [role, setRole] = useState<Role>('LECTURER');
  const [departmentId, setDepartmentId] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setDepartmentId(user.department?.id ?? '');
      setStaffNumber('');
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/users/${user!.id}/role`, {
        role,
        departmentId: role === 'SUPER_ADMIN' ? undefined : departmentId || undefined,
        staffNumber: staffNumber || undefined,
      }),
    onSuccess: () => {
      toast.success('Role updated');
      onDone();
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Change role — ${user?.fullName ?? ''}`}
      description="Permissions take effect on the user’s next request."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Change role
          </Button>
        </>
      }
    >
      <div className="space-y-4" key={user?.id}>
        <Select label="New role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="LECTURER">Lecturer</option>
          <option value="DEPT_ADMIN">Department Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </Select>
        {role !== 'SUPER_ADMIN' && (
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
        {role === 'LECTURER' && !user?.lecturerProfile && (
          <Input label="Staff number" required value={staffNumber} onChange={(e) => setStaffNumber(e.target.value)} />
        )}
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => api.post(`/users/${user!.id}/reset-password`, { password }),
    onSuccess: () => {
      toast.success('Password reset. The user has been signed out everywhere.');
      setPassword('');
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const valid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Reset password — ${user?.fullName ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Reset password
          </Button>
        </>
      }
    >
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 8 characters with a letter and a number."
      />
    </Modal>
  );
}
