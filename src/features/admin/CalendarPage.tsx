import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, CalendarRange, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState, ErrorState, Input, Modal, PageHeader, Select, Spinner } from '@/components/ui';
import { api, type DataResponse } from '@/lib/api';
import { ME_QUERY_KEY } from '@/lib/queryClient';
import { errorMessage, formatDate } from '@/lib/utils';
import type { AcademicSession, Semester } from '@/types/api';

export function CalendarPage() {
  const qc = useQueryClient();
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['calendar', 'sessions'],
    queryFn: () => api.get<DataResponse<AcademicSession[]>>('/calendar/sessions').then((r) => r.data),
  });
  const [newSession, setNewSession] = useState(false);
  const [semesterFor, setSemesterFor] = useState<AcademicSession | null>(null);
  const [activating, setActivating] = useState<Semester | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['calendar'] });
    qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const toggleRegistration = useMutation({
    mutationFn: (s: Semester) => api.patch(`/calendar/semesters/${s.id}`, { registrationOpen: !s.registrationOpen }),
    onSuccess: () => {
      toast.success('Registration status updated');
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const activate = useMutation({
    mutationFn: (id: string) => api.post(`/calendar/semesters/${id}/activate`),
    onSuccess: () => {
      toast.success('Current semester changed');
      setActivating(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title="Sessions & semesters"
        description="The current semester drives course registration, allocation and result entry across the university."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNewSession(true)}>
            New session
          </Button>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <EmptyState icon={CalendarRange} title="No academic sessions yet" />
      ) : (
        <div className="space-y-6">
          {data.map((session) => (
            <Card key={session.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {session.name} session {session.isCurrent && <Badge tone="success">Current</Badge>}
                  </span>
                }
                description={`${formatDate(session.startDate)} – ${formatDate(session.endDate)}`}
                actions={
                  session.semesters.length < 2 && (
                    <Button variant="secondary" size="sm" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setSemesterFor(session)}>
                      Add semester
                    </Button>
                  )
                }
              />
              <div className="divide-y divide-slate-100">
                {session.semesters.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">No semesters yet.</p>}
                {session.semesters.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-slate-900">
                        {s.type === 'FIRST' ? 'First' : 'Second'} semester
                        {s.isCurrent && <Badge tone="success">Current</Badge>}
                        {s.registrationOpen && <Badge tone="info">Registration open</Badge>}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDate(s.startDate)} – {formatDate(s.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {s.isCurrent ? (
                        <Button
                          size="sm"
                          variant={s.registrationOpen ? 'secondary' : 'success'}
                          loading={toggleRegistration.isPending && toggleRegistration.variables?.id === s.id}
                          onClick={() => toggleRegistration.mutate(s)}
                        >
                          {s.registrationOpen ? 'Close registration' : 'Open registration'}
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setActivating(s)}>
                          Make current
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewSessionModal open={newSession} onClose={() => setNewSession(false)} onDone={invalidate} />
      <NewSemesterModal session={semesterFor} onClose={() => setSemesterFor(null)} onDone={invalidate} />
      <ConfirmDialog
        open={!!activating}
        onClose={() => setActivating(null)}
        onConfirm={() => activating && activate.mutate(activating.id)}
        loading={activate.isPending}
        title={`Make ${activating?.label ?? ''} the current semester?`}
        description="Registration for the previous semester will close. Students, lecturers and administrators will immediately work in the new semester."
        confirmLabel="Make current"
      />
    </>
  );
}

function NewSessionModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const save = useMutation({
    mutationFn: () => api.post('/calendar/sessions', form),
    onSuccess: () => {
      toast.success('Session created');
      onDone();
      setForm({ name: '', startDate: '', endDate: '' });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New academic session"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={!form.name || !form.startDate || !form.endDate} onClick={() => save.mutate()}>
            Create session
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Session" required placeholder="2027/2028" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} containerClassName="sm:col-span-2" />
        <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input label="End date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      </div>
    </Modal>
  );
}

function NewSemesterModal({ session, onClose, onDone }: { session: AcademicSession | null; onClose: () => void; onDone: () => void }) {
  const existing = new Set(session?.semesters.map((s) => s.type));
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '' });
  const type = form.type || (existing.has('FIRST') ? 'SECOND' : 'FIRST');
  const save = useMutation({
    mutationFn: () => api.post('/calendar/semesters', { ...form, type, sessionId: session!.id }),
    onSuccess: () => {
      toast.success('Semester created');
      onDone();
      setForm({ type: '', startDate: '', endDate: '' });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <Modal
      open={!!session}
      onClose={onClose}
      title={`Add semester to ${session?.name ?? ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={!form.startDate || !form.endDate} onClick={() => save.mutate()}>
            Add semester
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Semester" value={type} onChange={(e) => setForm({ ...form, type: e.target.value })} containerClassName="sm:col-span-2">
          {!existing.has('FIRST') && <option value="FIRST">First semester</option>}
          {!existing.has('SECOND') && <option value="SECOND">Second semester</option>}
        </Select>
        <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <Input label="End date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      </div>
    </Modal>
  );
}
