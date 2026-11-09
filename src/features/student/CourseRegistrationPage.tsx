import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Lock, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, PageHeader, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { api, type DataResponse } from '@/lib/api';
import { cn, errorMessage, levelLabel } from '@/lib/utils';
import type { AvailableCourse, AvailableCourses } from '@/types/api';

export function CourseRegistrationPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dropTarget, setDropTarget] = useState<AvailableCourse | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['registrations', 'available'],
    queryFn: () => api.get<DataResponse<AvailableCourses>>('/registrations/available').then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['registrations'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const register = useMutation({
    mutationFn: (courseIds: string[]) => api.post<DataResponse<{ registered: number; totalUnits: number }>>('/registrations', { courseIds }),
    onSuccess: (res) => {
      toast.success(`Registered ${res.data.registered} course(s). You now carry ${res.data.totalUnits} units.`);
      setSelected(new Set());
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const drop = useMutation({
    mutationFn: (registrationId: string) => api.delete(`/registrations/${registrationId}`),
    onSuccess: () => {
      toast.success('Course dropped');
      setDropTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const selectedUnits = useMemo(
    () => (data?.courses ?? []).filter((c) => selected.has(c.id)).reduce((s, c) => s + c.units, 0),
    [data, selected],
  );

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />;

  const open = data.semester.registrationOpen;
  const projected = data.registeredUnits + selectedUnits;
  const overLimit = projected > data.maxUnits;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <PageHeader
        title="Course registration"
        description={`${data.semester.label} · ${data.student.program.name} · ${levelLabel(data.student.level)}`}
        actions={
          <Link to="/student/registration/slip">
            <Button variant="secondary">View registration slip</Button>
          </Link>
        }
      />

      {!open && (
        <Alert tone="warning" title="Registration is closed" className="mb-6">
          Course registration for {data.semester.label} is not currently open. Contact your department for assistance.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Available courses"
          description="Courses offered to your programme and level for this semester."
          actions={
            <div className="text-right text-sm">
              <p className={cn('font-semibold', overLimit ? 'text-red-600' : 'text-slate-900')}>
                {projected} / {data.maxUnits} units
              </p>
              <p className="text-xs text-slate-500">
                {data.registeredUnits} registered{selectedUnits ? ` + ${selectedUnits} selected` : ''}
              </p>
            </div>
          }
        />
        {data.courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses available" description="No courses are offered to your programme and level this semester." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th className="w-10">
                  <span className="sr-only">Select</span>
                </Th>
                <Th>Code</Th>
                <Th>Title</Th>
                <Th>Lecturer</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </THead>
            <TBody>
              {data.courses.map((c) => {
                const registered = !!c.registrationId;
                const disabled = !open || registered || c.locked;
                return (
                  <Tr key={c.id} className={cn(selected.has(c.id) && 'bg-brand-50/60')}>
                    <Td>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                        checked={registered || selected.has(c.id)}
                        disabled={disabled}
                        onChange={() => toggle(c.id)}
                        aria-label={`Select ${c.code}`}
                      />
                    </Td>
                    <Td className="font-medium whitespace-nowrap">{c.code}</Td>
                    <Td>
                      {c.title}
                      {c.department && <span className="ml-2 text-xs text-slate-400">{c.department.code}</span>}
                    </Td>
                    <Td className="text-slate-600">{c.lecturer ?? <span className="text-slate-400">To be assigned</span>}</Td>
                    <Td className="text-right">{c.units}</Td>
                    <Td className="text-right">
                      {registered ? (
                        <div className="flex items-center justify-end gap-2">
                          <Badge tone="success">Registered</Badge>
                          {open && (
                            <Button size="icon" variant="ghost" onClick={() => setDropTarget(c)} aria-label={`Drop ${c.code}`} title="Drop course">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : c.locked ? (
                        <Badge tone="neutral">
                          <Lock className="h-3 w-3" /> Closed
                        </Badge>
                      ) : (
                        <Badge tone="info">Available</Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
        {open && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <p className="text-sm text-slate-500">
              {overLimit
                ? `You can carry at most ${data.maxUnits} units in a semester.`
                : selected.size
                  ? `${selected.size} course(s) selected`
                  : 'Select the courses you want to register.'}
            </p>
            <Button disabled={selected.size === 0 || overLimit} loading={register.isPending} onClick={() => register.mutate([...selected])}>
              Register selected courses
            </Button>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!dropTarget}
        onClose={() => setDropTarget(null)}
        onConfirm={() => dropTarget?.registrationId && drop.mutate(dropTarget.registrationId)}
        title={`Drop ${dropTarget?.code ?? ''}?`}
        description="You can register it again while registration remains open."
        confirmLabel="Drop course"
        tone="danger"
        loading={drop.isPending}
      />
    </>
  );
}
