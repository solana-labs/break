import { Account } from "@solana/web3.js";
import Bugsnag from "@bugsnag/js";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function reportError(err: Error, context: string) {
  console.error(context, err);
  Bugsnag.notify(err, (e) => {
    e.context = context;
  });
}

function isIP() {
  const hostname = window.location.hostname;
  const r = RegExp(
    "^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])"
  );
  return r.test(hostname);
}

function isLocalHost() {
  const hostname = window.location.hostname;
  switch (hostname) {
    case "localhost":
    case "127.0.0.1":
    case "0.0.0.0":
      return true;
    default:
      return false;
  }
}

export function enableCustomCluster() {
  return isLocalHost() || isIP();
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
