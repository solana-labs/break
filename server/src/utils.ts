import { TransactionSignature, Connection } from "@solana/web3.js";

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

export async function confirmTransaction(
  connection: Connection,
  signature: TransactionSignature
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    const id = connection.onSignature(
      signature,
      (result) => {
        if (timeout) clearTimeout(timeout);
        if (result.err) {
          reject("failed");
        } else {
          resolve();
        }
      },
      "singleGossip"
    );
    timeout = setTimeout(() => {
      connection.removeSignatureListener(id);
      reject("timeout");
    }, 10000);
  });
}
