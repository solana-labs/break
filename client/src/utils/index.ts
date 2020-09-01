import { Account } from "@solana/web3.js";
import * as Sentry from "@sentry/react";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function reportError(err: Error, context: string) {
  console.error(context, err);
  Sentry.captureException(err, {
    tags: { context },
  });
}

export function isLocalHost() {
  return window.location.hostname === "localhost";
}

export const PAYMENT_ACCOUNT = (() => {
  const paymentKey = window.localStorage.getItem("paymentKey");
  if (paymentKey) {
    return new Account(Buffer.from(paymentKey, "base64"));
  } else {
    const paymentAccount = new Account();
    window.localStorage.setItem(
      "paymentKey",
      Buffer.from(paymentAccount.secretKey).toString("base64")
    );
    return paymentAccount;
  }
})();
