import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 0,
    },
    queries: {
      gcTime: 1000 * 60 * 60,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

export { queryClient };
