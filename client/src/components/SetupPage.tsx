import * as React from "react";
import nacl from "tweetnacl";
import NodeDetailsManager from "@toruslabs/fetch-node-details";
import Torus from "@toruslabs/torus.js";
import { Account } from "@solana/web3.js";
import { useAccountState } from "providers/account";
import {
  useGoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from "react-google-login";
import { Header } from "./Header";
import { LoadingModal } from "./LoadingModal";
import { useHistory, useLocation } from "react-router-dom";
import { PAYMENT_ACCOUNT } from "utils";

type NodeDetails = {
  torusNodeEndpoints: any;
  torusIndexes: any;
};

const CLIENT_ID =
  "785716588020-p8kdid1dltqsafcl23g82fb9funikaj7.apps.googleusercontent.com";
const VERIFIER = "breaksolana-google";

// Eager load because it's quite slow
const NODE_DETAILS = new NodeDetailsManager({
  network: "ropsten",
  proxyAddress: "0x4023d2a0D330bF11426B12C6144Cfb96B7fa6183",
}).getNodeDetails();

export default function Setup() {
  const [account, setAccount] = useAccountState();
  const [googleResponse, setGoogleResponse] = React.useState<
    GoogleLoginResponse
  >();
  const [nodeDetails, setNodeDetails] = React.useState<NodeDetails>();
  const history = useHistory();
  const location = useLocation();
  const [newSignIn, setNewSignIn] = React.useState(false);
  const [error, setError] = React.useState("");

  const responseGoogle = React.useCallback(
    async (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
      if (!("code" in response)) {
        setGoogleResponse(response);
      }
    },
    []
  );

  const { signIn, loaded } = useGoogleLogin({
    clientId: CLIENT_ID,
    onSuccess: responseGoogle,
    onFailure: (err) => {
      console.error("Failed to login", err);
      setError(err.details);
    },
    isSignedIn: true,
  });

  const onSignIn = React.useCallback(() => {
    setNewSignIn(true);
    signIn();
  }, [signIn]);

  React.useEffect(() => {
    let unmounted = false;
    NODE_DETAILS.then((details) => {
      !unmounted && setNodeDetails(details);
    }).catch((err) => {
      console.error("failed to fetch torus node details", err);
    });

    return () => {
      unmounted = true;
    };
  }, []);

  React.useEffect(() => {
    if (!nodeDetails || !googleResponse) return;

    let unmounted = false;
    (async () => {
      const torus = new Torus();
      const { torusNodeEndpoints, torusIndexes } = nodeDetails;

      try {
        let idToken = googleResponse.getAuthResponse().id_token;
        if (!newSignIn) {
          // Ensure that we are not using a cached auth token
          idToken = (await googleResponse.reloadAuthResponse()).id_token;
        }

        const verifier_id = googleResponse.getBasicProfile().getEmail();
        const { privKey } = await torus.retrieveShares(
          torusNodeEndpoints,
          torusIndexes,
          VERIFIER,
          { verifier_id },
          idToken
        );
        if (unmounted) return;
        const torusKey = Buffer.from(privKey.toString(), "hex");
        const keyPair = nacl.sign.keyPair.fromSeed(torusKey);
        setAccount(new Account(keyPair.secretKey));
      } catch (err) {
        console.error("failed to fetch torus key", err);
        setGoogleResponse(undefined);
        setError("Failed to fetch Torus key");
      }
    })();

    return () => {
      unmounted = true;
    };
  }, [nodeDetails, googleResponse, newSignIn, setAccount]);

  React.useEffect(() => {
    if (account) {
      history.push({ ...location, pathname: "/game" });
    }
  }, [account, history, location]);

  const loadingWallet = !!googleResponse;
  const showWalletSetup = loaded && !googleResponse;
  const showLoading = !showWalletSetup;
  return (
    <>
      <div className={`modal z-auto fade${showWalletSetup ? " show" : ""}`}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-card card mb-0">
              <div className="card-header">
                <div className="flex-shrink-0 flex-basis-auto">
                  Setup Wallet
                </div>
                <div className="text-truncate text-warning small ml-5">
                  {error}
                </div>
              </div>

              <div className="card-body">
                <ul className="list-group list-group-flush list my-n4">
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
                          onClick={onSignIn}
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

                  <li className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col">
                        <h4 className="mb-1">Local wallet</h4>
                        <p className="small mb-0 text-muted">Less Secure</p>
                      </div>
                      <div className="col-auto">
                        <span
                          className="btn btn-white"
                          onClick={() => setAccount(PAYMENT_ACCOUNT)}
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
