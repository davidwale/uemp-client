import { AlertTriangle, BookOpen, CheckCircle2, Clock, Users } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, StatCard } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useAuth';
import { CourseList } from './MyCoursesPage';
import { useTeachingLoad } from './useTeaching';

export function LecturerDashboard() {
  const user = useCurrentUser();
  const { data, isLoading, error, refetch } = useTeachingLoad();

  const courses = data?.courses ?? [];
  const count = (s: string) => courses.filter((c) => c.resultStatus === s).length;
  const rejected = courses.filter((c) => c.resultStatus === 'REJECTED');

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.lecturerProfile?.title ?? ''} ${user.lastName}`.trim()}
        description={`${user.department?.name ?? ''} · ${data?.semester.label ?? ''}`}
      />
      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          {rejected.map((c) => (
            <Alert key={c.allocationId} tone="danger" title={`${c.course.code} results were returned for correction`}>
              {c.reviewComment}{' '}
              <Link to={`/lecturer/courses/${c.course.id}/${data.semester.id}`} className="font-medium underline">
                Open score sheet
              </Link>
            </Alert>
          ))}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Assigned courses" value={courses.length} icon={BookOpen} />
            <StatCard label="Registered students" value={courses.reduce((s, c) => s + c.registeredStudents, 0)} icon={Users} tone="sky" />
            <StatCard label="Awaiting department approval" value={count('SUBMITTED')} icon={Clock} tone="amber" />
            <StatCard label="Approved" value={count('APPROVED')} icon={CheckCircle2} tone="emerald" />
          </div>
          <Card>
            <CardHeader title="My courses this semester" description="Select a course to view the class list and enter results." />
            {courses.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="No courses assigned" description="Your department has not allocated any courses to you this semester." />
            ) : (
              <CourseList courses={courses} semesterId={data.semester.id} />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
