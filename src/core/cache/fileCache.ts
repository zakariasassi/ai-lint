import fs from "node:fs/promises";
import path from "node:path";

type CacheEntry = {
  value: unknown;
  ts: number;
};

export class FileCache {
  private store = new Map<string, CacheEntry>();
  private dirty = false;

  constructor(
    private readonly cachePath: string,
    private readonly ttlHours: number,
    private readonly enabled: boolean,
  ) {}

  async load(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const raw = await fs.readFile(this.cachePath, "utf8");
      const parsed = JSON.parse(raw) as Record<string, CacheEntry>;

      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value.ts === "number") {
          this.store.set(key, value);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  get<T>(key: string): T | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    const ttlMs = this.ttlHours * 60 * 60 * 1000;
    if (Date.now() - entry.ts > ttlMs) {
      this.store.delete(key);
      this.dirty = true;
      return undefined;
    }

    return entry.value as T;
  }

  set(key: string, value: unknown): void {
    if (!this.enabled) {
      return;
    }

    this.store.set(key, {
      value,
      ts: Date.now(),
    });
    this.dirty = true;
  }

  async save(): Promise<void> {
    if (!this.enabled || !this.dirty) {
      return;
    }

    await fs.mkdir(path.dirname(this.cachePath), { recursive: true });

    const payload: Record<string, CacheEntry> = {};
    for (const [key, value] of this.store.entries()) {
      payload[key] = value;
    }

    await fs.writeFile(this.cachePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    this.dirty = false;
  }
}
