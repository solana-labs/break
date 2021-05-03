import * as React from "react";

import { LoadingModal } from "components/LoadingModal";
import { LOCAL_WALLET, useWalletState } from "providers/wallet";
import { useTorusState } from "providers/torus";

export function WalletPage() {
  const walletState = useWalletState();
  const torusState = useTorusState();
  const loading = !torusState.loaded;
  const loadingWallet = torusState.loadingWallet;
  const signedInEmail = torusState.email;

  const selectWallet = walletState.selectWallet;
  React.useEffect(() => {
    if (torusState.wallet) {
      selectWallet(torusState.wallet);
    }
  }, [torusState.wallet, selectWallet]);

  return (
    <>
      <div className={`modal z-auto fade${!loading ? " show" : ""}`}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-card card mb-0">
              <div className="card-header">
                <div className="flex-shrink-0 flex-basis-auto">
                  Select App Wallet
                </div>
                <div className="text-truncate text-warning small ml-5">
                  {torusState.error}
                </div>
              </div>

              <div className="card-body">
                <ul className="list-group list-group-flush list my-n4">
                  {signedInEmail && (
                    <li className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col">
                          <h4 className="mb-1">Current wallet</h4>
                          <p className="small mb-0 text-muted">
                            Account:{" "}
                            <span className="text-primary">
                              {signedInEmail}
                            </span>
                          </p>
                        </div>
                        <div className="col-auto">
                          <span
                            className="btn btn-primary"
                            onClick={() => torusState.connect("cached")}
                          >
                            Select
                          </span>
                        </div>
                      </div>
                    </li>
                  )}

                  {torusState.enabled && (
                    <li className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col">
                          <h4 className="mb-1">Recoverable wallet</h4>
                          <p className="small mb-0 text-muted">
                            Powered by <a href="https://tor.us/">Torus</a>
                          </p>
                        </div>
                        <div className="col-auto">
                          <span
                            className="btn btn-white"
                            onClick={() => torusState.connect("fresh")}
                          >
                            <img
                              height="18"
                              width="18"
                              src="/google.svg"
                              className="mt-n1"
                              alt="Google"
                            />
                          </span>
                        </div>
                      </div>
                    </li>
                  )}

                  <li className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col">
                        <h4 className="mb-1">Local wallet</h4>
                        <p className="small mb-0 text-muted">
                          Saved to browser storage
                        </p>
                      </div>
                      <div className="col-auto">
                        <span
                          className="btn btn-white"
                          onClick={() => {
                            torusState.disconnect();
                            walletState.selectWallet(LOCAL_WALLET);
                          }}
                        >
                          Select
                        </span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoadingModal show={loading} wallet={loadingWallet} />
      <Overlay show={loading || loadingWallet} />
    </>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
