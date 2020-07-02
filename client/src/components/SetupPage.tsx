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

type UserInfo = {
  idToken: string;
  verifier_id: string;
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
  const [userInfo, setUserInfo] = React.useState<UserInfo>();
  const [nodeDetails, setNodeDetails] = React.useState<NodeDetails>();
  const history = useHistory();
  const location = useLocation();

  const responseGoogle = React.useCallback(
    (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
      if (!("code" in response)) {
        const verifier_id = response.getBasicProfile().getEmail();
        const idToken = response.getAuthResponse().id_token;
        setUserInfo({ verifier_id, idToken });
      }
    },
    []
  );

  const { signIn, loaded } = useGoogleLogin({
    clientId: CLIENT_ID,
    onSuccess: responseGoogle,
    onFailure: (err) => console.error("Failed to login", err),
    isSignedIn: true,
  });

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
    if (!nodeDetails || !userInfo) return;

    const { torusNodeEndpoints, torusIndexes } = nodeDetails;
    const { idToken, verifier_id } = userInfo;

    let unmounted = false;
    (async () => {
      const torus = new Torus();
      try {
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
        const torusAccount = new Account(keyPair.secretKey);
        setAccount(torusAccount);
      } catch (err) {
        console.error("failed to fetch torus key", err);
      }
    })();

    return () => {
      unmounted = true;
    };
  }, [nodeDetails, userInfo, setAccount]);

  React.useEffect(() => {
    if (account) {
      history.push({ ...location, pathname: "/game" });
    }
  }, [account, history, location]);

  const loadingWallet = !!userInfo;
  const showWalletSetup = loaded && !userInfo;
  const showLoading = !showWalletSetup;
  return (
    <>
      <div className="container min-vh-100 d-flex flex-column">
        <div>
          <Header />
        </div>
      </div>
      <LoadingModal show={showLoading} wallet={loadingWallet} />
      <div className={`modal fade${showWalletSetup ? " show" : ""}`}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-card card mb-0">
              <div className="card-header">Setup Wallet</div>
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
                        <span className="btn btn-white" onClick={signIn}>
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
      <Overlay show />
    </>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
