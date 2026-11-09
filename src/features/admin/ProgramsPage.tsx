import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import type { Program } from '@/types/api';
import { useDepartments, usePrograms } from '../shared/queries';

const schema = z.object({
  departmentId: z.string().min(1, 'Select a department'),
  name: z.string().trim().min(3, 'At least 3 characters'),
  code: z.string().trim().min(2, 'At least 2 characters'),
  degree: z.string().trim().min(2, 'Required'),
  durationYears: z.coerce.number<string>().int().min(1).max(7),
});
type FormValues = z.input<typeof schema>;

/**
 * Programmes define the academic levels available to students:
 * a 4-year programme has levels 100–400.
 */
export function ProgramsPage() {
  const me = useCurrentUser();
  const isSuper = me.role === 'SUPER_ADMIN';
  const qc = useQueryClient();
  const { data: programs = [], isLoading, error, refetch } = usePrograms(isSuper ? undefined : me.department?.id);
  const { data: departments = [] } = useDepartments(isSuper);
  const [editing, setEditing] = useState<Program | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Program | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/organisation/programs/${id}`),
    onSuccess: () => {
      toast.success('Programme deleted');
      qc.invalidateQueries({ queryKey: ['programs'] });
      setDeleting(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title="Programmes & academic levels"
        description="Each programme’s duration determines the levels students can be placed in."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New programme
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : programs.length === 0 ? (
          <EmptyState icon={Layers} title="No programmes yet" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Programme</Th>
                <Th>Code</Th>
                {isSuper && <Th>Department</Th>}
                <Th>Levels</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {programs.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="font-mono text-xs">{p.code}</Td>
                  {isSuper && <Td className="text-slate-600">{p.department?.name}</Td>}
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {p.levels.map((l) => (
                        <Badge key={l} tone="brand">
                          {l}L
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-right">{p.studentCount}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <ProgramModal
        open={creating || !!editing}
        program={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        departments={isSuper ? departments : me.department ? [{ id: me.department.id, name: me.department.name }] : []}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title={`Delete ${deleting?.name ?? ''}?`}
        description="Programmes with enrolled students or offered courses cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}

function ProgramModal({
  open,
  program,
  onClose,
  departments,
}: {
  open: boolean;
  program: Program | null;
  onClose: () => void;
  departments: { id: string; name: string }[];
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm<FormValues, unknown, z.output<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open)
      reset(
        program
          ? { departmentId: program.departmentId, name: program.name, code: program.code, degree: program.degree, durationYears: String(program.durationYears) }
          : { departmentId: departments.length === 1 ? departments[0]!.id : '', name: '', code: '', degree: 'B.Sc.', durationYears: '4' },
      );
  }, [open, program, departments, reset]);

  const save = useMutation({
    mutationFn: (v: z.output<typeof schema>) => {
      const { departmentId: _departmentId, ...rest } = v;
      return program ? api.patch(`/organisation/programs/${program.id}`, rest) : api.post('/organisation/programs', v);
    },
    onSuccess: () => {
      toast.success(program ? 'Programme updated' : 'Programme created');
      qc.invalidateQueries({ queryKey: ['programs'] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const e = formState.errors;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={program ? 'Edit programme' : 'New programme'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={handleSubmit((v) => save.mutate(v))}>
            Save
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(ev) => ev.preventDefault()} noValidate>
        <Select label="Department" required disabled={!!program} error={e.departmentId?.message} {...register('departmentId')} containerClassName="sm:col-span-2">
          <option value="">Select department…</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Input label="Programme name" required placeholder="B.Sc. Computer Science" error={e.name?.message} {...register('name')} containerClassName="sm:col-span-2" />
        <Input label="Code" required placeholder="BSC-CSC" error={e.code?.message} {...register('code')} />
        <Input label="Degree" required placeholder="B.Sc." error={e.degree?.message} {...register('degree')} />
        <Select label="Duration" required error={e.durationYears?.message} {...register('durationYears')}>
          {[1, 2, 3, 4, 5, 6, 7].map((y) => (
            <option key={y} value={y}>
              {y} year{y > 1 ? 's' : ''} ({y * 100}L max)
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
