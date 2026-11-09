import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Detail, EmptyState, ErrorState, PageHeader, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { SemesterSelect } from '@/features/shared/SemesterSelect';
import { api, type DataResponse } from '@/lib/api';
import { formatDate, levelLabel } from '@/lib/utils';
import type { RegistrationSlip } from '@/types/api';
import { DocumentHeader } from './DocumentHeader';

export function RegistrationSlipPage() {
  const [semesterId, setSemesterId] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['registrations', 'mine', semesterId],
    queryFn: () => api.get<DataResponse<RegistrationSlip>>('/registrations/mine', { semesterId }).then((r) => r.data),
  });

  return (
    <>
      <PageHeader
        title="Course registration slip"
        description="Print or save as PDF for your records."
        actions={
          <>
            <SemesterSelect value={semesterId} onChange={setSemesterId} label="" className="w-64" />
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()} disabled={!data?.registrations.length}>
              Print / Save PDF
            </Button>
          </>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <Card className="print-area p-6 sm:p-8">
          <DocumentHeader title="Course Registration Slip" subtitle={data.semester.label} />
          <dl className="my-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail label="Name" value={data.student.fullName} />
            <Detail label="Matric number" value={data.student.matricNumber} />
            <Detail label="Level" value={levelLabel(data.student.level)} />
            <Detail label="Programme" value={data.student.program} />
            <Detail label="Department" value={data.student.department} />
            <Detail label="Email" value={data.student.email} />
          </dl>
          {data.registrations.length === 0 ? (
            <EmptyState title="No registered courses for this semester" />
          ) : (
            <Table className="border border-slate-200">
              <THead>
                <tr>
                  <Th>S/N</Th>
                  <Th>Course code</Th>
                  <Th>Course title</Th>
                  <Th>Dept</Th>
                  <Th className="text-right">Units</Th>
                </tr>
              </THead>
              <TBody>
                {data.registrations.map((r, i) => (
                  <Tr key={r.id}>
                    <Td>{i + 1}</Td>
                    <Td className="font-medium">{r.course.code}</Td>
                    <Td>{r.course.title}</Td>
                    <Td>{r.course.department}</Td>
                    <Td className="text-right">{r.course.units}</Td>
                  </Tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <Td colSpan={4} className="text-right">
                    Total units
                  </Td>
                  <Td className="text-right">{data.totalUnits}</Td>
                </tr>
              </TBody>
            </Table>
          )}
          <p className="mt-6 text-xs text-slate-500">Generated {formatDate(new Date(), true)}</p>
        </Card>
      )}
    </>
  );
}
