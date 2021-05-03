import { Account } from "@solana/web3.js";
// import * as Sentry from "@sentry/react";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function reportError(err: Error, context: string) {
  console.error(context, err);
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

export const getLocalStorageKeypair = (key: string): Account => {
  const base64Keypair = window.localStorage.getItem(key);
  if (base64Keypair) {
    return new Account(Buffer.from(base64Keypair, "base64"));
  } else {
    const account = new Account();
    window.localStorage.setItem(
      key,
      Buffer.from(account.secretKey).toString("base64")
    );
    return account;
  }
};

const SPLIT = ((): number => {
  const split = parseInt(
    new URLSearchParams(window.location.search).get("split") || ""
  );
  if (!isNaN(split)) {
    return Math.min(split, 12);
  }
  return 4;
})();

export const FEE_PAYERS = (() => {
  const accounts = [];
  for (let i = 0; i < SPLIT; i++) {
    accounts.push(getLocalStorageKeypair(`feePayerKey${i + 1}`));
  }
  return accounts;
})();
