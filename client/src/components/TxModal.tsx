import * as React from "react";
import { UserTransaction } from "providers/transactions";
import {
  useSelectTransaction,
  useSelectedTransaction
} from "providers/transactions/selected";
import { useConfig } from "providers/api";

export function TransactionModal() {
  const selectedTx = useSelectedTransaction();
  const selectTx = useSelectTransaction();
  const onClose = () => selectTx(undefined);
  const show = !!selectedTx;
  const { clusterParam } = useConfig();

  const renderContent = () => {
    if (!selectedTx) return null;

    const { signature } = selectedTx;
    const explorerLink = `https://explorer.solana.com/tx/${signature}?${clusterParam}`;

    return (
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-card card">
            <div className="card-header">
              <h4 className="card-header-title">Transaction Details</h4>

              <button type="button" className="close" onClick={onClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="card-body">
              <TransactionDetails transaction={selectedTx} />
            </div>
            <div className="card-footer">
              <a
                href={explorerLink}
                target={"_blank"}
                rel="noopener noreferrer"
                className="btn btn-pink text-uppercase"
              >
                View on Explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`modal fade${show ? " show" : ""}`} onClick={onClose}>
        {renderContent()}
      </div>
      <Overlay show={show} />
    </>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}

export function TransactionDetails({
  transaction
}: {
  transaction?: UserTransaction;
}) {
  if (!transaction) return null;

  const { signature, confirmationTime, status } = transaction;

  function displaySignature() {
    if (signature) {
      return (
        <p>
          Signature: <code className="text-white">{signature}</code>
        </p>
      );
    }

    return null;
  }

  function displayConfTime() {
    if (confirmationTime === Number.MAX_VALUE) {
      return <p>Unconfirmed: Timed out</p>;
    } else if (confirmationTime > 0) {
      return <p>Confirmation Time: {confirmationTime} sec</p>;
    } else {
      return <p>Processing</p>;
    }
  }

  function displayErrorMsg() {
    if (typeof status === "object") {
      return <p>Error: {JSON.stringify(status)}</p>;
    }
    return null;
  }

  return (
    <div className={"square-info-container"}>
      {displayConfTime()}
      {displaySignature()}
      {displayErrorMsg()}
    </div>
  );
}
