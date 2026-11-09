import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import type { Faculty } from '@/types/api';
import { useFaculties } from '../shared/queries';

export function FacultiesPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, error, refetch } = useFaculties();
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Faculty | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    setName(editing?.name ?? '');
    setCode(editing?.code ?? '');
  }, [editing, creating]);

  const close = () => {
    setCreating(false);
    setEditing(null);
  };
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['faculties'] });
    qc.invalidateQueries({ queryKey: ['departments'] });
  };

  const save = useMutation({
    mutationFn: () => (editing ? api.patch(`/organisation/faculties/${editing.id}`, { name, code }) : api.post('/organisation/faculties', { name, code })),
    onSuccess: () => {
      toast.success(editing ? 'Faculty updated' : 'Faculty created');
      invalidate();
      close();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/organisation/faculties/${id}`),
    onSuccess: () => {
      toast.success('Faculty deleted');
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title="Faculties"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New faculty
          </Button>
        }
      />
      <Card>
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState icon={Landmark} title="No faculties yet" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Faculty</Th>
                <Th>Code</Th>
                <Th className="text-right">Departments</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {data.map((f) => (
                <Tr key={f.id}>
                  <Td className="font-medium">{f.name}</Td>
                  <Td className="font-mono text-xs">{f.code}</Td>
                  <Td className="text-right">{f.departmentCount}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${f.name}`} onClick={() => setDeleting(f)}>
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
        title={editing ? 'Edit faculty' : 'New faculty'}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button loading={save.isPending} disabled={name.trim().length < 3 || code.trim().length < 2} onClick={() => save.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Name" required placeholder="Faculty of Science" value={name} onChange={(e) => setName(e.target.value)} containerClassName="sm:col-span-2" />
          <Input label="Code" required placeholder="SCI" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title={`Delete ${deleting?.name ?? ''}?`}
        description="Faculties that still contain departments cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
      />
    </>
  );
}
