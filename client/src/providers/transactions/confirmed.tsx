import * as React from "react";

import { AccountInfo, Connection, Commitment } from "@solana/web3.js";
import { useConfig, useAccounts } from "../api";
import { useDispatch, ActionType } from "./index";
import * as Bytes from "utils/bytes";

const commitmentParam = (): Commitment => {
  const commitment = new URLSearchParams(window.location.search).get(
    "commitment"
  );
  switch (commitment) {
    case "recent":
    case "single":
    case "singleGossip":
    case "max":
    case "root": {
      return commitment;
    }
    default: {
      return "singleGossip";
    }
  }
};

type Props = { children: React.ReactNode };
export function ConfirmedHelper({ children }: Props) {
  const dispatch = useDispatch();
  const config = useConfig();
  const accounts = useAccounts();

  React.useEffect(() => {
    if (!config || !accounts) return;

    const connection = new Connection(config.clusterUrl, "recent");
    const rootSubscription = connection.onRootChange((root: number) =>
      dispatch({ type: ActionType.RecordRoot, root })
    );

    const commitment = commitmentParam();
    const partitionCount = accounts.programDataAccounts.length;
    const accountSubscriptions = accounts.programDataAccounts.map(
      (account, partition) => {
        return connection.onAccountChange(
          account,
          (accountInfo: AccountInfo, { slot }) => {
            const ids = new Set(Bytes.toIds(accountInfo.data));
            const activeIdPartition = { ids, partition, partitionCount };
            dispatch({ type: ActionType.UpdateIds, activeIdPartition, slot });
          },
          commitment
        );
      }
    );

    return () => {
      connection.removeRootChangeListener(rootSubscription);
      accountSubscriptions.forEach((listener) => {
        connection.removeAccountChangeListener(listener);
      });
    };
  }, [dispatch, config, accounts]);

  return <>{children}</>;
}
