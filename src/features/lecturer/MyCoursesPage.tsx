import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, EmptyState, ErrorState, PageHeader, ResultStatusBadge, Spinner, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { SemesterSelect } from '@/features/shared/SemesterSelect';
import { levelLabel } from '@/lib/utils';
import type { TeachingCourse } from '@/types/api';
import { useTeachingLoad } from './useTeaching';

export function CourseList({ courses, semesterId }: { courses: TeachingCourse[]; semesterId: string }) {
  const navigate = useNavigate();
  return (
    <Table>
      <THead>
        <tr>
          <Th>Course</Th>
          <Th>Level</Th>
          <Th className="text-right">Units</Th>
          <Th className="text-right">Students</Th>
          <Th>Results</Th>
          <Th>
            <span className="sr-only">Open</span>
          </Th>
        </tr>
      </THead>
      <TBody>
        {courses.map((c) => (
          <Tr key={c.allocationId} className="cursor-pointer" onClick={() => navigate(`/lecturer/courses/${c.course.id}/${semesterId}`)}>
            <Td>
              <Link to={`/lecturer/courses/${c.course.id}/${semesterId}`} className="font-medium text-brand-800 hover:underline" onClick={(e) => e.stopPropagation()}>
                {c.course.code}
              </Link>
              <p className="text-xs text-slate-500">{c.course.title}</p>
            </Td>
            <Td>{levelLabel(c.course.level)}</Td>
            <Td className="text-right">{c.course.units}</Td>
            <Td className="text-right">{c.registeredStudents}</Td>
            <Td>
              <ResultStatusBadge status={c.resultStatus} />
            </Td>
            <Td className="text-right">
              <Link
                to={`/lecturer/courses/${c.course.id}/${semesterId}`}
                className="inline-flex items-center text-sm font-medium text-brand-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {['NOT_STARTED', 'DRAFT', 'REJECTED'].includes(c.resultStatus) ? 'Enter results' : 'View'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}

export function MyCoursesPage() {
  const [semesterId, setSemesterId] = useState('');
  const { data, isLoading, error, refetch } = useTeachingLoad(semesterId);

  return (
    <>
      <PageHeader
        title="My courses"
        description="Courses allocated to you, with class lists and result status."
        actions={<SemesterSelect value={semesterId} onChange={setSemesterId} label="" className="w-64" />}
      />
      <Card>
        {isLoading ? (
          <Spinner />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.courses.length === 0 ? (
          <EmptyState title="No courses allocated" description={`You have no courses for ${data.semester.label}.`} />
        ) : (
          <CourseList courses={data.courses} semesterId={data.semester.id} />
        )}
      </Card>
    </>
  );
}
