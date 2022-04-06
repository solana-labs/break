import * as React from "react";

import { useDispatch, TrackedCommitment } from "./index";
import { useConnection } from "providers/rpc";
import * as Bytes from "utils/bytes";
import { AccountInfo } from "@solana/web3.js";
import { useAccountsState } from "providers/accounts";
import { useClientConfig } from "providers/config";

// Determine commitment levels to subscribe to. "singleGossip" is used
// to stop tx send retries so it must be returned
export const subscribedCommitments = (
  trackedCommitment: TrackedCommitment,
  showDebugTable: boolean
): TrackedCommitment[] => {
  if (showDebugTable) return ["confirmed"];
  switch (trackedCommitment) {
    case "processed": {
      return ["processed", "confirmed"];
    }
    default: {
      return ["confirmed"];
    }
  }
};

type Props = { children: React.ReactNode };
export function ConfirmedHelper({ children }: Props) {
  const dispatch = useDispatch();
  const connection = useConnection();
  const accounts = useAccountsState().accounts;
  const [{ showDebugTable, trackedCommitment }] = useClientConfig();

  React.useEffect(() => {
    if (connection === undefined || accounts === undefined) return;
    if (showDebugTable) return;

    const commitments = subscribedCommitments(
      trackedCommitment,
      showDebugTable
    );
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
  }, [dispatch, connection, accounts, showDebugTable, trackedCommitment]);

  return <>{children}</>;
}
