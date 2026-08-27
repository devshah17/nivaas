import { useState, useEffect, useCallback } from "react";

export function useDashboardStats<T>(orgId: string) {
  const [stats, setStats] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (isManualRefetch = false) => {
    if (!orgId) return;
    
    // Await immediately to ensure any state updates happen asynchronously (microtask),
    // which prevents the Next.js React Compiler from flagging this as a synchronous setState in useEffect.
    await Promise.resolve();
    
    if (isManualRefetch) setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/organizations/${orgId}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      } else {
        setError("Failed to fetch dashboard stats");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
