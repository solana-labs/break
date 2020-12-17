import React from "react";
import QRCode from "qrcode.react";
import {
  Account,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { useConfig, useRefreshAccounts } from "providers/server/http";
import { useBalance } from "providers/rpc/balance";
import { usePayerState } from "providers/wallet";
import { useConnection } from "providers/rpc";
import { useBlockhash } from "providers/rpc/blockhash";

export function lamportsToSolString(
  lamports: number,
  maximumFractionDigits: number = 9
): string {
  const sol = Math.abs(lamports) / LAMPORTS_PER_SOL;
  return (
    "◎" + new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(sol)
  );
}

export function getTrustWalletLink(
  address: string,
  amountSol: number
): string | undefined {
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const android = /Android/i.test(navigator.userAgent);
  if (!iOS && !android) return;

  let trustWalletDeepLink = `https://link.trustwallet.com/send?coin=501&address=${address}`;

  // Only the iOS TW handles amount correctly at the moment
  if (iOS) {
    trustWalletDeepLink += "&amount=" + amountSol;
  }

  return trustWalletDeepLink;
}

export function PaymentCard({ account }: { account: Account }) {
  const balance = useBalance();
  const connection = useConnection();
  const recentBlockhash = useBlockhash();
  const [, setPayer] = usePayerState();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const gameCostSol = gameCostLamports / LAMPORTS_PER_SOL;
  const address = account.publicKey.toBase58();
  const balanceSufficient =
    balance !== "loading" && balance >= gameCostLamports;
  const trustWalletDeepLink = getTrustWalletLink(address, gameCostSol);
  const [copied, setCopied] = React.useState(false);
  const [showQR, setShowQR] = React.useState(!trustWalletDeepLink);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [toPubkey, setToPubkey] = React.useState<PublicKey>();
  const [withdrawMessage, setWithdrawMessage] = React.useState("");

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
  };

  const updateToPubkey = (event: React.FormEvent<HTMLInputElement>) => {
    setWithdrawMessage("");
    try {
      setToPubkey(new PublicKey(event.currentTarget.value));
    } catch (err) {
      setToPubkey(undefined);
    }
  };

  const withdrawEnabled = React.useMemo(() => {
    return (
      connection && recentBlockhash && toPubkey && typeof balance === "number"
    );
  }, [connection, recentBlockhash, toPubkey, balance]);

  const withdrawFunds = React.useCallback(() => {
    if (
      connection &&
      recentBlockhash &&
      toPubkey &&
      typeof balance === "number"
    ) {
      (async () => {
        try {
          await sendAndConfirmTransaction(
            connection,
            new Transaction({ recentBlockhash }).add(
              SystemProgram.transfer({
                fromPubkey: account.publicKey,
                toPubkey,
                lamports: balance - 5000,
              })
            ),
            [account],
            { commitment: "singleGossip", preflightCommitment: "singleGossip" }
          );
          setWithdrawMessage("Withdraw succeeded");
        } catch (err) {
          console.error(err);
          setWithdrawMessage("Withdraw failed");
        }
      })();
    }
  }, [account, balance, connection, recentBlockhash, toPubkey]);

  React.useEffect(() => {
    if (!copied) return;
    const timeoutId = setTimeout(() => {
      setCopied(false);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [copied]);

  return (
    <div className="card mb-0">
      <div className="card-header">
        <h3 className="card-header-title font-weight-bold">Wallet</h3>
        {balance !== "loading" && (
          <span className={`text-${balanceSufficient ? "primary" : "warning"}`}>
            {balanceSufficient
              ? "Press Play to Start"
              : trustWalletDeepLink
              ? "Add Funds to Play"
              : "Transfer SOL to Play"}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="font-weight-bold">Address</div>
          <div>
            <span className="btn btn-sm btn-white" onClick={copyAddress}>
              <span className="fe fe-clipboard mr-2"></span>
              {copied ? "Copied" : "Copy"}
            </span>
          </div>
        </div>

        <div className="d-flex mb-4 pb-4 border-bottom">
          <span className="badge badge-dark overflow-hidden">
            <h4 className="mb-0 text-truncate">{address}</h4>
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="font-weight-bold">QR Code</div>
          <span
            className="btn btn-sm btn-white ml-2"
            onClick={() => setShowQR((qr) => !qr)}
          >
            {showQR ? "Hide" : "Show"}
          </span>
        </div>

        {showQR && (
          <div className="d-flex justify-content-center align-items-center mb-4 pb-4 border-bottom">
            <QRCode
              value={`solana:${address}?amount=${gameCostSol}`}
              includeMargin
              bgColor="#000"
              fgColor="#FFF"
              renderAs="svg"
              className="qr-code"
            />
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="font-weight-bold">Live Balance</div>
          <span className="badge badge-dark">
            <h4 className="mb-0">
              {balance === "loading" ? (
                <span className="spinner-grow spinner-grow-sm mr-2"></span>
              ) : (
                lamportsToSolString(balance)
              )}
            </h4>
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="font-weight-bold">Withdraw Funds</div>
          <span
            className="btn btn-sm btn-white"
            onClick={() => {
              setShowWithdraw((show) => !show);
              setWithdrawMessage("");
            }}
          >
            {showWithdraw ? "Hide" : "Withdraw"}
          </span>
        </div>

        {showWithdraw && (
          <div className="mb-4 pb-4 border-bottom">
            {withdrawMessage && <p>{withdrawMessage}</p>}
            <div className="d-flex align-items-center justify-content-between">
              <input
                type="text"
                className="form-control"
                style={{ flex: 1, maxWidth: "500px" }}
                placeholder="To Address"
                onInput={updateToPubkey}
              />
              <input
                className="btn btn-sm btn-white ml-2"
                type="button"
                value="Withdraw"
                disabled={!withdrawEnabled}
                onClick={() => withdrawFunds()}
              />
            </div>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between">
          <div className="font-weight-bold">Change Wallet</div>
          <span
            className="btn btn-sm btn-white"
            onClick={() => setPayer(undefined)}
          >
            <span className="fe fe-list mr-2"></span>
            List
          </span>
        </div>

        {trustWalletDeepLink && (
          <div className="d-flex align-items-center justify-content-between mt-4 pt-4 border-top">
            <div className="font-weight-bold">Add Funds</div>
            <a
              className="btn btn-sm btn-info"
              href={trustWalletDeepLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="fe fe-external-link mr-2"></span>
              Open Trust Wallet
            </a>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  const balance = useBalance();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const refreshAccounts = useRefreshAccounts();

  const sufficient = balance >= gameCostLamports;
  return (
    <div className="card-footer d-flex flex-column align-items-center">
      <input
        type="button"
        value="Play"
        disabled={!sufficient}
        className="btn btn-pink w-100 text-uppercase"
        onClick={refreshAccounts}
      />
      <span className="text-muted small mt-2">
        One play costs {lamportsToSolString(gameCostLamports)}
      </span>
    </div>
  );
}
