export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}
