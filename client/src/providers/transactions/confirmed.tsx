import * as React from "react";

import { useDispatch, TrackedCommitment, COMMITMENT_PARAM } from "./index";
import { useConnection } from "providers/rpc";
import * as Bytes from "utils/bytes";
import { AccountInfo } from "@solana/web3.js";
import { useAccountsState } from "providers/accounts";

export const DEBUG_MODE = new URLSearchParams(window.location.search).has(
  "debug"
);

// Determine commitment levels to subscribe to. "singleGossip" is used
// to stop tx send retries so it must be returned
export const subscribedCommitments = (): TrackedCommitment[] => {
  if (DEBUG_MODE) return ["singleGossip"];
  switch (COMMITMENT_PARAM) {
    case "recent": {
      return [COMMITMENT_PARAM, "singleGossip"];
    }
    default: {
      return ["singleGossip"];
    }
  }
};

type Props = { children: React.ReactNode };
export function ConfirmedHelper({ children }: Props) {
  const dispatch = useDispatch();
  const connection = useConnection();
  const accounts = useAccountsState().accounts;

  React.useEffect(() => {
    if (connection === undefined || accounts === undefined) return;
    if (DEBUG_MODE) return;

    const commitments = subscribedCommitments();
    const partitionCount = accounts.programAccounts.length;

    const accountSubscriptions = accounts.programAccounts.map(
      (account, partition) =>
        commitments.map((commitment) =>
          connection.onAccountChange(
            account,
            (accountInfo: AccountInfo<Buffer>, { slot }) => {
              const ids = new Set(Bytes.programDataToIds(accountInfo.data));
              const activeIdPartition = {
                ids,
                partition,
                partitionCount,
              };
              dispatch({
                type: "update",
                activeIdPartition,
                commitment,
                estimatedSlot: slot,
                receivedAt: performance.now(),
              });
            },
            commitment
          )
        )
    );

    return () => {
      accountSubscriptions.forEach((listeners) => {
        listeners.forEach((listener: any) => {
          connection.removeAccountChangeListener(listener);
        });
      });
    };
  }, [dispatch, connection, accounts]);

  return <>{children}</>;
}
