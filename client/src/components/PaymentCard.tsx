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
  const copyAddress = () => navigator.clipboard.writeText(address);
  const balanceSufficient =
    balance !== "loading" && balance >= gameCostLamports;

  return (
    <div className="card h-100 mb-0">
      <div className="card-header">
        <h3 className="card-header-title">
          {balanceSufficient ? "Press Play to Start" : "Transfer SOL to Play"}
        </h3>
        <span className="btn btn-sm btn-primary ml-4" onClick={copyAddress}>
          <span className="fe fe-clipboard mr-2"></span>
          Address
        </span>
      </div>
      <div className="card-body d-flex justify-content-center align-items-center">
        <QRCode
          value={`solana:${address}?amount=${gameCostSol}`}
          includeMargin
          bgColor="#000"
          fgColor="#FFF"
          renderAs="svg"
          className="qr-code w-100 h-100"
        />
      </div>
      <div className="card-footer">
        <Footer />
      </div>
    </div>
  );
}

function Footer() {
  const balance = useBalance();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const refreshAccounts = useRefreshAccounts();

  if (balance === "loading") {
    return (
      <div className="d-flex flex-column align-items-center">
        <div className="d-flex align-items-center">
          <span className="spinner-grow spinner-grow-sm mr-2"></span>
          <h3 className="mb-0">Loading balance...</h3>
        </div>
      </div>
    );
  }

  const sufficient = balance >= gameCostLamports;
  return (
    <>
      <div className="row mb-3 d-flex align-items-center">
        <div className="col font-weight-bold">One Play:</div>
        <div className="col-auto">
          <span className="badge badge-dark">
            <h4 className="mb-0">{lamportsToSolString(gameCostLamports)}</h4>
          </span>
        </div>
      </div>

      <div className="row d-flex align-items-center">
        <div className="col font-weight-bold">Wallet Balance:</div>
        <div className="col-auto">
          <span className="badge badge-dark">
            <h4 className="mb-0">{lamportsToSolString(balance)}</h4>
          </span>
        </div>
      </div>

      {sufficient && (
        <span
          className="btn btn-pink mt-4 w-100 text-uppercase"
          onClick={refreshAccounts}
        >
          Play
        </span>
      )}
    </>
  );
}
