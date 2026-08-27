import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";

export function useDashboardStats<T>(orgId: string) {
  const [stats, setStats] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(
    async (isManualRefetch = false) => {
      if (!orgId) return;

      await Promise.resolve();

      if (isManualRefetch) setLoading(true);
      setError(null);

      try {
        const data = await api.org.dashboard(orgId);
        setStats(data.stats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
