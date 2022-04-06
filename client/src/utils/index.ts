import { Keypair } from "@solana/web3.js";
// import * as Sentry from "@sentry/react";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function reportError(err: unknown, context: string) {
  if (err instanceof Error) {
    console.error(context, err);
  }
  // if (process.env.NODE_ENV === "production") {
  //   const query = new URLSearchParams(window.location.search);
  //   if (query.get("cluster") === "custom") return;
  //   Sentry.captureException(err, {
  //     tags: { context },
  //   });
  // }
}

export function isLocalHost() {
  return window.location.hostname === "localhost";
}

export const getLocalStorageKeypair = (key: string): Keypair => {
  const base64Keypair = window.localStorage.getItem(key);
  if (base64Keypair) {
    return Keypair.fromSecretKey(Buffer.from(base64Keypair, "base64"));
  } else {
    const keypair = new Keypair();
    window.localStorage.setItem(
      key,
      Buffer.from(keypair.secretKey).toString("base64")
    );
    return keypair;
  }
};

export const getFeePayers = (num: number) => {
  const accounts = [];
  for (let i = 0; i < num; i++) {
    accounts.push(getLocalStorageKeypair(`feePayerKey${i + 1}`));
  }
  return accounts;
};
