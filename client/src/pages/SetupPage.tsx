import * as React from "react";
import { useHistory, useLocation } from "react-router-dom";
import nacl from "tweetnacl";
import NodeDetailsManager from "@toruslabs/fetch-node-details";
import Torus from "@toruslabs/torus.js";
import { Account } from "@solana/web3.js";

import { Header } from "components/Header";
import { LoadingModal } from "components/LoadingModal";
import { useAccountState } from "providers/account";
import {
  useGoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from "react-google-login";
import { PAYMENT_ACCOUNT, reportError } from "utils";
import { useGameState } from "providers/game";

const origin = window.location.origin;
const USE_TORUS_TESTNET = origin === "http://localhost:3000";

// Torus is only enabled for authorized domains
const ENABLE_TORUS =
  USE_TORUS_TESTNET ||
  origin === "https://break.solana.com" ||
  origin === "https://staging.break.solana.com";

type NodeDetails = {
  torusNodeEndpoints: any;
  torusIndexes: any;
  torusNodePub: any;
};

const CLIENT_ID =
  "785716588020-b5a4fheugq38c23do3p2l73iumfrklnr.apps.googleusercontent.com";
const TEST_CLIENT_ID =
  "785716588020-p8kdid1dltqsafcl23g82fb9funikaj7.apps.googleusercontent.com";
const VERIFIER = "breaksolana-google";

const NODE_DETAILS = USE_TORUS_TESTNET
  ? new NodeDetailsManager({
      network: "ropsten",
      proxyAddress: "0x4023d2a0D330bF11426B12C6144Cfb96B7fa6183",
    })
  : (new (NodeDetailsManager as any)() as NodeDetailsManager);

type GoogleStatus = "cached" | "fresh";
export default function Setup() {
  const [account, setAccount] = useAccountState();
  const [gameState] = useGameState();
  const [googleStatus, setGoogleStatus] = React.useState<GoogleStatus>();
  const [googleResponse, setGoogleResponse] = React.useState<
    GoogleLoginResponse
  >();
  const [nodeDetails, setNodeDetails] = React.useState<NodeDetails>();
  const history = useHistory();
  const location = useLocation();
  const [error, setError] = React.useState("");

  const responseGoogle = React.useCallback(
    async (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
      if (!("code" in response)) {
        setGoogleResponse(response);
      }
    },
    []
  );

  const disconnectGoogle = React.useCallback(() => {
    if (!googleResponse) return;
    googleResponse.disconnect();
    setGoogleResponse(undefined);
  }, [googleResponse]);

  const { signIn, loaded } = useGoogleLogin({
    clientId: USE_TORUS_TESTNET ? TEST_CLIENT_ID : CLIENT_ID,
    onSuccess: responseGoogle,
    onFailure: (err) => {
      if (!ENABLE_TORUS) return;
      reportError(err, "Google login failed");
      setGoogleStatus(undefined);
      setError("Failed to login");
    },
    isSignedIn: ENABLE_TORUS,
  });

  const onSignIn = React.useCallback(
    (status: GoogleStatus) => {
      setGoogleStatus(status);
      if (status === "fresh") {
        disconnectGoogle();
        signIn();
      }
    },
    [disconnectGoogle, signIn]
  );

  React.useEffect(() => {
    if (!ENABLE_TORUS) return;

    let unmounted = false;
    NODE_DETAILS.getNodeDetails()
      .then((details) => {
        !unmounted && setNodeDetails(details);
      })
      .catch((err) => {
        reportError(err, "Fetching torus node details");
      });

    return () => {
      unmounted = true;
    };
  }, []);

  React.useEffect(() => {
    if (!nodeDetails || !googleResponse || !googleStatus) return;

    let unmounted = false;
    (async () => {
      const torus = new Torus({});
      const { torusNodeEndpoints, torusNodePub, torusIndexes } = nodeDetails;

      try {
        const verifierId = googleResponse.getBasicProfile().getEmail();

        // Creates a new key for the verifierId if it doesn't exist yet
        await torus.getPublicAddress(
          torusNodeEndpoints,
          torusNodePub,
          { verifier: VERIFIER, verifierId },
          false
        );

        let idToken = googleResponse.getAuthResponse().id_token;
        if (googleStatus === "cached") {
          idToken = (await googleResponse.reloadAuthResponse()).id_token;
        }

        const { privKey } = await torus.retrieveShares(
          torusNodeEndpoints,
          torusIndexes,
          VERIFIER,
          { verifier_id: verifierId },
          idToken
        );
        if (unmounted) return;
        const torusKey = Buffer.from(privKey.toString(), "hex");
        const keyPair = nacl.sign.keyPair.fromSeed(torusKey);
        setAccount(new Account(keyPair.secretKey));
      } catch (err) {
        reportError(err, "failed to fetch torus key");
        setGoogleStatus(undefined);
        setError("Failed to fetch Torus key");
      }
    })();

    return () => {
      unmounted = true;
    };
  }, [nodeDetails, googleResponse, googleStatus, setAccount]);

  React.useEffect(() => {
    if (gameState !== "payment" || account) {
      history.push({ ...location, pathname: "/game" });
    }
  }, [gameState, account, history, location]);

  const loadingWallet = !!googleResponse;
  const showWalletSetup = loaded && !googleStatus;
  const showLoading = !showWalletSetup;
  return (
    <>
      <div className={`modal z-auto fade${showWalletSetup ? " show" : ""}`}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-card card mb-0">
              <div className="card-header">
                <div className="flex-shrink-0 flex-basis-auto">
                  Select Wallet
                </div>
                <div className="text-truncate text-warning small ml-5">
                  {error}
                </div>
              </div>

              <div className="card-body">
                <ul className="list-group list-group-flush list my-n4">
                  {googleResponse && (
                    <li className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col">
                          <h4 className="mb-1">Current wallet</h4>
                          <p className="small mb-0 text-muted">
                            Account:{" "}
                            <span className="text-primary">
                              {googleResponse.getBasicProfile().getEmail()}
                            </span>
                          </p>
                        </div>
                        <div className="col-auto">
                          <span
                            className="btn btn-primary"
                            onClick={() => onSignIn("cached")}
                          >
                            Select
                          </span>
                        </div>
                      </div>
                    </li>
                  )}

                  {ENABLE_TORUS && (
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
                            onClick={() => onSignIn("fresh")}
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
                            disconnectGoogle();
                            setAccount(PAYMENT_ACCOUNT);
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
      <div className="container min-vh-100 d-flex flex-column">
        <Header />
      </div>
      <LoadingModal show={showLoading} wallet={loadingWallet} />
      <Overlay show={showLoading} />
    </>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
