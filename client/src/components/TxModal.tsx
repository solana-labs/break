import * as React from "react";
import { TransactionState } from "providers/transactions";
import {
  useSelectTransaction,
  useSelectedTransaction,
} from "providers/transactions/selected";
import { useClusterParam } from "providers/api";

export function TransactionModal() {
  const selectedTx = useSelectedTransaction();
  const selectTx = useSelectTransaction();
  const onClose = () => selectTx(undefined);
  const show = !!selectedTx;
  const clusterParam = useClusterParam();

  const renderContent = () => {
    if (!selectedTx) return null;

    const { signature } = selectedTx;
    const explorerLink = `https://explorer.solana.com/tx/${signature}?${clusterParam}`;

    return (
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
  transaction,
}: {
  transaction: TransactionState;
}) {
  if (!transaction) return null;

  function displaySignature() {
    if (transaction.signature) {
      return (
        <p>
          Signature: <code className="text-white">{transaction.signature}</code>
        </p>
      );
    }

    return null;
  }

  function displayFinalized() {
    if (transaction.status === "success") {
      return (
        <p>
          Finalization Status: {transaction.pending ? "Pending" : "Finalized"}
        </p>
      );
    }
    return null;
  }

  function displayConfTime() {
    switch (transaction.status) {
      case "success":
        return <p>Confirmation Time: {transaction.confirmationTime} sec</p>;
      case "pending":
        return <p>Processing</p>;
      case "timeout":
        return <p>Unconfirmed: Timed out</p>;
    }
  }

  return (
    <div className={"square-info-container"}>
      {displayConfTime()}
      {displaySignature()}
      {displayFinalized()}
    </div>
  );
}
