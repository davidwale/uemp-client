import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui';
import { ResultSheet } from '@/features/shared/ResultSheet';

export function CourseResultsPage() {
  const { courseId = '', semesterId = '' } = useParams();
  return (
    <ResultSheet
      target={{ courseId, semesterId }}
      backLink={
        <Link to="/lecturer/courses">
          <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
            My courses
          </Button>
        </Link>
      }
    />
  );
}
