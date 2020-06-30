import React from "react";
import QRCode from "qrcode.react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConfig, useRefreshAccounts } from "providers/api";
import { PAYMENT_ACCOUNT } from "utils";
import { useBalance } from "providers/payment";

export function lamportsToSolString(
  lamports: number,
  maximumFractionDigits: number = 9
): string {
  const sol = Math.abs(lamports) / LAMPORTS_PER_SOL;
  return (
    "◎" + new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(sol)
  );
}

export function PaymentCard() {
  const balance = useBalance();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const gameCostSol = gameCostLamports / LAMPORTS_PER_SOL;
  const address = PAYMENT_ACCOUNT.publicKey.toBase58();
  const balanceSufficient =
    balance !== "loading" && balance >= gameCostLamports;
  let trustWalletDeepLink = `https://link.trustwallet.com/send?coin=501&address=${address}`;

  // Only the iOS TW handles amount correctly at the moment
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
    trustWalletDeepLink += "&amount=" + gameCostSol;
  }

  return (
    <div className="card mb-0">
      <div className="card-header">
        <h3 className="card-header-title">
          {balance === "loading"
            ? "Loading"
            : balanceSufficient
            ? "Press Play to Start"
            : "Transfer SOL to Play"}
        </h3>
        <a
          className="btn btn-sm btn-info"
          href={trustWalletDeepLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Use Trust Wallet
        </a>
      </div>
      <div className="card-body d-flex justify-content-center align-items-center">
        <QRCode
          value={`solana:${address}?amount=${gameCostSol}`}
          includeMargin
          bgColor="#000"
          fgColor="#FFF"
          renderAs="svg"
          className="qr-code"
        />
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  const balance = useBalance();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const refreshAccounts = useRefreshAccounts();
  const address = PAYMENT_ACCOUNT.publicKey.toBase58();
  const [copied, setCopied] = React.useState(false);
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
  };

  React.useEffect(() => {
    if (!copied) return;
    const timeoutId = setTimeout(() => {
      setCopied(false);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [copied]);

  const sufficient = balance >= gameCostLamports;
  return (
    <>
      <div className="card-footer">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="font-weight-bold">Wallet Address</div>
          <span className="btn btn-sm btn-primary" onClick={copyAddress}>
            <span className="fe fe-clipboard mr-2"></span>
            {copied ? "Copied" : "Copy"}
          </span>
        </div>

        <div className="d-flex mb-4 pb-4 border-bottom">
          <span className="badge badge-dark overflow-hidden">
            <h4 className="mb-0 overflow-hidden text-ellipsis">{address}</h4>
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="font-weight-bold">Wallet Balance</div>
          <span className="badge badge-dark">
            <h4 className="mb-0">
              {balance === "loading" ? balance : lamportsToSolString(balance)}
            </h4>
          </span>
        </div>

        <div className="row d-flex align-items-center">
          <div className="col font-weight-bold">One Play</div>
          <div className="col-auto">
            <span className="badge badge-dark">
              <h4 className="mb-0">{lamportsToSolString(gameCostLamports)}</h4>
            </span>
          </div>
        </div>
      </div>

      {sufficient && (
        <div className="card-footer">
          <span
            className="btn btn-pink w-100 text-uppercase"
            onClick={refreshAccounts}
          >
            Play
          </span>
        </div>
      )}
    </>
  );
}
