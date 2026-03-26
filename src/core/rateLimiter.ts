import { sleep } from "./utils/retry";

export class RateLimiter {
  private nextAllowedTs = Date.now();
  private readonly minIntervalMs: number;

  constructor(requestsPerMinute: number) {
    this.minIntervalMs = requestsPerMinute > 0 ? Math.ceil(60_000 / requestsPerMinute) : 0;
  }

  async schedule<T>(task: () => Promise<T>): Promise<T> {
    if (this.minIntervalMs === 0) {
      return task();
    }

    const now = Date.now();
    const waitMs = Math.max(0, this.nextAllowedTs - now);

    this.nextAllowedTs = Math.max(this.nextAllowedTs, now) + this.minIntervalMs;

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    return task();
  }
}
