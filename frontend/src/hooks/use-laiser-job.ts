import { useEffect, useState } from 'react';
import { pollWithBackoff } from '@/utils/polling';
import { fetchLaiserResult, isLaiserTerminalStatus, LaiserResultResponse } from '@/utils/laiser';

export function useLaiserJob(jobId?: string) {
  const [status, setStatus] = useState<LaiserResultResponse['status'] | null>(null);
  const [result, setResult] = useState<LaiserResultResponse['result'] | null>(null);
  const [response, setResponse] = useState<LaiserResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    (async () => {
      try {
        const finalResponse = await pollWithBackoff<LaiserResultResponse>(
          () => fetchLaiserResult(jobId),
          (res) => isLaiserTerminalStatus(res.status)
        );

        if (cancelled) return;

        setResponse(finalResponse);
        setStatus(finalResponse.status);
        const normalized = String(finalResponse.status ?? '').trim().toUpperCase();
        if (normalized === 'SUCCEEDED' || normalized === 'SUCCESS') {
          setResult(finalResponse.result ?? null);
        } else if (normalized === 'FAILED') {
          setError('LAiSER job failed');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Error while polling LAiSER');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return { status, result, response, error };
}

