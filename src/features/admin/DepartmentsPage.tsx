import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import type { Department } from '@/types/api';
import { useDepartments, useFaculties } from '../shared/queries';

export function DepartmentsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, error, refetch } = useDepartments();
  const { data: faculties = [] } = useFaculties();
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [form, setForm] = useState({ facultyId: '', name: '', code: '' });

  useEffect(() => {
    setForm(editing ? { facultyId: editing.facultyId, name: editing.name, code: editing.code } : { facultyId: '', name: '', code: '' });
  }, [editing, creating]);

  const close = () => {
    setCreating(false);
    setEditing(null);
  };
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['departments'] });
    qc.invalidateQueries({ queryKey: ['faculties'] });
  };

  const save = useMutation({
    mutationFn: () => (editing ? api.patch(`/organisation/departments/${editing.id}`, form) : api.post('/organisation/departments', form)),
    onSuccess: () => {
      toast.success(editing ? 'Department updated' : 'Department created');
      invalidate();
      close();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/organisation/departments/${id}`),
    onSuccess: () => {
      toast.success('Department deleted');
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const valid = form.facultyId && form.name.trim().length >= 3 && form.code.trim().length >= 2;

  return (
    <>
      <PageHeader
        title="Departments"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New department
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState icon={Building2} title="No departments yet" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Department</Th>
                <Th>Faculty</Th>
                <Th className="text-right">Programmes</Th>
                <Th className="text-right">Courses</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Lecturers</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {data.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <span className="font-medium">{d.name}</span> <span className="font-mono text-xs text-slate-500">{d.code}</span>
                  </Td>
                  <Td className="text-slate-600">{d.faculty?.name}</Td>
                  <Td className="text-right">{d.programCount}</Td>
                  <Td className="text-right">{d.courseCount}</Td>
                  <Td className="text-right">{d.studentCount}</Td>
                  <Td className="text-right">{d.lecturerCount}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}>
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
      <Modal
        open={creating || !!editing}
        onClose={close}
        title={editing ? 'Edit department' : 'New department'}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button loading={save.isPending} disabled={!valid} onClick={() => save.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Faculty" required value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} containerClassName="sm:col-span-3">
            <option value="">Select faculty…</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} containerClassName="sm:col-span-2" />
          <Input label="Code" required placeholder="CSC" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title={`Delete ${deleting?.name ?? ''}?`}
        description="Departments with programmes, courses or users cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
