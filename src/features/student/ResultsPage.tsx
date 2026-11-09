import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Printer } from 'lucide-react';
import { Button, Card, Detail, EmptyState, ErrorState, GradeBadge, PageHeader, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { GradeKey } from '@/features/shared/GradeKey';
import { api, type DataResponse } from '@/lib/api';
import { formatDate, formatNumber, levelLabel } from '@/lib/utils';
import type { StudentResults } from '@/types/api';
import { DocumentHeader } from './DocumentHeader';

export function ResultsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', 'me'],
    queryFn: () => api.get<DataResponse<StudentResults>>('/results/me').then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title="Academic results"
        description="Only results approved by your department are shown."
        actions={
          <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()} disabled={!data?.semesters.length}>
            Print statement
          </Button>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Card className="print-area p-6 sm:p-8">
          <DocumentHeader title="Statement of Result" />
          <dl className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Name" value={data.student.fullName} />
            <Detail label="Matric number" value={data.student.matricNumber} />
            <Detail label="Programme" value={data.student.program} />
            <Detail label="Current level" value={levelLabel(data.student.level)} />
          </dl>

          {data.semesters.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No approved results yet" description="Results appear here once your department approves them." />
          ) : (
            <>
              <div className="mb-8 grid gap-4 rounded-xl bg-brand-50 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Cumulative GPA</p>
                  <p className="text-3xl font-semibold text-brand-900">{formatNumber(data.cgpa)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Units completed</p>
                  <p className="text-3xl font-semibold text-brand-900">{data.totalUnits}</p>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">Class of degree (to date)</p>
                  <p className="text-lg font-semibold text-brand-900">{data.classOfDegree}</p>
                </div>
              </div>

              <div className="space-y-8">
                {data.semesters.map((s) => (
                  <section key={s.semester.id} className="break-inside-avoid">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{s.semester.label}</h3>
                      <p className="text-sm text-slate-600">
                        GPA <strong className="text-slate-900">{formatNumber(s.gpa)}</strong> · CGPA{' '}
                        <strong className="text-slate-900">{formatNumber(s.cgpa)}</strong>
                      </p>
                    </div>
                    <Table className="border border-slate-200">
                      <THead>
                        <tr>
                          <Th>Code</Th>
                          <Th>Title</Th>
                          <Th className="text-right">Units</Th>
                          <Th className="text-right">CA</Th>
                          <Th className="text-right">Exam</Th>
                          <Th className="text-right">Total</Th>
                          <Th className="text-center">Grade</Th>
                          <Th className="text-right">Points</Th>
                        </tr>
                      </THead>
                      <TBody>
                        {s.courses.map((c) => (
                          <Tr key={c.code}>
                            <Td className="font-medium">{c.code}</Td>
                            <Td>{c.title}</Td>
                            <Td className="text-right">{c.units}</Td>
                            <Td className="text-right">{c.caScore}</Td>
                            <Td className="text-right">{c.examScore}</Td>
                            <Td className="text-right font-medium">{c.totalScore}</Td>
                            <Td className="text-center">
                              <GradeBadge grade={c.grade} />
                            </Td>
                            <Td className="text-right">{c.units * c.gradePoint}</Td>
                          </Tr>
                        ))}
                        <tr className="bg-slate-50 text-sm font-medium">
                          <Td colSpan={2} className="text-right">
                            Semester totals
                          </Td>
                          <Td className="text-right">{s.totalUnits}</Td>
                          <Td colSpan={4} />
                          <Td className="text-right">{s.totalGradePoints}</Td>
                        </tr>
                      </TBody>
                    </Table>
                  </section>
                ))}
              </div>
            </>
          )}
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
            <GradeKey />
            <p className="text-xs text-slate-500">Generated {formatDate(new Date(), true)}</p>
          </div>
        </Card>
      )}
    </>
  );
}
