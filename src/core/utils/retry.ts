export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return work;
  }

  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([work, timeout]);
}

export async function withRetry<T>(
  task: () => Promise<T>,
  attempts: number,
  delayMs: number,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= Math.max(1, attempts); attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error as Error;

      if (attempt < attempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError ?? new Error("Retry failed with unknown error");
}
