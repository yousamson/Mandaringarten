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
