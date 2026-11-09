import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, Button, Card, CardBody, CardHeader, PageHeader, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { api, ApiError, type DataResponse } from '@/lib/api';
import { errorMessage, ROLE_LABELS } from '@/lib/utils';
import type { GradeBand, Role } from '@/types/api';
import { useAcademicSettings } from '../shared/queries';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="System-wide academic configuration and the access-control policy." />
      <div className="space-y-6">
        <GradeScaleEditor />
        <PermissionMatrix />
      </div>
    </>
  );
}

function GradeScaleEditor() {
  const qc = useQueryClient();
  const { data, isLoading } = useAcademicSettings();
  const [bands, setBands] = useState<GradeBand[]>([]);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  useEffect(() => {
    if (data) setBands(data.gradeScale);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put('/settings/grade-scale', { bands }),
    onSuccess: () => {
      toast.success('Grading scale updated');
      setServerErrors([]);
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => {
      if (err instanceof ApiError && Array.isArray(err.details) && err.details.every((d) => typeof d === 'string')) {
        setServerErrors(err.details as string[]);
      }
      toast.error(errorMessage(err));
    },
  });

  const update = (i: number, field: keyof GradeBand, value: string) =>
    setBands((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: field === 'grade' || field === 'remark' ? value : Number(value) } : b)));

  if (isLoading || !data) return <Spinner />;
  const cell = 'h-9 w-full rounded-md border border-slate-300 px-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none';

  return (
    <Card>
      <CardHeader
        title="Grading scale"
        description={`Scores are CA (max ${data.caMaxScore}) + Exam (max ${data.examMaxScore}). GPA = Σ(units × grade point) ÷ Σ units.`}
        actions={
          <Button icon={<Check className="h-4 w-4" />} loading={save.isPending} onClick={() => save.mutate()}>
            Save scale
          </Button>
        }
      />
      <CardBody className="space-y-4">
        <Alert tone="info">
          Changes apply to results graded from now on. Approved results keep the grade they were approved with, so published transcripts never change silently.
        </Alert>
        {serverErrors.length > 0 && (
          <Alert tone="danger" title="The scale is invalid">
            <ul className="list-disc pl-4">
              {serverErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
        <Table>
          <THead>
            <tr>
              <Th>Grade</Th>
              <Th>Min score</Th>
              <Th>Max score</Th>
              <Th>Grade point</Th>
              <Th>Remark</Th>
              <Th>
                <span className="sr-only">Remove</span>
              </Th>
            </tr>
          </THead>
          <TBody>
            {bands.map((b, i) => (
              <Tr key={i}>
                <Td>
                  <input aria-label="Grade" className={cell} value={b.grade} maxLength={2} onChange={(e) => update(i, 'grade', e.target.value)} />
                </Td>
                <Td>
                  <input aria-label="Min score" type="number" className={cell} value={b.minScore} onChange={(e) => update(i, 'minScore', e.target.value)} />
                </Td>
                <Td>
                  <input aria-label="Max score" type="number" className={cell} value={b.maxScore} onChange={(e) => update(i, 'maxScore', e.target.value)} />
                </Td>
                <Td>
                  <input aria-label="Grade point" type="number" className={cell} value={b.gradePoint} onChange={(e) => update(i, 'gradePoint', e.target.value)} />
                </Td>
                <Td>
                  <input aria-label="Remark" className={cell} value={b.remark} onChange={(e) => update(i, 'remark', e.target.value)} />
                </Td>
                <Td>
                  <Button size="icon" variant="ghost" aria-label="Remove band" onClick={() => setBands(bands.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setBands([...bands, { grade: '', minScore: 0, maxScore: 0, gradePoint: 0, remark: '' }])}
        >
          Add band
        </Button>
      </CardBody>
    </Card>
  );
}

function PermissionMatrix() {
  const { data } = useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: () =>
      api.get<DataResponse<{ roles: Role[]; permissions: { permission: string; roles: Role[] }[] }>>('/settings/permissions').then((r) => r.data),
  });
  if (!data) return null;
  return (
    <Card>
      <CardHeader
        title="Role-based access control"
        description="The live permission policy enforced by the API. Record-level scoping (own department, own courses, own records) is applied on top."
      />
      <Table>
        <THead>
          <tr>
            <Th>Permission</Th>
            {data.roles.map((r) => (
              <Th key={r} className="text-center">
                {ROLE_LABELS[r]}
              </Th>
            ))}
          </tr>
        </THead>
        <TBody>
          {data.permissions.map((p) => (
            <Tr key={p.permission}>
              <Td className="font-mono text-xs">{p.permission}</Td>
              {data.roles.map((r) => (
                <Td key={r} className="text-center">
                  {p.roles.includes(r) ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" /> : <span className="text-slate-300" aria-label="Denied">—</span>}
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
