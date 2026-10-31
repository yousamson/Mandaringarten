/** Bound a request's lifetime while preserving query cancellation. */
export async function withAbortTimeout<T>(
  parentSignal: AbortSignal,
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal.reason);

  if (parentSignal.aborted) abortFromParent();
  else parentSignal.addEventListener('abort', abortFromParent, { once: true });

  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Account access check timed out.', 'TimeoutError'));
  }, timeoutMs);

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timeout);
    parentSignal.removeEventListener('abort', abortFromParent);
  }
}
