import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, Select, Spinner, Table, TBody, Td, Textarea, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { api, type Paginated } from '@/lib/api';
import { errorMessage, levelLabel } from '@/lib/utils';
import type { Course } from '@/types/api';
import { useDepartments, usePrograms } from '../shared/queries';

const schema = z.object({
  departmentId: z.string().min(1, 'Select a department'),
  code: z.string().trim().regex(/^[A-Za-z]{2,4}\s?\d{3}[A-Za-z]?$/, 'Format: CSC201'),
  title: z.string().trim().min(3, 'At least 3 characters'),
  description: z.string().trim().max(2000),
  units: z.coerce.number<string>().int().min(1).max(6),
  level: z.coerce.number<string>().int(),
  semesterType: z.enum(['FIRST', 'SECOND']),
  isActive: z.boolean(),
  programIds: z.array(z.string()).min(1, 'Offer the course to at least one programme'),
});
type FormInput = z.input<typeof schema>;

export function CoursesPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [semesterType, setSemesterType] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const debounced = useDebounce(search);
  const { data: departments = [] } = useDepartments(isSuper);

  const query = { page, search: debounced, level, semesterType, departmentId };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['courses', query],
    queryFn: () => api.get<Paginated<Course>>('/courses', query),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['courses'] });
      setDeleting(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title="Courses"
        description="Course codes, titles, units, levels and semester allocation."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New course
          </Button>
        }
      />
      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input aria-label="Search" placeholder="Search code or title…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {isSuper && (
            <Select aria-label="Department" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label="Level" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
            <option value="">All levels</option>
            {[100, 200, 300, 400, 500].map((l) => (
              <option key={l} value={l}>
                {l} Level
              </option>
            ))}
          </Select>
          <Select aria-label="Semester" value={semesterType} onChange={(e) => { setSemesterType(e.target.value); setPage(1); }}>
            <option value="">Both semesters</option>
            <option value="FIRST">First semester</option>
            <option value="SECOND">Second semester</option>
          </Select>
        </div>
        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses found" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Code</Th>
                  <Th>Title</Th>
                  <Th className="text-right">Units</Th>
                  <Th>Level</Th>
                  <Th>Semester</Th>
                  <Th>Offered to</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {data.data.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium whitespace-nowrap">{c.code}</Td>
                    <Td>
                      {c.title}
                      {isSuper && <p className="text-xs text-slate-500">{c.department?.name}</p>}
                    </Td>
                    <Td className="text-right">{c.units}</Td>
                    <Td>{levelLabel(c.level)}</Td>
                    <Td>{c.semesterType === 'FIRST' ? 'First' : 'Second'}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {c.programs.map((p) => (
                          <Badge key={p.id}>{p.code}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>{c.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${c.code}`} onClick={() => setEditing(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label={`Delete ${c.code}`} onClick={() => setDeleting(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      <CourseModal
        open={creating || !!editing}
        course={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title={`Delete ${deleting?.code ?? ''}?`}
        description="Courses that already have registrations or results cannot be deleted — mark them inactive instead."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}

function CourseModal({ open, course, onClose }: { open: boolean; course: Course | null; onClose: () => void }) {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const { data: departments = [] } = useDepartments(isSuper);
  // All programmes: courses may be offered across departments (e.g. MTH101 to CS students).
  const { data: programs = [] } = usePrograms();

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm<FormInput, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(
      course
        ? {
            departmentId: course.department?.id ?? '',
            code: course.code,
            title: course.title,
            description: course.description ?? '',
            units: String(course.units),
            level: String(course.level),
            semesterType: course.semesterType,
            isActive: course.isActive,
            programIds: course.programs.map((p) => p.id),
          }
        : {
            departmentId: isSuper ? '' : (me.department?.id ?? ''),
            code: '',
            title: '',
            description: '',
            units: '3',
            level: '100',
            semesterType: 'FIRST',
            isActive: true,
            programIds: [],
          },
    );
  }, [open, course, isSuper, me.department?.id, reset]);

  const selected = watch('programIds') ?? [];
  const level = Number(watch('level'));
  const toggleProgram = (id: string) =>
    setValue('programIds', selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id], { shouldValidate: true });

  const save = useMutation({
    mutationFn: (v: z.output<typeof schema>) => {
      const payload = { ...v, description: v.description || null };
      if (course) {
        const { departmentId: _d, ...rest } = payload;
        return api.patch(`/courses/${course.id}`, rest);
      }
      return api.post('/courses', payload);
    },
    onSuccess: () => {
      toast.success(course ? 'Course updated' : 'Course created');
      qc.invalidateQueries({ queryKey: ['courses'] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const e = formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={course ? `Edit ${course.code}` : 'New course'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>
            Save course
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(ev) => ev.preventDefault()} noValidate>
        {isSuper ? (
          <Select label="Owning department" required disabled={!!course} error={e.departmentId?.message} {...register('departmentId')} containerClassName="sm:col-span-2">
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input label="Owning department" value={me.department?.name ?? ''} disabled containerClassName="sm:col-span-2" />
        )}
        <Input label="Course code" required placeholder="CSC201" error={e.code?.message} {...register('code')} />
        <Input label="Title" required error={e.title?.message} {...register('title')} />
        <Select label="Units" required {...register('units')}>
          {[1, 2, 3, 4, 5, 6].map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <Select label="Level" required {...register('level')}>
          {[100, 200, 300, 400, 500, 600, 700].map((l) => (
            <option key={l} value={l}>
              {l} Level
            </option>
          ))}
        </Select>
        <Select label="Semester" required {...register('semesterType')}>
          <option value="FIRST">First semester</option>
          <option value="SECOND">Second semester</option>
        </Select>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 accent-brand-700" {...register('isActive')} /> Active (open for registration)
        </label>
        <Textarea label="Description" {...register('description')} containerClassName="sm:col-span-2" />
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-slate-700">
            Offered to programmes<span className="text-red-500">*</span>
          </legend>
          <div className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
            {programs.map((p) => {
              const tooShort = level > p.durationYears * 100;
              return (
                <label key={p.id} className="flex items-start gap-2 text-sm" title={tooShort ? `No ${level}L in this programme` : undefined}>
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-brand-700"
                    checked={selected.includes(p.id)}
                    disabled={tooShort && !selected.includes(p.id)}
                    onChange={() => toggleProgram(p.id)}
                  />
                  <span className={tooShort ? 'text-slate-400' : ''}>
                    {p.name} <span className="text-xs text-slate-400">({p.department?.code})</span>
                  </span>
                </label>
              );
            })}
          </div>
          {e.programIds && <p className="mt-1 text-xs text-red-600">{e.programIds.message}</p>}
        </fieldset>
      </form>
    </Modal>
  );
}
