import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui';
import { useBasePath } from '@/hooks/useAuth';
import { ResultSheet } from '../shared/ResultSheet';

export function SheetReviewPage() {
  const { sheetId = '' } = useParams();
  const base = useBasePath();
  return (
    <ResultSheet
      target={{ sheetId }}
      backLink={
        <Link to={`${base}/results`}>
          <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
            All results
          </Button>
        </Link>
      }
    />
  );
}
