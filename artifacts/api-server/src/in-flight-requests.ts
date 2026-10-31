/** Share concurrent reads only; never cache completed entitlement responses. */
export function createReadDeduplicator() {
  const pending = new Map<string, Promise<unknown>>();
  return function read<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const existing = pending.get(key);
    if (existing) return existing as Promise<T>;
    const promise = Promise.resolve().then(operation).finally(() => {
      pending.delete(key);
    });
    pending.set(key, promise);
    return promise;
  };
}

/** Cache short-lived Stripe configuration/identity reads, never membership results. */
export function createReadCache<T>(
  ttlMs: number,
  shouldCache: (value: T) => boolean = () => true,
) {
  const pending = new Map<string, Promise<T>>();
  const cached = new Map<string, { value: T; expiresAt: number }>();

  return function read(key: string, operation: () => Promise<T>): Promise<T> {
    const entry = cached.get(key);
    if (entry && entry.expiresAt > Date.now()) return Promise.resolve(entry.value);
    if (entry) cached.delete(key);

    const existing = pending.get(key);
    if (existing) return existing;

    const promise = Promise.resolve().then(operation).then((value) => {
      if (shouldCache(value)) {
        cached.set(key, { value, expiresAt: Date.now() + ttlMs });
        if (cached.size > 1000) {
          const oldest = cached.keys().next().value;
          if (oldest !== undefined) cached.delete(oldest);
        }
      }
      return value;
    }).finally(() => {
      pending.delete(key);
    });
    pending.set(key, promise);
    return promise;
  };
}
