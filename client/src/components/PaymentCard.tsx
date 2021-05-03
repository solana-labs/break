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

import { useBalanceState } from "providers/rpc/balance";
import { useWalletState } from "providers/wallet";
import { useConnection } from "providers/rpc";
import { useBlockhash } from "providers/rpc/blockhash";
import { useAccountsState } from "providers/accounts";
import { useConfig } from "providers/server/http";
import { useGameState } from "providers/game";

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
  const config = useConfig();
  const connection = useConnection();
  const recentBlockhash = useBlockhash();
  const walletState = useWalletState();
  const accountsState = useAccountsState();
  const closingAccounts = accountsState.status === "closing";
  const gameCostLamports = accountsState.creationCost || 0;
  const gameCostSol = gameCostLamports / LAMPORTS_PER_SOL;
  const address = account.publicKey.toBase58();

  const balanceState = useBalanceState();
  const balance = balanceState.payer;
  const balanceSufficient =
    balance !== "loading" && balance >= gameCostLamports;
  const unsettledTotal = balanceState.feePayers.reduce(
    (sum, next) => next + sum,
    0
  );

  const trustWalletDeepLink = getTrustWalletLink(address, gameCostSol);
  const [copied, setCopied] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const [showWithdraw, setShowWithdraw] = React.useState(false);
  const [toPubkey, setToPubkey] = React.useState<PublicKey>();
  const [withdrawMessage, setWithdrawMessage] = React.useState("");

  const [airdropping, setAirdropping] = React.useState(false);
  const airdropLock = React.useRef(false);
  React.useEffect(() => {
    if (!config || !connection) return;

    if (
      config.airdropEnabled &&
      !airdropLock.current &&
      balance < gameCostLamports
    ) {
      airdropLock.current = true;
      setAirdropping(true);
      (async () => {
        try {
          await connection.requestAirdrop(account.publicKey, LAMPORTS_PER_SOL);
        } finally {
          airdropLock.current = false;
          // intentionally not called so that "Airdropping" message
          // is displayed until balance is updated
          // setAirdropping(false);
        }
      })();
    }
  }, [
    connection,
    config,
    walletState,
    balance,
    trustWalletDeepLink,
    account,
    gameCostLamports,
  ]);

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

  const keypairUrl = React.useMemo(() => {
    const keypair = JSON.stringify(
      Array.prototype.slice.call(account.secretKey)
    );
    const blob = new Blob([keypair], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [account]);

  return (
    <div className="card mb-0">
      <div className="card-header">
        <h3 className="card-header-title font-weight-bold">Wallet</h3>
        {balance !== "loading" && (
          <span
            className={`text-${
              balanceSufficient ? "primary" : airdropping ? "info" : "warning"
            }`}
          >
            {balanceSufficient
              ? "Press Play to Start"
              : trustWalletDeepLink
              ? "Add Funds to Play"
              : airdropping
              ? "Airdropping funds"
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

        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="font-weight-bold">Live Balance</div>
          <span
            className="btn btn-sm btn-white ml-3"
            onClick={() => {
              setShowWithdraw((show) => !show);
              setWithdrawMessage("");
            }}
          >
            {showWithdraw ? "Hide" : "Withdraw"}
          </span>
        </div>

        <div className="d-flex mb-4 pb-4 border-bottom">
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

        {unsettledTotal > 0 && (
          <>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="font-weight-bold">Unsettled Balance</div>
              <span
                className="btn btn-sm btn-white ml-3"
                onClick={() => accountsState.closeAccounts()}
              >
                {closingAccounts ? (
                  <span>
                    <span className="spinner-grow spinner-grow-sm mr-2"></span>
                    Settling
                  </span>
                ) : (
                  "Settle Funds"
                )}
              </span>
            </div>

            <div className="d-flex mb-4 pb-4 border-bottom">
              <span className="badge badge-dark">
                <h4 className="mb-0">{lamportsToSolString(unsettledTotal)}</h4>
              </span>
            </div>
          </>
        )}

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="font-weight-bold">Keypair File</div>
          <a
            className="btn btn-sm btn-white"
            href={keypairUrl}
            download={`break-keypair-${account.publicKey.toBase58()}.json`}
            onClick={(e) => {
              const confirmed = window.confirm(
                "Are you sure you want to download this wallet? It must be used with the Solana CLI tooling."
              );
              if (!confirmed) {
                e.stopPropagation();
              }
            }}
          >
            {"Download"}
          </a>
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <div className="font-weight-bold">Change Wallet</div>
          <span
            className="btn btn-sm btn-white"
            onClick={() => walletState.selectWallet(undefined)}
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
  const balance = useBalanceState().payer;
  const gameState = useGameState();
  const accountsState = useAccountsState();
  const gameCostLamports = accountsState.creationCost || 0;
  const sufficient = balance >= gameCostLamports;

  return (
    <div className="card-footer d-flex flex-column align-items-center">
      <input
        type="button"
        value="Play"
        disabled={!sufficient}
        className="btn btn-pink w-100 text-uppercase"
        onClick={() => gameState.prepareGame()}
      />
      <span className="text-muted small mt-2">
        One play costs {lamportsToSolString(gameCostLamports)}
      </span>
    </div>
  );
}
