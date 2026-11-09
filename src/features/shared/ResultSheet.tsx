import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Printer, RotateCcw, Save, Send, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  GradeBadge,
  PageHeader,
  ResultStatusBadge,
  Spinner,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui';
import { api, type DataResponse } from '@/lib/api';
import { actionLabel, cn, errorMessage, formatDate, formatNumber } from '@/lib/utils';
import type { GradeBand, HistoryItem, SheetView } from '@/types/api';
import { useAcademicSettings } from './queries';

type Target = { courseId: string; semesterId: string } | { sheetId: string };

const sheetPath = (t: Target) =>
  'sheetId' in t ? `/results/sheets/${t.sheetId}` : `/results/courses/${t.courseId}/semesters/${t.semesterId}`;

interface DraftRow {
  ca: string;
  exam: string;
}

/** Parses a score input. Empty → null; invalid → NaN (flagged in the UI). */
const parseScore = (raw: string): number | null => (raw.trim() === '' ? null : Number(raw));

function preview(ca: number | null, exam: number | null, scale: GradeBand[]) {
  if (ca === null || exam === null || Number.isNaN(ca) || Number.isNaN(exam)) return null;
  const total = Math.round((ca + exam) * 100) / 100;
  const band = [...scale].sort((a, b) => b.minScore - a.minScore).find((b) => total >= b.minScore);
  return { total, grade: band?.grade ?? null };
}

/**
 * One screen for the whole result lifecycle:
 *  - Lecturer: enter CA/exam scores, save drafts, submit for approval, see feedback
 *  - Department Admin: review submitted results, approve or reject with feedback
 *  - Super Admin / Department Admin: reopen approved results (authorised correction)
 * What each person can do is decided by the server and returned as `capabilities`.
 */
