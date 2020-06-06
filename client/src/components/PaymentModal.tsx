import React from "react";
import QRCode from "qrcode.react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConfig } from "providers/api";
import { usePaymentAccount } from "providers/payment";

export function lamportsToSolString(
  lamports: number,
  maximumFractionDigits: number = 9
): string {
  const sol = Math.abs(lamports) / LAMPORTS_PER_SOL;
  return (
    "◎" + new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(sol)
  );
}

export function PaymentModal({ show }: { show: boolean }) {
  const gameCostLamports = useConfig()?.gameCost || 0;
  const gameCostSol = gameCostLamports / LAMPORTS_PER_SOL;
  const paymentAccount = usePaymentAccount();
  const renderContent = () => {
    if (!show || !paymentAccount) return null;
    const address = paymentAccount.publicKey.toBase58();
    return (
      <div className="modal-dialog modal-dialog-centered lift justify-content-center">
        <div className="modal-content w-auto">
          <div className="modal-card card">
            <div className="card-header">
              <h3 className="card-header-title">Transfer SOL to play</h3>
              <span className="badge badge-soft-primary">
                <h4 className="mb-0">
                  {lamportsToSolString(gameCostLamports)}
                </h4>
              </span>
            </div>
            <div className="card-body d-flex justify-content-center">
              <QRCode
                value={`solana:${address}?amount=${gameCostSol}`}
                includeMargin
                bgColor="#000"
                fgColor="#FFF"
                renderAs="svg"
                className="w-100 h-100"
              />
            </div>
            <div className="card-footer">
              <span className="badge badge-soft-white">
                <span>{address}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`modal fade${show ? " show" : ""}`}>{renderContent()}</div>
  );
}
