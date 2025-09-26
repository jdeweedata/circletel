'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Retry failed requests when back online
          retry: (failureCount, error: any) => {
            // Don't retry if offline
            if (!navigator.onLine) return false;
            // Retry up to 3 times for network errors
            return failureCount < 3;
          },
          // Cache for 5 minutes by default
          staleTime: 5 * 60 * 1000,
          // Keep data in cache for 10 minutes
          gcTime: 10 * 60 * 1000,
        },
        mutations: {
          // Retry mutations when back online
          retry: (failureCount, error: any) => {
            if (!navigator.onLine) return false;
            return failureCount < 2;
          },
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}