import React from "react";

import { LoadingPhase } from "providers/game";

export function LoadingModal({
  show,
  wallet,
  phase,
}: {
  show: boolean;
  wallet?: boolean;
  phase?: LoadingPhase;
}) {
  const renderContent = () => {
    if (!show) return null;
    let loadingText = "Loading";
    if (wallet) {
      loadingText = "Fetching wallet";
    } else if (phase) {
      switch (phase) {
        case "config":
          loadingText = "Initializing";
          break;
        case "blockhash":
          loadingText = "Connecting to cluster";
          break;
        case "costs":
          loadingText = "Calculating game cost";
          break;
        case "socket":
          loadingText = "Connecting to transaction forwarder";
          break;
        case "creating-accounts":
          loadingText = "Creating game accounts";
          break;
      }
    }

    return (
      <div className="modal-dialog modal-dialog-centered lift justify-content-center">
        <div className="modal-content w-auto">
          <div className="py-4 pl-4 pr-5">
            <div className="d-flex align-items-center justify-content-center">
              <span className="spinner-grow spinner-grow-sm mr-3"></span>
              <h3 className="mb-0">{loadingText}...</h3>
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