export function ResultSheet({ target, backLink }: { target: Target; backLink?: React.ReactNode }) {
  const qc = useQueryClient();
  const path = sheetPath(target);
  const { data: settings } = useAcademicSettings();
  const scale = settings?.gradeScale ?? [];
  const caMax = settings?.caMaxScore ?? 30;
  const examMax = settings?.examMaxScore ?? 70;

  const { data: sheet, isLoading, error, refetch } = useQuery({
    queryKey: ['result-sheet', path],
    queryFn: () => api.get<DataResponse<SheetView>>(path).then((r) => r.data),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['result-sheet', 'history', sheet?.sheetId],
    queryFn: () => api.get<DataResponse<HistoryItem[]>>(`/results/sheets/${sheet!.sheetId}/history`).then((r) => r.data),
    enabled: !!sheet?.sheetId,
  });

  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [dialog, setDialog] = useState<null | 'submit' | 'approve' | 'reject' | 'reopen'>(null);

  // Reset local edits whenever fresh server data arrives.
  useEffect(() => {
    if (!sheet) return;
    setDrafts(
      Object.fromEntries(
        sheet.rows.map((r) => [r.registrationId, { ca: r.caScore?.toString() ?? '', exam: r.examScore?.toString() ?? '' }]),
      ),
    );
  }, [sheet]);

  const dirtyRows = useMemo(() => {
    if (!sheet) return [];
    return sheet.rows.filter((r) => {
      const d = drafts[r.registrationId];
      return d && (parseScore(d.ca) !== r.caScore || parseScore(d.exam) !== r.examScore);
    });
  }, [sheet, drafts]);

  const invalidRows = useMemo(
    () =>
      Object.entries(drafts).filter(([, d]) => {
        const ca = parseScore(d.ca);
        const exam = parseScore(d.exam);
        return (ca !== null && (Number.isNaN(ca) || ca < 0 || ca > caMax)) || (exam !== null && (Number.isNaN(exam) || exam < 0 || exam > examMax));
      }).length,
    [drafts, caMax, examMax],
  );

  // Warn before leaving with unsaved scores.
  useEffect(() => {
    if (!dirtyRows.length) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirtyRows.length]);

  const onSuccess = (message: string) => (res: DataResponse<SheetView>) => {
    qc.setQueryData(['result-sheet', path], res.data);
    qc.invalidateQueries({ queryKey: ['result-sheet', 'history'] });
    qc.invalidateQueries({ queryKey: ['results'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setDialog(null);
    toast.success(message);
  };
  const onError = (err: unknown) => toast.error(errorMessage(err));

  const entryPath = sheet ? `/results/courses/${sheet.course.id}/semesters/${sheet.semester.id}` : '';

  const save = useMutation({
    mutationFn: () =>
      api.put<DataResponse<SheetView>>(`${entryPath}/entries`, {
        entries: dirtyRows.map((r) => ({
          registrationId: r.registrationId,
          caScore: parseScore(drafts[r.registrationId]!.ca),
          examScore: parseScore(drafts[r.registrationId]!.exam),
        })),
      }),
    onSuccess: onSuccess('Draft saved'),
    onError,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (dirtyRows.length) await save.mutateAsync();
      return api.post<DataResponse<SheetView>>(`${entryPath}/submit`);
    },
    onSuccess: onSuccess('Results submitted for departmental approval'),
    onError,
  });

  const review = useMutation({
    mutationFn: ({ action, note }: { action: 'approve' | 'reject' | 'reopen'; note: string }) =>
      api.post<DataResponse<SheetView>>(
        `/results/sheets/${sheet!.sheetId}/${action}`,
        action === 'approve' ? { comment: note || undefined } : action === 'reject' ? { comment: note } : { reason: note },
      ),
    onSuccess: (res, vars) =>
      onSuccess(
        { approve: 'Results approved — now visible to students', reject: 'Results returned to the lecturer', reopen: 'Results reopened for correction' }[
          vars.action
        ],
      )(res),
    onError,
  });

  if (isLoading) return <Spinner />;
  if (error || !sheet) return <ErrorState error={error} onRetry={refetch} />;

  const { capabilities: can, summary } = sheet;
  const editable = can.canEdit;
  const missing = sheet.rows.filter((r) => {
    const d = drafts[r.registrationId];
    return !d || parseScore(d.ca) === null || parseScore(d.exam) === null;
  }).length;

  return (
    <>
      <PageHeader
        title={`${sheet.course.code} — ${sheet.course.title}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {sheet.semester.label} · {sheet.course.units} units · {sheet.lecturer?.fullName ?? 'No lecturer assigned'}
            <ResultStatusBadge status={sheet.status} />
          </span>
        }
        actions={
          <>
            {backLink}
            <Button variant="secondary" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              Print
            </Button>
            {can.canReopen && (
              <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setDialog('reopen')}>
                Reopen for correction
              </Button>
            )}
            {can.canReview && (
              <>
                <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => setDialog('reject')}>
                  Return for correction
                </Button>
                <Button variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setDialog('approve')}>
                  Approve results
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="no-print mb-6 space-y-3">
        {sheet.status === 'REJECTED' && sheet.reviewComment && (
          <Alert tone="danger" title="Returned for correction">
            {sheet.reviewComment}
            {sheet.reviewedAt && <span className="block text-xs opacity-75">{formatDate(sheet.reviewedAt, true)}</span>}
          </Alert>
        )}
        {sheet.status === 'SUBMITTED' && (
          <Alert tone="warning" title={can.canReview ? 'Submitted for your approval' : 'Awaiting departmental approval'}>
            Submitted {formatDate(sheet.submittedAt, true)}.{' '}
            {can.canReview
              ? 'Check the scores below, then use Approve results or Return for correction at the top of the page.'
              : 'Scores are locked until the department approves or returns them.'}
          </Alert>
        )}
        {sheet.status === 'APPROVED' && (
          <Alert tone="success" title="Approved and published to students">
            Approved {formatDate(sheet.reviewedAt, true)}
            {sheet.reviewComment ? ` — “${sheet.reviewComment}”` : ''}. Changes now require an authorised reopening.
          </Alert>
        )}
        {!editable && sheet.status === 'DRAFT' && !can.canReview && (
          <Alert tone="info" title="Results in progress">
            The lecturer has not yet submitted these results. Scores become visible for review once submitted.
          </Alert>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="print-area xl:col-span-3">
          <CardHeader
            title="Score sheet"
            description={`${sheet.rows.length} registered student(s) · CA max ${caMax}, Exam max ${examMax}`}
            actions={
              editable && (
                <>
                  <Button
                    variant="secondary"
                    icon={<Save className="h-4 w-4" />}
                    disabled={!dirtyRows.length || invalidRows > 0}
                    loading={save.isPending}
                    onClick={() => save.mutate()}
                  >
                    Save draft{dirtyRows.length ? ` (${dirtyRows.length})` : ''}
                  </Button>
                  <Button
                    icon={<Send className="h-4 w-4" />}
                    disabled={invalidRows > 0 || missing > 0 || sheet.rows.length === 0}
                    onClick={() => setDialog('submit')}
                    title={missing ? `${missing} student(s) still need scores` : undefined}
                  >
                    Submit to department
                  </Button>
                </>
              )
            }
          />
          {sheet.rows.length === 0 ? (
            <EmptyState icon={Users} title="No students registered" description="Students who register for this course will appear here." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th className="w-12">#</Th>
                  <Th>Matric no.</Th>
                  <Th>Student</Th>
                  <Th className="w-28 text-right">CA /{caMax}</Th>
                  <Th className="w-28 text-right">Exam /{examMax}</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-center">Grade</Th>
                </tr>
              </THead>
              <TBody>
                {sheet.rows.map((row, i) => {
                  const d = drafts[row.registrationId] ?? { ca: '', exam: '' };
                  const ca = parseScore(d.ca);
                  const exam = parseScore(d.exam);
                  const caBad = ca !== null && (Number.isNaN(ca) || ca < 0 || ca > caMax);
                  const examBad = exam !== null && (Number.isNaN(exam) || exam < 0 || exam > examMax);
                  const live = editable ? preview(ca, exam, scale) : null;
                  const total = editable ? live?.total : row.totalScore;
                  const grade = editable ? live?.grade : row.grade;
                  const set = (field: keyof DraftRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
                    setDrafts((prev) => ({ ...prev, [row.registrationId]: { ...d, [field]: e.target.value } }));

                  return (
                    <Tr key={row.registrationId}>
                      <Td className="text-slate-400">{i + 1}</Td>
                      <Td className="font-mono text-xs whitespace-nowrap">{row.student.matricNumber}</Td>
                      <Td className="whitespace-nowrap">
                        {row.student.fullName}
                        {row.student.program && <span className="ml-2 text-xs text-slate-400">{row.student.program}</span>}
                      </Td>
                      {editable ? (
                        <>
                          <Td className="text-right">
                            <input
                              inputMode="decimal"
                              value={d.ca}
                              onChange={set('ca')}
                              aria-label={`CA score for ${row.student.matricNumber}`}
                              aria-invalid={caBad}
                              className={cn(
                                'h-9 w-20 rounded-md border px-2 text-right text-sm focus:ring-2 focus:outline-none',
                                caBad ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20',
                              )}
                            />
                          </Td>
                          <Td className="text-right">
                            <input
                              inputMode="decimal"
                              value={d.exam}
                              onChange={set('exam')}
                              aria-label={`Exam score for ${row.student.matricNumber}`}
                              aria-invalid={examBad}
                              className={cn(
                                'h-9 w-20 rounded-md border px-2 text-right text-sm focus:ring-2 focus:outline-none',
                                examBad ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20',
                              )}
                            />
                          </Td>
                        </>
                      ) : (
                        <>
                          <Td className="text-right">{row.caScore ?? '—'}</Td>
                          <Td className="text-right">{row.examScore ?? '—'}</Td>
                        </>
                      )}
                      <Td className="text-right font-medium">{total ?? '—'}</Td>
                      <Td className="text-center">
                        <GradeBadge grade={grade ?? null} />
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
          {editable && invalidRows > 0 && (
            <p className="border-t border-slate-100 px-5 py-3 text-sm text-red-600">
              {invalidRows} row(s) have scores outside the allowed range.
            </p>
          )}
        </Card>

        <div className="no-print space-y-6">
          <Card>
            <CardHeader title="Performance summary" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Graded</dt>
                  <dd className="font-semibold">
                    {summary.graded} / {summary.registered}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Average</dt>
                  <dd className="font-semibold">{formatNumber(summary.average)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Highest</dt>
                  <dd className="font-semibold">{summary.highest ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Lowest</dt>
                  <dd className="font-semibold">{summary.lowest ?? '—'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Pass rate</dt>
                  <dd className="font-semibold">{summary.passRate === null ? '—' : `${summary.passRate}%`}</dd>
                </div>
              </dl>
              {summary.graded > 0 && (
                <div className="mt-4 space-y-1.5">
                  {scale.map((b) => {
                    const count = summary.distribution[b.grade] ?? 0;
                    return (
                      <div key={b.grade} className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-medium">{b.grade}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn('h-full rounded-full', b.gradePoint === 0 ? 'bg-red-400' : 'bg-brand-500')}
                            style={{ width: `${(count / summary.graded) * 100}%` }}
                          />
                        </div>
                        <span className="w-5 text-right text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader title="Audit trail" />
              <CardBody>
                <ol className="relative space-y-4 border-l border-slate-200 pl-4">
                  {history.map((h) => (
                    <li key={h.id} className="text-sm">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" aria-hidden />
                      <p className="font-medium text-slate-800">{actionLabel(h.action)}</p>
                      <p className="text-xs text-slate-500">
                        {h.actor?.fullName ?? 'System'} · {formatDate(h.createdAt, true)}
                      </p>
                      {typeof h.metadata?.comment === 'string' && h.metadata.comment && (
                        <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">“{h.metadata.comment}”</p>
                      )}
                      {typeof h.metadata?.reason === 'string' && (
                        <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">“{h.metadata.reason}”</p>
                      )}
                      {Array.isArray(h.metadata?.changes) && (
                        <Badge tone="neutral" className="mt-1">
                          {(h.metadata.changes as unknown[]).length} score change(s)
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'submit'}
        onClose={() => setDialog(null)}
        onConfirm={() => submit.mutate()}
        loading={submit.isPending}
        title="Submit results to the department for approval?"
        description={`You are submitting results for ${sheet.rows.length} student(s). Once submitted, scores are locked until the department approves or returns them.`}
        confirmLabel="Submit"
      />
      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={(note) => review.mutate({ action: 'approve', note })}
        loading={review.isPending}
        title="Approve these results?"
        description="Approved results are published to students immediately and grades are frozen."
        confirmLabel="Approve"
        tone="success"
        noteLabel="Comment (optional)"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={(note) => review.mutate({ action: 'reject', note })}
        loading={review.isPending}
        title="Return results for correction"
        description="The lecturer will see your feedback and can correct and resubmit."
        confirmLabel="Return to lecturer"
        tone="danger"
        noteLabel="What needs to be corrected?"
        noteRequired
      />
      <ConfirmDialog
        open={dialog === 'reopen'}
        onClose={() => setDialog(null)}
        onConfirm={(note) => review.mutate({ action: 'reopen', note })}
        loading={review.isPending}
        title="Reopen approved results"
        description="Students will stop seeing these results until they are corrected and approved again. This action is audited."
        confirmLabel="Reopen"
        tone="danger"
        noteLabel="Reason for reopening"
        noteRequired
      />
    </>
  );
}
