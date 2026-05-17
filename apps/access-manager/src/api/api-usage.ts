import { useApi } from './client';
import type { ApiUsageSummary } from './types';

export function useApiUsageApi() {
  const api = useApi();
  return {
    summary: (lookback_days = 15) =>
      api<ApiUsageSummary>('/api-usage/aggregation/requests-summary', {
        query: { lookback_days },
      }),
  };
}
