export type PollFn<T> = () => Promise<T>;
export type ShouldStopFn<T> = (result: T) => boolean;

export interface PollOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
  jitterMs?: number;
}

export async function pollWithBackoff<T>(
  pollFn: PollFn<T>,
  shouldStop: ShouldStopFn<T>,
  {
    maxAttempts = 15,
    initialDelayMs = 3000,
    backoffFactor = 2,
    maxDelayMs = 60000,
    jitterMs = 1000,
  }: PollOptions = {}
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    const result = await pollFn();

    if (shouldStop(result)) {
      return result;
    }

    if (attempt >= maxAttempts) {
      throw new Error('Polling timed out');
    }

    const jitter = Math.floor(Math.random() * jitterMs);
    const effectiveDelay = Math.min(delay, maxDelayMs) + jitter;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, effectiveDelay));
    delay = Math.min(delay * backoffFactor, maxDelayMs);
  }
}

