import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from './api';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

/**
 * A 401 anywhere means the server-side session is gone (expired, revoked or
 * the account was suspended). Clearing the cached user sends the person back
 * to the login screen via the route guard.
 */
function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && queryClient.getQueryData(ME_QUERY_KEY)) {
    queryClient.setQueryData(ME_QUERY_KEY, null);
    toast.error('Your session has ended. Please sign in again.');
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});
