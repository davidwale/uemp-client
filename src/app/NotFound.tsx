import { Link } from 'react-router';
import { Button } from '@/components/ui';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you’re looking for doesn’t exist or you don’t have access to it.</p>
      <Link to="/" className="mt-6">
        <Button>Go to my dashboard</Button>
      </Link>
    </div>
  );
}
