import * as React from "react";
import { TransactionState, COMMITMENT_PARAM } from "providers/transactions";
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

  const renderContent = () => {
    if (!selectedTx) return null;

    return (
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-card card mb-0">
            <div className="card-header">
              <h4 className="card-header-title">Transaction Details</h4>

              <button type="button" className="close" onClick={onClose}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="card-body">
              <TransactionDetails transaction={selectedTx} />
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
  const clusterParam = useClusterParam();
  const { signature, feeAccount, programAccount } = transaction.details;
  const explorerLink = (path: string) =>
    `https://explorer.solana.com/${path}?${clusterParam}`;
  const feeAddress = feeAccount.toBase58();
  const dataAddress = programAccount.toBase58();

  function displaySignature() {
    return (
      <>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="">Signature</div>
          <div>
            <a
              href={explorerLink("tx/" + signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-white"
            >
              <span className="fe fe-external-link mr-2"></span>
              Explorer
            </a>
          </div>
        </div>
        <div className="d-flex mb-4">
          <span className="badge badge-dark overflow-hidden">
            <h4 className="mb-0 text-truncate">{signature}</h4>
          </span>
        </div>
      </>
    );
  }

  function displayAccounts() {
    return (
      <>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="">Fee Account</div>
          <div>
            <a
              href={explorerLink("address/" + feeAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-white"
            >
              <span className="fe fe-external-link mr-2"></span>
              Explorer
            </a>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-4 pb-4 border-bottom">
          <div className="">Break Account</div>
          <div>
            <a
              href={explorerLink("address/" + dataAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-white"
            >
              <span className="fe fe-external-link mr-2"></span>
              Explorer
            </a>
          </div>
        </div>
      </>
    );
  }

  function displayFinalized() {
    if (transaction.status === "success") {
      if (transaction.pending) {
        return (
          <div>
            <span className="spinner-grow spinner-grow-sm mr-2"></span>
            Pending
          </div>
        );
      } else {
        return <span className="text-success">Finalized</span>;
      }
    } else {
      return "N/A";
    }
  }

  function displayConfTime() {
    if (transaction.status === "timeout") {
      return <span className="text-warning">Timed out</span>;
    }
    if (transaction.status === "success") {
      const confTime = transaction.timing[COMMITMENT_PARAM];
      if (confTime) {
        return <span className="text-success">{confTime} sec</span>;
      }
    }
    return (
      <div>
        <span className="spinner-grow spinner-grow-sm mr-2"></span>
        Processing
      </div>
    );
  }

  return (
    <>
      {displaySignature()}
      {displayAccounts()}
      <div className="d-flex justify-content-between mb-4">
        <div className="">Confirmation Time</div>
        {displayConfTime()}
      </div>
      {transaction.status === "success" && (
        <div className="d-flex justify-content-between mb-4">
          <div className="">Estimated Block</div>
          {transaction.slot.estimated}
        </div>
      )}
      <div className="d-flex justify-content-between">
        <div className="">Finalization Status</div>
        {displayFinalized()}
      </div>
    </>
  );
}
