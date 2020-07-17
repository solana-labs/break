export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export async function endlessRetry<T>(
  name: string,
  call: () => Promise<T>
): Promise<T> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(name, "fetching");
      return await call();
    } catch (err) {
      console.error(name, "request failed, retrying", err);
      await sleep(1000);
    }
  }
}
