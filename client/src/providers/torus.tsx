import * as React from "react";
import Torus from "@toruslabs/torus.js";
import NodeDetailsManager from "@toruslabs/fetch-node-details";
import nacl from "tweetnacl";
import { Account } from "@solana/web3.js";
import {
  useGoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from "react-google-login";

import { reportError } from "utils";

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

type ConnectionMode = "cached" | "fresh";
type FetchStatus = "fetching" | "reloading" | "success" | "failure";

type State = {
  enabled: boolean;
  error?: string;
  loaded: boolean;
  loadingWallet: boolean;
  email?: string;
  wallet?: Account;
  connect: (mode: ConnectionMode) => void;
  disconnect: () => void;
};

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function TorusProvider({ children }: Props) {
  const [fetchStatus, setFetchStatus] = React.useState<FetchStatus>();
  const [googleResponse, setGoogleResponse] = React.useState<
    GoogleLoginResponse
  >();
  const [nodeDetails, setNodeDetails] = React.useState<NodeDetails>();
  const [wallet, setWallet] = React.useState<Account>();
  const [error, setError] = React.useState<string>();

  const responseGoogle = React.useCallback(
    async (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
      if (!("code" in response)) {
        setGoogleResponse(response);
      }
    },
    []
  );

  const { signIn, loaded } = useGoogleLogin({
    clientId: USE_TORUS_TESTNET ? TEST_CLIENT_ID : CLIENT_ID,
    onSuccess: responseGoogle,
    onFailure: (err) => {
      if (!ENABLE_TORUS) return;
      reportError(err, "Google login failed");
      setFetchStatus("failure");
      setError("Failed to login");
    },
    isSignedIn: ENABLE_TORUS,
  });

  const disconnect = React.useCallback(() => {
    if (!googleResponse) return;
    googleResponse.disconnect();
    setGoogleResponse(undefined);
  }, [googleResponse]);

  const connect = React.useCallback(
    (mode: ConnectionMode) => {
      if (mode === "fresh") {
        setFetchStatus("fetching");
        disconnect();
        signIn();
      } else if (mode === "cached") {
        setFetchStatus("reloading");
      }
    },
    [disconnect, signIn]
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

  // Detects when a user has signed in and fetches the user's Torus private key
  React.useEffect(() => {
    if (!nodeDetails || !googleResponse) return;

    let connectionMode: ConnectionMode;
    if (fetchStatus === "reloading") {
      connectionMode = "cached";
    } else if (fetchStatus === "fetching") {
      connectionMode = "fresh";
    } else {
      return;
    }

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
        if (connectionMode === "cached") {
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
        setWallet(new Account(keyPair.secretKey));
        setFetchStatus("success");
      } catch (err) {
        reportError(err, "failed to fetch torus key");
        setFetchStatus("failure");
        setError("Failed to fetch Torus key");
      }
    })();

    return () => {
      unmounted = true;
    };
  }, [nodeDetails, googleResponse, fetchStatus]);

  const state = React.useMemo(
    () => ({
      enabled: ENABLE_TORUS,
      loaded: loaded || !ENABLE_TORUS,
      loadingWallet: fetchStatus === "fetching" || fetchStatus === "reloading",
      error,
      wallet,
      email: googleResponse?.getBasicProfile().getEmail(),
      connect,
      disconnect,
    }),
    [loaded, fetchStatus, error, wallet, googleResponse, connect, disconnect]
  );

  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export function useTorusState(): State {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useTorusState must be used within a TorusProvider`);
  }
  return state;
}
